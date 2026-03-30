import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SESSION_TTL = 86400; // 24 hours
const SOCKET_TTL = 86400; // match session TTL so stale mappings expire after a server crash
const MAX_SESSION_MESSAGES = 1000;
/** Available pool — online volunteers who are isAvailable=true and not in a session. */
const VOLUNTEER_POOL_KEY = 'volunteer:pool';
// NOTE: "Online" presence is derived from the account:<id>:socket key (set/cleared by
// mapSocket/unmapSocket, TTL = SOCKET_TTL). A separate Redis SET would have no per-member
// TTL and would retain stale entries after a server crash where handleDisconnect never runs.

// Rate-limit windows in seconds
const MSG_RATE_WINDOW_SEC = 60;
const TYPING_RATE_WINDOW_SEC = 5;

@Injectable()
export class ChatService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Socket Mapping ──────────────────────────────────────────────

  async mapSocket(socketId: string, accountId: string): Promise<void> {
    await this.redis.set(`socket:${socketId}`, accountId);
    await this.redis.expire(`socket:${socketId}`, SOCKET_TTL);
    await this.redis.set(`account:${accountId}:socket`, socketId);
    await this.redis.expire(`account:${accountId}:socket`, SOCKET_TTL);
  }

  /**
   * Remove socket ↔ account mappings.
   * Returns the accountId that was associated with this socket.
   */
  async unmapSocket(socketId: string): Promise<string | null> {
    const accountId = await this.redis.get(`socket:${socketId}`);
    await this.redis.del(`socket:${socketId}`);
    if (accountId) {
      // Only remove account→socket if it still points to this socket.
      // A concurrent reconnect may have already replaced it.
      const currentSocketId = await this.redis.get(
        `account:${accountId}:socket`,
      );
      if (currentSocketId === socketId) {
        await this.redis.del(`account:${accountId}:socket`);
      }
    }
    return accountId;
  }

  async getAccountIdBySocket(socketId: string): Promise<string | null> {
    return this.redis.get(`socket:${socketId}`);
  }

  async getSocketIdByAccount(accountId: string): Promise<string | null> {
    return this.redis.get(`account:${accountId}:socket`);
  }

  // ── Account → Session Mapping ───────────────────────────────────

  async setAccountSession(accountId: string, sessionId: string): Promise<void> {
    await this.redis.set(`account:${accountId}:session`, sessionId);
    await this.redis.expire(`account:${accountId}:session`, SESSION_TTL);
  }

  async getAccountSession(accountId: string): Promise<string | null> {
    return this.redis.get(`account:${accountId}:session`);
  }

  async clearAccountSession(accountId: string): Promise<void> {
    await this.redis.del(`account:${accountId}:session`);
  }

  // ── Volunteer Pool ───────────────────────────────────────────────

  async addToPool(accountId: string): Promise<void> {
    await this.redis.sadd(VOLUNTEER_POOL_KEY, accountId);
  }

  async removeFromPool(accountId: string): Promise<void> {
    await this.redis.srem(VOLUNTEER_POOL_KEY, accountId);
  }

  /**
   * Pick and atomically remove a random volunteer from the pool.
   * Uses Redis SPOP so selection and removal are a single atomic
   * operation, avoiding double-claims under concurrency.
   */
  async claimVolunteer(): Promise<string | null> {
    const volunteerId = await this.redis.spop(VOLUNTEER_POOL_KEY);
    return volunteerId ?? null;
  }

  // ── Volunteer Online Pool ─────────────────────────────────────────

  /** Track that a volunteer is currently connected via WebSocket. */
  private static readonly VOLUNTEERS_ONLINE_KEY = 'volunteers:online';

  async addToOnlinePool(accountId: string): Promise<void> {
    await this.redis.sadd(ChatService.VOLUNTEERS_ONLINE_KEY, accountId);
  }

  async removeFromOnlinePool(accountId: string): Promise<void> {
    await this.redis.srem(ChatService.VOLUNTEERS_ONLINE_KEY, accountId);
  }

  /**
   * A volunteer is "online" if a socket mapping exists for their account.
   * The mapping is written by `mapSocket` on connect and deleted by
   * `unmapSocket` on disconnect; it expires after SOCKET_TTL on crash.
   */
  async isInOnlinePool(accountId: string): Promise<boolean> {
    const socketId = await this.redis.get(`account:${accountId}:socket`);
    return socketId !== null;
  }

  /**
   * Get the socket IDs of all currently online volunteers.
   * Used to broadcast session:waiting events in real time.
   */
  async getOnlineVolunteerSocketIds(): Promise<string[]> {
    const volunteerIds = await this.redis.smembers(
      ChatService.VOLUNTEERS_ONLINE_KEY,
    );
    const socketIds: string[] = [];
    for (const volunteerId of volunteerIds) {
      const socketId = await this.redis.get(`account:${volunteerId}:socket`);
      if (socketId) {
        socketIds.push(socketId);
      } else {
        // Stale entry — volunteer disconnected without cleanup
        await this.redis.srem(ChatService.VOLUNTEERS_ONLINE_KEY, volunteerId);
      }
    }
    return socketIds;
  }

  /**
   * Re-add a volunteer to the available pool after a session ends,
   * iff they are still online and their profile still has isAvailable=true.
   */
  async reAddVolunteerToPoolIfEligible(volunteerId: string): Promise<void> {
    const isOnline = await this.isInOnlinePool(volunteerId);
    if (!isOnline) return;
    const eligible = await this.isEligibleForPool(volunteerId);
    if (eligible) await this.addToPool(volunteerId);
  }

  // ── Volunteer Eligibility ────────────────────────────────────────
  async isEligibleForPool(accountId: string): Promise<boolean> {
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { accountId },
      select: { isAvailable: true },
    });
    return profile?.isAvailable === true;
  }

  /**
   * Return the active ChatSession ID for an account (seeker or listener),
   * or null if none.
   */
  async getActiveSessionId(accountId: string): Promise<string | null> {
    const session = await this.prisma.chatSession.findFirst({
      where: {
        OR: [{ seekerId: accountId }, { listenerId: accountId }],
        status: 'active',
      },
      select: { sessionId: true },
    });
    return session?.sessionId ?? null;
  }

  // ── Session Matching ─────────────────────────────────────────────

  /**
   * Validate that a UserProblem belongs to the seeker and is still in 'waiting'
   * status so it can be attached to a new session.
   */
  async validateProblemForSeeker(
    problemId: string,
    seekerId: string,
  ): Promise<boolean> {
    if (!ChatService.UUID_RE.test(problemId)) return false;
    const problem = await this.prisma.userProblem.findUnique({
      where: { problemId },
      select: { accountId: true, status: true },
    });
    return problem?.accountId === seekerId && problem?.status === 'waiting';
  }

  /**
   * Atomically create a ChatSession and mark the associated UserProblem
   * as matched.  Returns the new sessionId.
   *
   * The `updateMany` on UserProblem is guarded by `{ accountId: seekerId,
   * status: 'waiting' }` so that concurrent `session:request` calls for
   * the same problem both pass `validateProblemForSeeker` (which is a
   * read-only check) but only one can flip the status to 'matched' —
   * the other will see count === 0 and the transaction rolls back.
   */
  async createSession(
    seekerId: string,
    volunteerId: string,
    problemId: string,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      // Guard: only proceed if the problem is still in 'waiting' state for this seeker
      const { count } = await tx.userProblem.updateMany({
        where: { problemId, accountId: seekerId, status: 'waiting' },
        data: { status: 'matched' },
      });
      if (count === 0) {
        throw new Error('Problem is no longer available for matching');
      }
      const session = await tx.chatSession.create({
        data: { seekerId, listenerId: volunteerId, problemId },
        select: { sessionId: true },
      });
      return session.sessionId;
    });
  }

  // ── Session Validation ───────────────────────────────────────────

  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async validateSession(
    sessionId: string,
    accountId: string,
  ): Promise<boolean> {
    // Reject non-UUID values immediately — avoids a DB error for test/dev ids
    if (!ChatService.UUID_RE.test(sessionId)) return false;

    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { seekerId: true, listenerId: true, status: true },
    });
    if (!session || session.status !== 'active') return false;
    return session.seekerId === accountId || session.listenerId === accountId;
  }

  // ── Session Hash (runtime state in Redis) ───────────────────────

  async getSessionHash(
    sessionId: string,
  ): Promise<Record<string, string> | null> {
    const hash = await this.redis.hgetall(`session:${sessionId}`);
    return Object.keys(hash).length ? hash : null;
  }

  async updateSessionHash(
    sessionId: string,
    fields: Record<string, string>,
  ): Promise<void> {
    await this.redis.hset(`session:${sessionId}`, fields);
    await this.redis.expire(`session:${sessionId}`, SESSION_TTL);
  }

  // ── Session Tear-down ────────────────────────────────────────────

  async endSession(
    sessionId: string,
    status: 'completed' | 'cancelled_disconnect' | 'cancelled_timeout',
  ): Promise<{ seekerId: string; listenerId: string | null } | null> {
    const updated = await this.prisma.chatSession.updateMany({
      where: { sessionId, status: 'active' },
      data: { status, endedAt: new Date() },
    });
    if (updated.count === 0) return null;

    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { seekerId: true, listenerId: true },
    });
    return session;
  }

  // ── Key Exchange ────────────────────────────────────────────────

  async storePublicKey(
    sessionId: string,
    accountId: string,
    publicKey: string,
  ): Promise<void> {
    const key = `session:${sessionId}:keys`;
    await this.redis.hset(key, accountId, publicKey);
    await this.redis.expire(key, SESSION_TTL);
  }

  async getStoredKeys(sessionId: string): Promise<Record<string, string>> {
    return this.redis.hgetall(`session:${sessionId}:keys`);
  }

  // ── Message Buffer ──────────────────────────────────────────────

  async bufferMessage(
    sessionId: string,
    message: Record<string, unknown>,
  ): Promise<number> {
    const key = `session:${sessionId}:msgs`;
    const length = await this.redis.rpush(key, JSON.stringify(message));
    // Cap the buffer so a busy or malicious session can't exhaust Redis memory.
    await this.redis.ltrim(key, -MAX_SESSION_MESSAGES, -1);
    await this.redis.expire(key, SESSION_TTL);
    return Math.min(length - 1, MAX_SESSION_MESSAGES - 1); // 0-based index
  }

  async getMessages(
    sessionId: string,
    afterIndex: number = 0,
  ): Promise<Record<string, unknown>[]> {
    const raw = await this.redis.lrange(
      `session:${sessionId}:msgs`,
      afterIndex,
      -1,
    );
    return raw.map((s) => JSON.parse(s) as Record<string, unknown>);
  }

  async purgeMessages(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}:msgs`);
    await this.redis.del(`session:${sessionId}:keys`);
    await this.redis.del(`session:${sessionId}`);
  }

  // ── Rate Limiting ────────────────────────────────────────────────

  /**
   * Increment a per-socket sliding-window counter.
   * Returns true if the action is within the allowed limit.
   *
   *   message:send  → 30 per 60 s
   *   typing:start  → 5  per 5 s
   */
  async checkRateLimit(
    socketId: string,
    event: 'message:send' | 'typing:start',
  ): Promise<boolean> {
    const [limit, windowSec] =
      event === 'message:send'
        ? [30, MSG_RATE_WINDOW_SEC]
        : [5, TYPING_RATE_WINDOW_SEC];

    const key = `rate:${socketId}:${event}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSec);
    }
    return count <= limit;
  }
}
