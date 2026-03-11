import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const SESSION_TTL = 86400; // 24 hours

@Injectable()
export class ChatService {
  constructor(private readonly redis: RedisService) {}

  // ── Socket Mapping ──────────────────────────────────────────────

  async mapSocket(socketId: string, userId: string): Promise<void> {
    await this.redis.set(`socket:${socketId}`, userId);
    await this.redis.set(`user:${userId}:socket`, socketId);
  }

  async unmapSocket(socketId: string): Promise<void> {
    const userId = await this.redis.get(`socket:${socketId}`);
    await this.redis.del(`socket:${socketId}`);
    if (userId) {
      await this.redis.del(`user:${userId}:socket`);
    }
  }

  async getUserIdBySocket(socketId: string): Promise<string | null> {
    return this.redis.get(`socket:${socketId}`);
  }

  async getSocketIdByUser(userId: string): Promise<string | null> {
    return this.redis.get(`user:${userId}:socket`);
  }

  // ── Session State ───────────────────────────────────────────────

  /**
   * Validate that a session exists and the user is a participant.
   *
   * TODO: Replace with real validation when matchmaking is implemented.
   * Real implementation should:
   *  1. Check Postgres ChatSession exists and status is 'active'
   *  2. Verify userId is either seekerId or listenerId
   */
  validateSession(sessionId: string, userId: string): Promise<boolean> {
    // TODO: Replace with real validation when matchmaking is implemented.
    // Real implementation should:
    //  1. Check Postgres ChatSession exists and status is 'active'
    //  2. Verify userId is either seekerId or listenerId
    void sessionId;
    void userId;
    return Promise.resolve(true);
  }

  // ── Key Exchange ────────────────────────────────────────────────

  async storePublicKey(
    sessionId: string,
    userId: string,
    publicKey: string,
  ): Promise<void> {
    const key = `session:${sessionId}:keys`;
    await this.redis.hset(key, userId, publicKey);
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
    await this.redis.expire(key, SESSION_TTL);
    return length - 1; // return 0-based index of the pushed message
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
}
