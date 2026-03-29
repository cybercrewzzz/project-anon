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

    if (updated.count === 0) {
      // Already ended by chat timeout, disconnect, or manual end — no-op.
      this.logger.log(
        `Session timeout: session ${sessionId} already ended, skipping`,
      );
      return;
    }

    // Clean up Redis session state (hash, messages, keys).
    await this.redis.del(`session:${sessionId}`);
    await this.redis.del(`session:${sessionId}:msgs`);
    await this.redis.del(`session:${sessionId}:keys`);

    this.logger.log(
      `Session timeout: force-ended session ${sessionId} after 45 minutes`,
    );
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
  // ─────────────────────────────────────────────────────────────────────────
  private async handleMatchTimeout(
    job: Job<MatchTimeoutJobData>,
  ): Promise<void> {
    const { sessionId, seekerId } = job.data;

    // Check if a volunteer accepted in the meantime.
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { status: true, listenerId: true, problemId: true },
    });

    if (!session) {
      this.logger.warn(`Match timeout: session ${sessionId} not found`);
      return;
    }

    // If a volunteer accepted (listenerId is non-null), the match:timeout
    // job in accept() should have been cancelled. But if it slipped through,
    // we respect the assignment and do nothing.
    if (session.listenerId) {
      this.logger.log(
        `Match timeout: session ${sessionId} already matched — skipping`,
      );
      return;
    }

    // Only cancel if still active (guards against double processing).
    if (session.status !== SessionStatus.active) {
      this.logger.log(
        `Match timeout: session ${sessionId} is ${session.status} — skipping`,
      );
      return;
    }

    // Cancel the session and expire the associated problem in one transaction.
    await this.prisma.$transaction([
      this.prisma.chatSession.update({
        where: { sessionId },
        data: {
          status: SessionStatus.cancelled_timeout,
          endedAt: new Date(),
          closedReason: 'no_volunteer',
        },
      }),
      this.prisma.userProblem.update({
        where: { problemId: session.problemId },
        data: { status: UserProblemStatus.expired },
      }),
    ]);

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
