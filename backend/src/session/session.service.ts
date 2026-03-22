import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  AccountStatus,
  SessionStatus,
  UserProblemStatus,
  VerificationStatus,
  type Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchingService } from './matching.service';
import { TicketService } from './ticket.service';
import type { ConnectSessionDto } from './dto/session-connect.dto';

// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS THE SESSION SERVICE?
//
// This is the brain of Task 4. It orchestrates all the steps needed for
// POST /session/connect. It calls MatchingService, TicketService, Prisma,
// Redis, and BullMQ — and coordinates their results into a single flow.
//
// Services contain ALL business logic. They are completely unaware of HTTP.
// They don't know about @Body(), @Param(), status codes etc. — that's the
// controller's job. Services just receive plain data, do their work, and
// return a plain result (or throw an exception).
// ─────────────────────────────────────────────────────────────────────────────

// How long (ms) the seeker waits for a volunteer to accept before timeout.
const MATCH_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

// How long (ms) before the session is force-ended even if still active.
const SESSION_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes

// How long (ms) the grace period is before a ticket is consumed.
const GRACE_END_MS = 3 * 60 * 1000; // 3 minutes

type ConnectResult =
  | {
      sessionId: string;
      volunteerId: string;
      wsRoom: string;
      turnCredentials: {
        urls: string[];
        username: string;
        credential: string;
      };
    }
  | {
      status: 'waiting';
      sessionId: string;
    };

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly matching: MatchingService,
    private readonly tickets: TicketService,
    // @InjectQueue() gives us a BullMQ Queue instance for the 'sessions' queue.
    // A Queue is how you ADD jobs. The actual processing of jobs (workers)
    // is defined separately — in this task that worker code also lives here,
    // but is invoked by BullMQ asynchronously.
    @InjectQueue('sessions') private readonly sessionQueue: Queue,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // connect() — the full logic for POST /session/connect
  //
  // This method follows the exact 8-step algorithm from the task spec.
  // Each step is numbered and explained below.
  // ─────────────────────────────────────────────────────────────────────────
  async connect(seekerId: string, dto: ConnectSessionDto) {
    const { categoryId, feelingLevel, customLabel, idempotencyKey } = dto;

    // ── STEP 1: Idempotency check ────────────────────────────────────────
    //
    // Before doing ANY work, check if we've already processed this exact
    // request. The client sends a unique idempotencyKey with every request.
    //
    // Flow:
    //   - First time we see this key → proceed normally, then store the result
    //   - Second time (retry) → return the stored result immediately
    //
    // This protects against: network retries, double-taps, browser refreshes.
    const idempotencyRedisKey = `idempotency:session-connect:${seekerId}:${idempotencyKey}`;
    const existingResult = await this.redis.get(idempotencyRedisKey);

    if (existingResult) {
      this.logger.log(
        `Idempotency hit for key ${idempotencyKey} — returning cached result`,
      );
      // The stored result is a JSON string. Parse and handle it.
      const parsed = JSON.parse(existingResult) as ConnectResult;
      // If this is a "waiting" result, preserve the original 202 semantics
      // by throwing an HttpException instead of returning normally.
      if ('status' in parsed && parsed.status === 'waiting') {
        throw new HttpException(parsed, HttpStatus.ACCEPTED);
      }
      return parsed;
    }

    // ── STEP 2: Concurrent session check ────────────────────────────────
    //
    // A seeker should only be in ONE session at a time.
    // Check the DB for any session that is currently active or waiting.
    //
    // If found → 409 Conflict. The client should show "you already have an
    // active session" and let the seeker continue or end it first.
    const activeSession = await this.prisma.chatSession.findFirst({
      where: {
        seekerId,
        status: SessionStatus.active,
      },
    });

    if (activeSession) {
      throw new ConflictException({
        statusCode: 409,
        error: 'already_in_session',
        message: 'You already have an active session',
        sessionId: activeSession.sessionId,
      });
    }

    // ── STEP 3: Ticket check + reserve ──────────────────────────────────
    //
    // Attempt to atomically reserve one of the seeker's daily tickets.
    // If no tickets remain → 403 Forbidden.
    // The ticket stays "reserved" (not "consumed") until the session ends
    // past the grace period. This allows cancellations to refund the ticket.
    const ticketReserved = await this.tickets.tryReserve(seekerId);

    if (!ticketReserved) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'no_tickets_remaining',
        message:
          'You have used all your sessions for today. Please try again tomorrow.',
      });
    }

    // ── STEP 4: Create the UserProblem row ───────────────────────────────
    //
    // This is the "Help Ticket" — it records what the seeker needs help with.
    // The matching algorithm uses this to filter appropriate volunteers.
    // It is created BEFORE the session so we have a record even if matching fails.
    let problem;
    try {
      problem = await this.prisma.userProblem.create({
        data: {
          accountId: seekerId,
          categoryId,
          customCategoryLabel: customLabel ?? null,
          feelingLevel,
          status: UserProblemStatus.waiting,
        },
      });
    } catch (error) {
      // If DB write fails, release the ticket we just reserved so the seeker
      // isn't penalised for a server error.
      await this.tickets.releaseReserved(seekerId);
      throw error;
    }

    // ── STEP 5: Get seeker's languages for matching ──────────────────────
    //
    // We need the seeker's spoken languages to give bonus score to volunteers
    // who share a language. Fetch them now before calling the matching engine.
    const seekerLanguages = await this.prisma.accountLanguage.findMany({
      where: { accountId: seekerId },
      select: { languageId: true },
    });
    const seekerLanguageIds = seekerLanguages.map((l) => l.languageId);

    // ── STEP 6: Run the matching algorithm ──────────────────────────────
    //
    // MatchingService checks the Redis volunteer pool, filters by blocks,
    // ranks by language/specialisation match, and atomically claims the
    // best available volunteer using SREM.
    //
    // Returns the volunteerId if a match was found, or null if the pool is
    // empty or all candidates were claimed by concurrent requests.
    const matchedVolunteerId = await this.matching.findBestVolunteer({
      seekerId,
      categoryId,
      seekerLanguageIds,
    });

    // ── STEP 7A: PATH A — Match found ────────────────────────────────────
    if (matchedVolunteerId) {
      this.logger.log(
        `Match found: seeker ${seekerId} → volunteer ${matchedVolunteerId}`,
      );

      // Preserve the original problem status so we can best-effort revert it
      // if anything in the "match found" flow fails after DB updates.
      const originalProblemStatus = problem.status;

      try {
        // Create the ChatSession row in the DB and update the UserProblem
        // status to 'matched' in a single transaction so they succeed/fail
        // together.
        const [session] = await this.prisma.$transaction([
          this.prisma.chatSession.create({
            data: {
              seekerId,
              listenerId: matchedVolunteerId,
              problemId: problem.problemId,
              status: SessionStatus.active,
              startedAt: new Date(),
            },
          }),
          this.prisma.userProblem.update({
            where: { problemId: problem.problemId },
            data: { status: UserProblemStatus.matched },
          }),
        ]);

        // Store session state in Redis Hash.
        //
        // WHY Redis AND the DB?
        // The DB is the source of truth (persistent, for history/admin).
        // The Redis Hash is the "live state" that the WebSocket gateway reads
        // in real-time — DB queries would be too slow for every message relay.
        //
        // Redis Hash fields:
        //   seekerId    — so the gateway knows who the seeker is
        //   listenerId  — so the gateway knows who the volunteer is
        //   status      — 'active', used to validate room joins
        //   startedAt   — ISO string timestamp
        await this.redis.hset(`session:${session.sessionId}`, {
          seekerId,
          listenerId: matchedVolunteerId,
          status: 'active',
          startedAt: new Date().toISOString(),
        });

        // Set a TTL on the session hash so Redis auto-cleans it.
        await this.redis.expire(
          `session:${session.sessionId}`,
          SESSION_TIMEOUT_MS / 1000,
        );

        // Set an empty messages list key with TTL so Redis auto-cleans it.
        // The WebSocket gateway will RPUSH messages to session:{id}:msgs.
        await this.redis.expire(
          `session:${session.sessionId}:msgs`,
          SESSION_TIMEOUT_MS / 1000,
        );

        // Schedule BullMQ jobs:
        //
        // 1. session:grace-end (3 min delay)
        //    If the session ends within 3 minutes, the ticket is released.
        //    After 3 minutes, it gets consumed. This job triggers the consumption.
        await this.sessionQueue.add(
          'session:grace-end',
          { sessionId: session.sessionId, seekerId },
          { delay: GRACE_END_MS, jobId: `grace-end:${session.sessionId}` },
        );

        // 2. session:timeout (45 min delay)
        //    Safety net — force-ends the session if still active after 45 min.
        await this.sessionQueue.add(
          'session:timeout',
          { sessionId: session.sessionId },
          { delay: SESSION_TIMEOUT_MS, jobId: `timeout:${session.sessionId}` },
        );

        // The response for "match found" (HTTP 200).
        // turnCredentials are TURN server creds for WebRTC — generate them here
        // or call a TURN credential service. Placeholder shown below.
        const result = {
          sessionId: session.sessionId,
          volunteerId: matchedVolunteerId,
          wsRoom: `session:${session.sessionId}`,
          turnCredentials: this.generateTurnCredentials(session.sessionId),
        };

        // Store the result in Redis for idempotency (5-minute TTL).
        await this.redis.set(
          idempotencyRedisKey,
          JSON.stringify(result),
          'EX',
          300,
        );

        return result;
      } catch (error) {
        // Best-effort rollback of BOTH the session and problem status if
        // later steps failed (Redis, job scheduling, etc.).
        this.logger.error(
          `Failed to finalize match for seeker ${seekerId} and volunteer ${matchedVolunteerId}: ${error}`,
        );
        try {
          // Rollback BOTH the ChatSession and UserProblem in a transaction
          await this.prisma.$transaction([
            this.prisma.chatSession.delete({
              where: { sessionId: session.sessionId },
            }),
            this.prisma.userProblem.update({
              where: { problemId: problem.problemId },
              data: { status: originalProblemStatus },
            }),
          ]);
          this.logger.log(
            `Successfully rolled back session ${session.sessionId} and problem ${problem.problemId}`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback session and problem: ${rollbackError}`,
          );
        }

        // Also release the reserved ticket
        await this.tickets.releaseReserved(seekerId);

        throw error;
      }
    }

    // ── STEP 7B: PATH B — No match, queue for push notification ─────────
    //
    // No volunteer was immediately available in the pool.
    // We create a "waiting" ChatSession and push notifications to offline
    // volunteers (those with is_available=true in DB but not currently
    // connected via WebSocket).
    this.logger.log(
      `No match for seeker ${seekerId} — queuing push notifications`,
    );

    const session = await this.prisma.chatSession.create({
      data: {
        seekerId,
        listenerId: null, // Not yet assigned — filled in when a volunteer accepts
        problemId: problem.problemId,
        status: SessionStatus.active,
        startedAt: new Date(),
      },
    });

    // Store a waiting session hash in Redis.
    // The `listenerId` field is intentionally empty — the /accept endpoint
    // will use HSETNX to atomically fill it in (only one volunteer can win).
    await this.redis.hset(`session:${session.sessionId}`, {
      seekerId,
      listenerId: '',
      status: 'waiting',
      startedAt: new Date().toISOString(),
    });

    // Set a TTL on the session hash to match the match timeout.
    // For waiting sessions, TTL should be 3 minutes (MATCH_TIMEOUT_MS),
    // not 45 minutes, to avoid volunteers accepting expired sessions.
    await this.redis.expire(
      `session:${session.sessionId}`,
      MATCH_TIMEOUT_MS / 1000,
    );

    // Find offline volunteers who could help (available in DB but not in pool).
    // We look for volunteers with matching specialisations.
    const offlineVolunteers = await this.findOfflineVolunteers(
      categoryId,
      seekerId,
    );

    if (offlineVolunteers.length > 0) {
      // Queue a push notification job.
      // Thusirui's notification worker processes this and sends FCM pushes.
      await this.notificationQueue.add('notify:volunteers', {
        volunteerIds: offlineVolunteers,
        sessionId: session.sessionId,
        categoryId,
        message: 'A seeker needs your help! Tap to accept.',
      });
    }

    // Schedule the match timeout job.
    // If no volunteer accepts within 3 minutes, this job fires, notifies the
    // seeker that no match was found, and releases their ticket.
    await this.sessionQueue.add(
      'match:timeout',
      { sessionId: session.sessionId, seekerId },
      { delay: MATCH_TIMEOUT_MS, jobId: `match-timeout:${session.sessionId}` },
    );

    // The response for "queued" (HTTP 202 Accepted).
    // 202 means "we received your request and are working on it".
    // The seeker connects via WebSocket and waits for the `session:matched` event.
    const result = {
      status: 'waiting',
      sessionId: session.sessionId,
    };

    // Store for idempotency.
    await this.redis.set(
      idempotencyRedisKey,
      JSON.stringify(result),
      'EX',
      300,
    );

    // Throw an HttpException with 202 status.
    // NestJS doesn't have a built-in 202 exception, so we throw a generic one.
    throw new HttpException(result, HttpStatus.ACCEPTED);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // accept() — the full logic for POST /session/:sessionId/accept
  //
  // Called when a volunteer taps "Accept" from a push notification.
  // Multiple volunteers may call this simultaneously for the same session.
  // Only the first one wins — Redis HSETNX guarantees this atomically.
  // ─────────────────────────────────────────────────────────────────────────
  async accept(sessionId: string, volunteerId: string) {
    // ── STEP 1: Check if volunteer already has an active session ─────────
    //
    // A volunteer should only be in ONE session at a time (same rule as seekers).
    // Check the DB for any session where this volunteer is already the listener.
    // If found → 409 Conflict.
    const activeVolunteerSession = await this.prisma.chatSession.findFirst({
      where: {
        listenerId: volunteerId,
        status: SessionStatus.active,
      },
    });

    if (activeVolunteerSession) {
      throw new ConflictException({
        statusCode: 409,
        error: 'already_in_session',
        message: 'You already have an active session',
        sessionId: activeVolunteerSession.sessionId,
      });
    }

    // ── STEP 2: Check the session exists in Redis ─────────────────────────
    //
    // We check Redis first (not the DB) because it's faster and the session
    // hash was written there when the seeker connected in Path B.
    // If the key doesn't exist, the session has already expired or never existed.
    const sessionHash = await this.redis.hgetall(`session:${sessionId}`);

    if (!sessionHash || Object.keys(sessionHash).length === 0) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'session_not_found',
        message: 'This session no longer exists or has already expired.',
      });
    }

    // ── STEP 3: Confirm the session is still waiting ──────────────────────
    //
    // The session could have already been accepted by another volunteer in
    // the milliseconds before this request arrived. Or it could have timed out.
    // Either way, if it's not 'waiting', we reject immediately.
    if (sessionHash.status !== 'waiting') {
      throw new ConflictException({
        statusCode: 409,
        error: 'session_not_waiting',
        message: 'This session has already been accepted or has expired.',
      });
    }

    // ── STEP 4: Atomic claim with HSETNX ─────────────────────────────────
    //
    // HSETNX = "Hash SET if Not eXists"
    // It sets a field in the Redis Hash ONLY IF that field currently has no value.
    // Returns 1 if it set the value (we won), 0 if the field already had a value
    // (another volunteer got there first).
    //
    // WHY is this better than a regular HSET?
    // HSET would overwrite any existing value — two volunteers could both
    // think they won. HSETNX is atomic: only one caller can ever get a `1`.
    // This is the core of the race-condition protection for Path B.
    const claimed = await this.redis.hsetnx(
      `session:${sessionId}`,
      'listenerId',
      volunteerId,
    );

    if (claimed === 0) {
      // Another volunteer beat us by milliseconds. Return 409.
      throw new ConflictException({
        statusCode: 409,
        error: 'already_accepted',
        message: 'Another volunteer has already accepted this session.',
      });
    }

    // We won the race. Update the session status in Redis immediately
    // so any subsequent accept calls hit the status check in Step 2.
    await this.redis.hset(`session:${sessionId}`, 'status', 'active');

    // ── STEP 5: Bidirectional block check ────────────────────────────────
    //
    // Even though matching already filtered blocks for Path A, in Path B the
    // volunteer self-selects by tapping Accept. We must verify there's no
    // block between them before proceeding.
    const seekerId = sessionHash.seekerId;

    const block = await this.prisma.blocklist.findFirst({
      where: {
        OR: [
          { blockerId: volunteerId, blockedId: seekerId },
          { blockerId: seekerId, blockedId: volunteerId },
        ],
      },
    });

    if (block) {
      // Undo the Redis claim so the session stays claimable by others.
      await this.redis.hset(`session:${sessionId}`, {
        listenerId: '',
        status: 'waiting',
      });
      throw new ForbiddenException({
        statusCode: 403,
        error: 'blocked',
        message: 'You cannot join this session.',
      });
    }

    // ── STEP 6: Update the ChatSession in the DB ──────────────────────────
    //
    // Now that we've atomically claimed the session in Redis, persist the
    // volunteer assignment to the database as the permanent record.
    let session;
    try {
      session = await this.prisma.chatSession.update({
        where: { sessionId },
        data: {
          listenerId: volunteerId,
          status: SessionStatus.active,
        },
        include: {
          // Include the problem + category so we can return the category name
          // in the response (the volunteer's app displays what they're helping with).
          problem: {
            include: { category: true },
          },
        },
      });
    } catch (err) {
      // Roll back the Redis claim so the session remains claimable and
      // consistent with the database state if the DB update fails.
      await this.redis.hset(`session:${sessionId}`, {
        listenerId: '',
        status: 'waiting',
      });
      throw err;
    }

    // ── STEP 7: Cancel the match:timeout BullMQ job ───────────────────────
    //
    // When the seeker connected (Path B), we scheduled a `match:timeout` job
    // to fire after 3 minutes if nobody accepted.
    // Since someone DID accept, we must cancel that job — otherwise it would
    // incorrectly end the session and notify the seeker of "no match found"
    // even though a match exists.
    //
    // BullMQ jobs can be cancelled by their jobId if they haven't fired yet.
    try {
      const timeoutJob = await this.sessionQueue.getJob(
        `match-timeout:${sessionId}`,
      );
      if (timeoutJob) {
        await timeoutJob.remove();
        this.logger.log(`Cancelled match:timeout job for session ${sessionId}`);
      }
    } catch (err) {
      // Non-fatal — log but don't fail the request. The job may have already
      // fired or been removed. The DB status is already 'active' so the job's
      // handler will see that and do nothing harmful.
      const errMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not cancel match:timeout job: ${errMessage}`);
    }

    // Schedule the standard session jobs now that it's active:
    // (same jobs as Path A in connect())
    await this.sessionQueue.add(
      'session:grace-end',
      { sessionId, seekerId },
      { delay: GRACE_END_MS, jobId: `grace-end:${sessionId}` },
    );
    await this.sessionQueue.add(
      'session:timeout',
      { sessionId },
      { delay: SESSION_TIMEOUT_MS, jobId: `timeout:${sessionId}` },
    );

    // ── STEP 8: Emit WebSocket event to the seeker ────────────────────────
    //
    // The seeker is waiting in the app connected via WebSocket.
    // We need to tell them "your volunteer has arrived!".
    //
    // HOW: Look up the seeker's socket ID from Redis, then emit
    // `session:matched` to that socket via the WebSocket gateway.
    //
    // The WebSocket gateway is Thusirui's code (Task 6). We call it via
    // a shared service or event emitter so we don't import the whole ChatModule.
    // For now we log it — wire up the actual emit when Task 6 is merged.
    const seekerSocketId = await this.redis.get(`account:${seekerId}:socket`);

    if (seekerSocketId) {
      // TODO: call ChatGateway.emitToSocket(seekerSocketId, 'session:matched', payload)
      // This will be wired up once Thusirui's ChatModule is merged.
      this.logger.log(
        `Should emit session:matched to seeker socket ${seekerSocketId} — wire up ChatGateway here`,
      );
    } else {
      // Seeker disconnected between connecting and now. The reconnect logic
      // in the WebSocket gateway handles this case — it reads the Redis session
      // hash on reconnect and sees status='active'.
      this.logger.warn(
        `Seeker ${seekerId} has no active socket — they may have disconnected`,
      );
    }

    // ── STEP 9: Return the response to the volunteer ──────────────────────
    return {
      sessionId,
      seekerId,
      category: session.problem?.category?.name ?? null,
      wsRoom: `session:${sessionId}`,
      turnCredentials: this.generateTurnCredentials(sessionId),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // rate() — the full logic for PATCH /session/:sessionId/rate
  //
  // Both seekers and volunteers call this after a session ends.
  // The same endpoint handles both — the service detects who is calling
  // from the `roles` array and writes to the correct DB column.
  // ─────────────────────────────────────────────────────────────────────────
  async rate(
    sessionId: string,
    callerId: string,
    roles: string[],
    dto: { rating: number; starred: boolean },
  ) {
    const { rating, starred } = dto;

    this.logger.debug(
      `rate() called for sessionId=${sessionId}, callerId=${callerId}, roles=${JSON.stringify(
        roles,
      )}`,
    );

    // ── STEP 1: Fetch the session from the DB ─────────────────────────────
    //
    // We use findUnique (not findFirst) because sessionId is a primary key —
    // there can only ever be one result. findUnique is slightly faster because
    // Prisma knows it can stop after finding the first match.
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'session_not_found',
        message: 'Session not found.',
      });
    }

    // ── STEP 2: Verify the caller was actually IN this session ────────────
    //
    // A random user should not be able to rate someone else's session.
    // Only the seeker or the volunteer who participated can rate it.
    const isSeeker = session.seekerId === callerId;
    const isListener = session.listenerId === callerId;

    if (!isSeeker && !isListener) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'not_a_participant',
        message: 'You were not part of this session.',
      });
    }

    // ── STEP 3: Session must be completed before rating ───────────────────
    //
    // You can only rate a session that has actually ended.
    // Rating an active/waiting session makes no sense and is rejected with 400.
    if (session.status !== SessionStatus.completed) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'session_not_completed',
        message: 'You can only rate a session after it has been completed.',
      });
    }

    // ── STEP 4: Check if this person already rated ────────────────────────
    //
    // Each participant can only rate once. If their rating column is already
    // filled in, return 409 Conflict.
    if (isSeeker && session.userRating !== null) {
      throw new ConflictException({
        statusCode: 409,
        error: 'already_rated',
        message: 'You have already rated this session.',
      });
    }

    if (isListener && session.volunteerRating !== null) {
      throw new ConflictException({
        statusCode: 409,
        error: 'already_rated',
        message: 'You have already rated this session.',
      });
    }

    // ── STEP 5: Write the rating to the correct column ────────────────────
    //
    // chat_session has two separate rating columns:
    //   user_rating      — filled in by the seeker
    //   volunteer_rating — filled in by the volunteer
    //
    // We build the `data` object dynamically based on who is calling.
    // The `starred` field only applies to seekers (starred_by_user column).
    // If a volunteer sends starred=true, we just ignore it.
    const updateData = isSeeker
      ? {
          userRating: rating,
          starredByUser: starred, // only seekers can star a session
        }
      : {
          volunteerRating: rating,
          // starred is intentionally NOT set for volunteers
        };

    await this.prisma.chatSession.update({
      where: { sessionId },
      data: updateData,
    });

    this.logger.log(
      `Session ${sessionId} rated ${rating}/5 by ${isSeeker ? 'seeker' : 'volunteer'} ${callerId}`,
    );

    // ── STEP 6: Return success ────────────────────────────────────────────
    return { message: 'Rating saved' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getHistory() — the full logic for GET /session/history
  //
  // Returns a paginated list of past sessions for the calling user.
  // Works for both seekers and volunteers — one query handles both
  // by using OR across seekerId and listenerId columns.
  // ─────────────────────────────────────────────────────────────────────────
  async getHistory(callerId: string, query: { page: number; limit: number }) {
    const { page, limit } = query;

    // ── STEP 1: Calculate pagination offsets ──────────────────────────────
    //
    // SQL/Prisma pagination works with `skip` and `take`:
    //   skip = how many rows to jump over (rows from previous pages)
    //   take = how many rows to return (the page size)
    //
    // Example: page=2, limit=20 → skip=20, take=20
    //   Skips the first 20 rows (page 1) and returns the next 20.
    const skip = (page - 1) * limit;
    const take = limit;

    // ── STEP 2: Build the shared WHERE clause ─────────────────────────────
    //
    // The OR means: "give me sessions where I was either the seeker OR
    // the volunteer." One query, one endpoint, works for everyone.
    //
    // We also exclude active/waiting sessions — those aren't history yet,
    // they're live. Only ended sessions belong in the history list.
    const where: Prisma.ChatSessionWhereInput = {
      OR: [{ seekerId: callerId }, { listenerId: callerId }],
      status: { notIn: [SessionStatus.active] },
    };

    // ── STEP 3: Fetch sessions + total count in parallel ─────────────────
    //
    // prisma.$transaction([query1, query2]) runs both DB queries at the
    // same time and waits for both to finish before continuing.
    // This is faster than running them one after the other.
    //
    //   findMany → the actual page of data
    //   count    → the total matching rows (used by frontend for page controls)
    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.chatSession.findMany({
        where,
        skip,
        take,
        // Newest sessions first — most relevant to the user.
        orderBy: { startedAt: 'desc' },
        // `include` tells Prisma to JOIN and return related rows.
        // Without this, problem and category would be null/undefined.
        include: {
          problem: {
            include: {
              category: { select: { name: true } },
            },
          },
        },
      }),

      this.prisma.chatSession.count({ where }),
    ]);

    // ── STEP 4: Map to the response shape ────────────────────────────────
    //
    // We never return raw Prisma objects directly — we pick only the fields
    // the API spec defines. This prevents accidentally leaking internal
    // fields like seekerId, listenerId, or problemId to the client.
    const data = sessions.map((s) => ({
      sessionId: s.sessionId,
      category: s.problem?.category?.name ?? null,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      status: s.status,
      closedReason: s.closedReason,
      userRating: s.userRating,
      volunteerRating: s.volunteerRating,
      starredByUser: s.starredByUser,
    }));

    // ── STEP 5: Return the pagination envelope ────────────────────────────
    //
    // The frontend uses `total`, `page`, and `limit` to render page controls
    // e.g. "Showing 21–40 of 87 sessions" or "Page 2 of 5".
    return { data, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getTickets() — the full logic for GET /session/tickets
  //
  // The thinnest method in Task 4. All the real logic already lives in
  // TicketService.getRemaining() — this method just calls it and returns
  // the result. SessionService is the public API, TicketService is the
  // internal implementation detail.
  //
  // WHY delegate instead of writing the logic here?
  // TicketService is also called by connect() (to reserve) and by BullMQ
  // workers (to consume/release). Keeping all ticket logic in one place
  // means if the ticket system ever changes, you only edit one file.
  // ─────────────────────────────────────────────────────────────────────────
  getTickets(seekerId: string) {
    // TicketService.getRemaining() reads from Redis and returns:
    // { daily: 5, consumed: 2, reserved: 1, remaining: 2 }
    return this.tickets.getRemaining(seekerId);
  }

  // ─── Helper: find offline volunteers for Path B push notifications ────
  private async findOfflineVolunteers(
    categoryId: string,
    seekerId: string,
  ): Promise<string[]> {
    // Get currently pooled (online) volunteer IDs to exclude them.
    const onlineIds = await this.redis.smembers('volunteer:pool');

    // Find the category name for specialisation matching.
    const category = await this.prisma.category.findUnique({
      where: { categoryId },
      select: { name: true },
    });

    if (!category) return [];

    // Find volunteers who:
    //   1. Are verified and available (in DB)
    //   2. Are NOT currently online (not in Redis pool)
    //   3. Have a matching specialisation
    //   4. Haven't blocked / aren't blocked by this seeker
    const candidates = await this.prisma.volunteerProfile.findMany({
      where: {
        isAvailable: true,
        verificationStatus: VerificationStatus.approved,
        accountId: { notIn: [...onlineIds, seekerId] },
        account: {
          status: AccountStatus.active,
          // Exclude blocked relationships
          blocksReceived: { none: { blockerId: seekerId } },
          blocksInitiated: { none: { blockedId: seekerId } },
          volunteerSpecialisations: {
            some: {
              specialisation: {
                name: { equals: category.name, mode: 'insensitive' },
              },
            },
          },
        },
      },
      select: { accountId: true },
      take: 20, // Cap at 20 to avoid spamming too many volunteers
    });

    return candidates.map((v) => v.accountId);
  }

  // ─── Helper: generate TURN credentials ───────────────────────────────
  // TURN servers relay WebRTC traffic when direct peer-to-peer fails.
  // In production, use a proper TURN credential service (e.g. Twilio, Metered).
  // This is a placeholder — replace with your actual TURN server logic.
  private generateTurnCredentials(sessionId: string) {
    const turnServerUrl = process.env.TURN_SERVER_URL;
    const turnServerSecret = process.env.TURN_SERVER_SECRET;

    if (!turnServerUrl || !turnServerSecret) {
      throw new Error(
        'TURN server is not properly configured: TURN_SERVER_URL and TURN_SERVER_SECRET must be set.',
      );
    }

    return {
      urls: [turnServerUrl],
      username: `session-${sessionId}`,
      credential: turnServerSecret,
    };
  }
}

