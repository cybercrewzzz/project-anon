import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface TicketState {
  daily: number;
  consumed: number;
  reserved: number;
  remaining: number;
  total: number;
  resetAt: string;
}

@Injectable()
export class TicketService {
  private static readonly DEFAULT_DAILY_LIMIT = 5;
  private static readonly TTL_SECONDS = 36 * 60 * 60;

  constructor(private readonly redis: RedisService) {}

  async tryReserve(accountId: string): Promise<boolean> {
    const key = this.getTicketKey(accountId);
    const configuredDailyLimit = this.getDailyLimit(undefined);

    const result = await this.redis.eval(
      `
      local key = KEYS[1]
      local configured_daily = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      local daily = redis.call('HGET', key, 'daily')
      if not daily or daily == '' then
        daily = tostring(configured_daily)
        redis.call('HSET', key, 'daily', daily)
      end

      local consumed = tonumber(redis.call('HGET', key, 'consumed') or '0')
      if not consumed or consumed < 0 then consumed = 0 end

      local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')
      if not reserved or reserved < 0 then reserved = 0 end

      local daily_num = tonumber(daily)
      if not daily_num or daily_num < 1 then daily_num = configured_daily end

      local remaining = daily_num - consumed - reserved
      if remaining <= 0 then
        return 0
      end

      reserved = reserved + 1
      redis.call('HSET', key, 'reserved', tostring(reserved))
      redis.call('EXPIRE', key, ttl)
      return 1
      `,
      1,
      key,
      configuredDailyLimit.toString(),
      TicketService.TTL_SECONDS.toString(),
    );

    return result === 1 || result === '1';
  }

  async releaseReserved(accountId: string): Promise<void> {
    const key = this.getTicketKey(accountId);

    await this.redis.eval(
      `
      local key = KEYS[1]
      local ttl = tonumber(ARGV[1])

      local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')
      if not reserved or reserved <= 0 then
        return 0
      end

      reserved = reserved - 1
      if reserved < 0 then reserved = 0 end

      redis.call('HSET', key, 'reserved', tostring(reserved))
      redis.call('EXPIRE', key, ttl)
      return 1
      `,
      1,
      key,
      TicketService.TTL_SECONDS.toString(),
    );
  }

  async consumeReserved(accountId: string): Promise<void> {
    const key = this.getTicketKey(accountId);

    await this.redis.eval(
      `
      local key = KEYS[1]
      local ttl = tonumber(ARGV[1])

      local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')
      if not reserved or reserved <= 0 then
        return 0
      end

      local consumed = tonumber(redis.call('HGET', key, 'consumed') or '0')
      if not consumed or consumed < 0 then consumed = 0 end

      reserved = reserved - 1
      if reserved < 0 then reserved = 0 end
      consumed = consumed + 1

      redis.call('HSET', key, 'consumed', tostring(consumed), 'reserved', tostring(reserved))
      redis.call('EXPIRE', key, ttl)
      return 1
      `,
      1,
      key,
      TicketService.TTL_SECONDS.toString(),
    );
  }

  async getRemaining(accountId: string): Promise<TicketState> {
    const key = this.getTicketKey(accountId);
    const ticketHash = await this.redis.hgetall(key);

    const daily = this.getDailyLimit(ticketHash.daily);
    const consumed = this.parseCounter(ticketHash.consumed);
    const reserved = this.parseCounter(ticketHash.reserved);

    await this.redis.expire(key, TicketService.TTL_SECONDS);

    // Calculate when tickets reset (midnight UTC of the next day)
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      daily,
      consumed,
      reserved,
      remaining: Math.max(0, daily - consumed - reserved),
      total: daily,
      resetAt: tomorrow.toISOString(),
    };
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
