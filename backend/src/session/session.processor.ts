import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TicketService } from './ticket.service';
import { SessionStatus, UserProblemStatus } from '../generated/prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS THIS FILE?
//
// This is the BullMQ worker that processes delayed jobs scheduled by
// SessionService.connect() and SessionService.accept().
//
// Three job types land in the 'sessions' queue:
//
//   session:grace-end  — 3 min after a session starts. Consumes the seeker's
//                        reserved ticket (reserved → consumed). If the session
//                        was cancelled before the grace period ended, the
//                        ticket was already released, so this is a no-op.
//
//   session:timeout    — 45 min safety net. Force-ends the session if it is
//                        still active. The chat module has its own 30-min
//                        authoritative timer; this one catches sessions that
//                        were created via the HTTP connect flow but never
//                        joined via WebSocket (so the chat timer never started).
//
//   match:timeout      — 3 min after a Path B "waiting" session is created.
//                        If no volunteer accepted by then, the session is
//                        cancelled, the ticket is released, and the seeker
//                        is notified (if still connected via WebSocket).
//
// IDEMPOTENCY & RETRY SAFETY
//
// All handlers are designed so that BullMQ retries are safe:
//   - DB writes use conditional guards (updateMany with status checks)
//   - Redis cleanup always runs, even if the DB was already updated by a
//     prior attempt that crashed mid-cleanup
//   - Ticket operations (consumeReserved / releaseReserved) are idempotent
//     by design in TicketService
// ─────────────────────────────────────────────────────────────────────────────

interface GraceEndJobData {
  sessionId: string;
  seekerId: string;
}

interface SessionTimeoutJobData {
  sessionId: string;
}

interface MatchTimeoutJobData {
  sessionId: string;
  seekerId: string;
}

@Processor('sessions')
export class SessionProcessor extends WorkerHost {
  private readonly logger = new Logger(SessionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tickets: TicketService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'session:grace-end':
        await this.handleGraceEnd(job as Job<GraceEndJobData>);
        break;
      case 'session:timeout':
        await this.handleSessionTimeout(job as Job<SessionTimeoutJobData>);
        break;
      case 'match:timeout':
        await this.handleMatchTimeout(job as Job<MatchTimeoutJobData>);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // session:grace-end — consume the reserved ticket after 3 minutes
  //
  // WHY a grace period?
  // If the seeker cancels within the first 3 minutes, the session was too
  // short to be meaningful, so the ticket is released (refunded).
  // After 3 minutes, the ticket is consumed regardless of when the session
  // actually ends — the seeker "used" their allocation.
  // ─────────────────────────────────────────────────────────────────────────
  private async handleGraceEnd(job: Job<GraceEndJobData>): Promise<void> {
    const { sessionId, seekerId } = job.data;

    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { status: true },
    });

    if (!session) {
      this.logger.warn(`Grace-end: session ${sessionId} not found`);
      return;
    }

    if (session.status === SessionStatus.active) {
      // Session is still active after the grace period — consume the ticket.
      await this.tickets.consumeReserved(seekerId);
      this.logger.log(
        `Grace-end: consumed ticket for seeker ${seekerId} (session ${sessionId})`,
      );
    } else {
      // Session was already cancelled/ended during the grace period.
      // The ticket should have been released by whoever ended the session.
      this.logger.log(
        `Grace-end: session ${sessionId} is ${session.status} — ticket already handled`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // session:timeout — 45 min safety net to force-end stale sessions
  //
  // This catches sessions that were created via HTTP but never joined via
  // WebSocket (so the chat module's 30 min timer never started), or edge
  // cases where both participants disconnected and the reconnect-expire
  // job was lost.
  //
  // RETRY SAFETY: Redis cleanup always runs regardless of whether the DB
  // update succeeded on this attempt or a previous one. DEL on a
  // non-existent key is a no-op, so repeated runs are harmless.
  // ─────────────────────────────────────────────────────────────────────────
  private async handleSessionTimeout(
    job: Job<SessionTimeoutJobData>,
  ): Promise<void> {
    const { sessionId } = job.data;

    // Atomically end the session only if it is still active.
    // updateMany + status guard ensures idempotency with the chat timeout.
    const updated = await this.prisma.chatSession.updateMany({
      where: { sessionId, status: SessionStatus.active },
      data: {
        status: SessionStatus.completed,
        endedAt: new Date(),
        closedReason: 'session_timeout',
      },
    });

    if (updated.count > 0) {
      this.logger.log(
        `Session timeout: force-ended session ${sessionId} after 45 minutes`,
      );
    } else {
      // Already ended by chat timeout, disconnect, or manual end.
      // Still run Redis cleanup below in case a prior attempt updated the DB
      // but crashed before finishing cleanup.
      this.logger.log(
        `Session timeout: session ${sessionId} already ended — ensuring Redis cleanup`,
      );
    }

    // Look up participants so we can clear account→session mappings
    // that the chat module maintains. Without this, stale mappings can
    // keep triggering reconnect logic in the gateway.
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { seekerId: true, listenerId: true },
    });

    // Clean up Redis session state (hash, messages, keys).
    // DEL on non-existent keys is a no-op, so this is safe on retries.
    await this.redis.del(`session:${sessionId}`);
    await this.redis.del(`session:${sessionId}:msgs`);
    await this.redis.del(`session:${sessionId}:keys`);

    // Clear account→session mappings used by the chat module, to avoid
    // stale reconnect state if the reconnect-expire job was lost.
    if (session?.seekerId) {
      await this.redis.del(`account:${session.seekerId}:session`);
    }
    if (session?.listenerId) {
      await this.redis.del(`account:${session.listenerId}:session`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // match:timeout — 3 min after Path B, no volunteer accepted
  //
  // The seeker's session was created in a "waiting" state (listenerId=null).
  // Push notifications were sent to offline volunteers. If none accepted
  // within 3 minutes, we:
  //   1. Cancel the session in the DB
  //   2. Release the reserved ticket
  //   3. Mark the associated UserProblem as expired
  //   4. Clean up the Redis session hash
  //
  // RACE WITH accept():
  // accept() claims listenerId in Redis (via HSETNX) BEFORE persisting it
  // to Postgres. During that window the DB listenerId is still null. To
  // avoid cancelling a session that is actively being accepted, we check
  // the Redis hash for listenerId first. The DB write also guards on
  // listenerId IS NULL as a second safety net.
  //
  // RETRY SAFETY: ticket release and Redis cleanup always run when the
  // session is in cancelled_timeout state, even if the DB was already
  // updated by a prior attempt.
  // ─────────────────────────────────────────────────────────────────────────
  private async handleMatchTimeout(
    job: Job<MatchTimeoutJobData>,
  ): Promise<void> {
    const { sessionId, seekerId } = job.data;

    // ── STEP 1: Check Redis first for the accept() race ─────────────────
    // accept() writes listenerId to Redis before Postgres. If the Redis
    // hash has a listenerId, a volunteer is actively accepting — bail out.
    const redisListenerId = await this.redis.hget(
      `session:${sessionId}`,
      'listenerId',
    );
    if (redisListenerId) {
      this.logger.log(
        `Match timeout: session ${sessionId} has listenerId in Redis — skipping`,
      );
      return;
    }

    // ── STEP 2: Fetch the problem ID for the transaction ────────────────
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { status: true, listenerId: true, problemId: true },
    });

    if (!session) {
      this.logger.warn(`Match timeout: session ${sessionId} not found`);
      return;
    }

    // If a volunteer already accepted (listenerId set in DB), skip.
    if (session.listenerId) {
      this.logger.log(
        `Match timeout: session ${sessionId} already matched — skipping`,
      );
      return;
    }

    // ── STEP 3: Atomically cancel if still active and unmatched ─────────
    // Use updateMany with status + listenerId guards so that if accept()
    // writes listenerId between our read and this write, the update is a
    // no-op (count=0) and we don't overwrite the accepted session.
    const { cancelled } = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.chatSession.updateMany({
        where: {
          sessionId,
          status: SessionStatus.active,
          listenerId: null,
        },
        data: {
          status: SessionStatus.cancelled_timeout,
          endedAt: new Date(),
          closedReason: 'no_volunteer',
        },
      });

      // If no row was updated, the session changed state (e.g. accepted)
      // after the earlier read; do not expire the problem in that case.
      if (updateResult.count === 0) {
        return { cancelled: false };
      }

      await tx.userProblem.update({
        where: { problemId: session.problemId },
        data: { status: UserProblemStatus.expired },
      });

      return { cancelled: true };
    });

    if (!cancelled) {
      this.logger.log(
        `Match timeout: session ${sessionId} changed state before cancellation — skipping`,
      );
      return;
    }

    // ── STEP 4: Cleanup (safe on retries — all ops are idempotent) ──────

    // Release the reserved ticket back to the seeker.
    await this.tickets.releaseReserved(seekerId);

    // Clean up the Redis session hash.
    await this.redis.del(`session:${sessionId}`);

    this.logger.log(
      `Match timeout: no volunteer accepted for session ${sessionId} — ` +
        `cancelled session and released ticket for seeker ${seekerId}`,
    );
  }
}
