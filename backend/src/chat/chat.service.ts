import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SESSION_TTL = 86400; // 24 hours
const SOCKET_TTL = 86400; // match session TTL so stale mappings expire after a server crash
const MAX_SESSION_MESSAGES = 1000;
const VOLUNTEER_POOL_KEY = 'volunteer:pool';

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
   * SRANDMEMBER + SREM is not strictly atomic but is safe for a
   * single-instance deployment.
   */
  async claimVolunteer(): Promise<string | null> {
    const volunteerId = await this.redis.srandmember(VOLUNTEER_POOL_KEY);
    if (!volunteerId) return null;
    await this.redis.srem(VOLUNTEER_POOL_KEY, volunteerId);
    return volunteerId;
  }

  // ── Volunteer Eligibility ────────────────────────────────────────

  /**
   * A volunteer is eligible for the pool if their profile exists and
   * isAvailable is true.
   */
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
