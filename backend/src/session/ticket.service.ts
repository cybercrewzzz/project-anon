import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface TicketState {
  daily: number;
  consumed: number;
  reserved: number;
  remaining: number;
}

@Injectable()
export class TicketService {
  private static readonly DEFAULT_DAILY_LIMIT = 5;
  private static readonly TTL_SECONDS = 36 * 60 * 60;

  constructor(private readonly redis: RedisService) {}

  async tryReserve(accountId: string): Promise<boolean> {
    const state = await this.getRemaining(accountId);

    if (state.remaining <= 0) {
      return false;
    }

    await this.writeState(accountId, {
      daily: state.daily,
      consumed: state.consumed,
      reserved: state.reserved + 1,
    });

    return true;
}

  async releaseReserved(accountId: string): Promise<void> {
    const state = await this.getRemaining(accountId);

    if (state.reserved <= 0) {
      return;
    }

    await this.writeState(accountId, {
      daily: state.daily,
      consumed: state.consumed,
      reserved: state.reserved - 1,
    });
  }

  async consumeReserved(accountId: string): Promise<void> {
    const state = await this.getRemaining(accountId);

    if (state.reserved <= 0) {
      return;
    }

    await this.writeState(accountId, {
      daily: state.daily,
      consumed: state.consumed + 1,
      reserved: state.reserved - 1,
    });
  }

  async getRemaining(accountId: string): Promise<TicketState> {
    const key = this.getTicketKey(accountId);
    const ticketHash = await this.redis.hgetall(key);

    const daily = this.getDailyLimit(ticketHash.daily);
    const consumed = this.parseCounter(ticketHash.consumed);
    const reserved = this.parseCounter(ticketHash.reserved);

    await this.redis.expire(key, TicketService.TTL_SECONDS);

    return {
      daily,
      consumed,
      reserved,
      remaining: Math.max(0, daily - consumed - reserved),
    };
  }

  private async writeState(
    accountId: string,
    state: { daily: number; consumed: number; reserved: number },
  ): Promise<void> {
    const key = this.getTicketKey(accountId);

    await this.redis.hset(key, {
      daily: state.daily.toString(),
      consumed: state.consumed.toString(),
      reserved: state.reserved.toString(),
    });

    await this.redis.expire(key, TicketService.TTL_SECONDS);
  }

  private getTicketKey(accountId: string): string {
    const date = new Date().toISOString().slice(0, 10);
    return `ticket:${accountId}:${date}`;
  }

  private parseCounter(rawValue: string | undefined): number {
    const parsed = Number.parseInt(rawValue ?? '0', 10);
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  private getDailyLimit(rawValue: string | undefined): number {
    const envLimit = Number.parseInt(process.env.DAILY_TICKET_LIMIT ?? '', 10);
    const configuredLimit = Number.isNaN(envLimit)
      ? TicketService.DEFAULT_DAILY_LIMIT
      : Math.max(1, envLimit);

    const parsedFromRedis = Number.parseInt(rawValue ?? '', 10);
    return Number.isNaN(parsedFromRedis)
      ? configuredLimit
      : Math.max(1, parsedFromRedis);
  }
}
