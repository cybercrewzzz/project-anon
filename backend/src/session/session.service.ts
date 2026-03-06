import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchingService } from './matching.service';
import { TicketService } from './ticket.service';
import { ConnectSessionDto } from './dto/connect-session.dto';

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
    const idempotencyRedisKey = `idempotency:${idempotencyKey}`;
    const existingResult = await this.redis.client.get(idempotencyRedisKey);

    if (existingResult) {
      this.logger.log(`Idempotency hit for key ${idempotencyKey} — returning cached result`);
      // The stored result is a JSON string. Parse and return it as-is.
      return JSON.parse(existingResult);
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
        status: { in: ['active', 'waiting'] },
      },
    });

    if (activeSession) {
      throw new ConflictException({
        statusCode: 409,
        error: 'already_in_session',
        message: 'You already have an active or waiting session',
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
        message: 'You have used all your sessions for today. Please try again tomorrow.',
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
          status: 'waiting', // Will be updated to 'matched' or 'expired'
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
      this.logger.log(`Match found: seeker ${seekerId} → volunteer ${matchedVolunteerId}`);

      // Create the ChatSession row in the DB.
      // This is the official record of the conversation (no messages stored here).
      const session = await this.prisma.chatSession.create({
        data: {
          seekerId,
          listenerId: matchedVolunteerId,
          problemId: problem.problemId,
          status: 'active',
          startedAt: new Date(),
        },
      });

      // Update the UserProblem status to 'matched'.
      await this.prisma.userProblem.update({
        where: { problemId: problem.problemId },
        data: { status: 'matched' },
      });

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
      await this.redis.client.hset(`session:${session.sessionId}`, {
        seekerId,
        listenerId: matchedVolunteerId,
        status: 'active',
        startedAt: new Date().toISOString(),
      });

      // Set an empty messages list key with TTL so Redis auto-cleans it.
      // The WebSocket gateway will RPUSH messages to session:{id}:msgs.
      await this.redis.client.expire(`session:${session.sessionId}:msgs`, SESSION_TIMEOUT_MS / 1000);

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
      await this.redis.client.set(idempotencyRedisKey, JSON.stringify(result), 'EX', 300);

      return result;
    }

    // ── STEP 7B: PATH B — No match, queue for push notification ─────────
    //
    // No volunteer was immediately available in the pool.
    // We create a "waiting" ChatSession and push notifications to offline
    // volunteers (those with is_available=true in DB but not currently
    // connected via WebSocket).
    this.logger.log(`No match for seeker ${seekerId} — queuing push notifications`);

    const session = await this.prisma.chatSession.create({
      data: {
        seekerId,
        listenerId: null, // Not yet assigned — filled in when a volunteer accepts
        problemId: problem.problemId,
        status: 'waiting',
        startedAt: new Date(),
      },
    });

    // Store a waiting session hash in Redis.
    // The `listenerId` field is intentionally empty — the /accept endpoint
    // will use HSETNX to atomically fill it in (only one volunteer can win).
    await this.redis.client.hset(`session:${session.sessionId}`, {
      seekerId,
      listenerId: '',
      status: 'waiting',
      startedAt: new Date().toISOString(),
    });

    // Find offline volunteers who could help (available in DB but not in pool).
    // We look for volunteers with matching specialisations.
    const offlineVolunteers = await this.findOfflineVolunteers(categoryId, seekerId);

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
    await this.redis.client.set(idempotencyRedisKey, JSON.stringify(result), 'EX', 300);

    // Throw an HttpException with 202 status.
    // NestJS doesn't have a built-in 202 exception, so we throw a generic one.
    throw new HttpException(result, HttpStatus.ACCEPTED);
  }

  // ─── Helper: find offline volunteers for Path B push notifications ────
  private async findOfflineVolunteers(
    categoryId: string,
    seekerId: string,
  ): Promise<string[]> {
    // Get currently pooled (online) volunteer IDs to exclude them.
    const onlineIds = await this.redis.client.smembers('volunteer:pool');

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
        verificationStatus: 'approved',
        accountId: { notIn: [...onlineIds, seekerId] },
        account: {
          status: 'active',
          // Exclude blocked relationships
          blockedBy: { none: { blockerId: seekerId } },
          blocking: { none: { blockedId: seekerId } },
        },
        account: {
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
    return {
      urls: [process.env.TURN_SERVER_URL ?? 'turn:your-turn-server.com:3478'],
      username: `session-${sessionId}`,
      credential: process.env.TURN_SERVER_SECRET ?? 'placeholder-secret',
    };
  }
}