import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ChatService } from './chat.service.js';
import { ChatServerService } from './chat-server.service.js';
import { RECONNECT_QUEUE, SESSION_TIMEOUT_QUEUE } from './chat.gateway.js';

// ── Reconnect-expire processor ────────────────────────────────────────────────

interface ReconnectExpireJob {
  accountId: string;
  sessionId: string;
}

/**
 * Fires when a participant fails to reconnect within the 60-second window.
 * Ends the session in Postgres, notifies remaining members, and cancels
 * the authoritative 30-minute timeout job (no point letting it fire for a
 * session that is already over).
 */
@Processor(RECONNECT_QUEUE)
export class ChatProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatProcessor.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatServer: ChatServerService,
    @InjectQueue(SESSION_TIMEOUT_QUEUE) private readonly timeoutQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<ReconnectExpireJob>): Promise<void> {
    const { accountId, sessionId } = job.data;

    // Skip if the account already reconnected (flag cleared in room:join)
    const sessionHash = await this.chatService.getSessionHash(sessionId);
    const reconnectFlag = sessionHash?.[`reconnecting:${accountId}`];
    if (!reconnectFlag || reconnectFlag === '0') return;

    const participants = await this.chatService.endSession(
      sessionId,
      'cancelled_disconnect',
    );

    if (participants) {
      this.chatServer.server.to(sessionId).emit('session:ended', {
        sessionId,
        reason: 'peer_disconnected',
      });

      // Cancel the 30-minute timeout — session is already over
      const timeoutJob = await this.timeoutQueue.getJob(`timeout-${sessionId}`);
      await timeoutJob?.remove();

      await this.chatService.clearAccountSession(participants.seekerId);
      if (participants.listenerId) {
        await this.chatService.clearAccountSession(participants.listenerId);
      }
      await this.chatService.purgeMessages(sessionId);

      // Return volunteer to the available pool if they reconnected and are still eligible
      if (participants.listenerId) {
        await this.chatService.reAddVolunteerToPoolIfEligible(
          participants.listenerId,
        );
      }
    }

    this.logger.log(
      `Reconnect expired — accountId=${accountId} session=${sessionId}`,
    );
  }
}

// ── Session-timeout processor ─────────────────────────────────────────────────

interface SessionTimeoutJob {
  sessionId: string;
}

/**
 * Fires after the 30-minute session time limit.
 * This is the authoritative source of truth — neither client app ends the
 * session; only this job does.  Cancels any in-flight reconnect-expire jobs
 * and cleans up all Redis state.
 */
@Processor(SESSION_TIMEOUT_QUEUE)
export class ChatTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatTimeoutProcessor.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatServer: ChatServerService,
    @InjectQueue(RECONNECT_QUEUE) private readonly reconnectQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<SessionTimeoutJob>): Promise<void> {
    const { sessionId } = job.data;

    const participants = await this.chatService.endSession(
      sessionId,
      'completed',
    );

    if (!participants) {
      // Session was already ended (e.g., by session:end event or reconnect-expire)
      return;
    }

    // Tell all connected room members that the session has timed out
    this.chatServer.server.to(sessionId).emit('session:ended', {
      sessionId,
      reason: 'timeout',
    });

    // Cancel any pending reconnect-expire jobs for both participants
    const seekerJob = await this.reconnectQueue.getJob(
      `reconnect-${participants.seekerId}-${sessionId}`,
    );
    await seekerJob?.remove();

    if (participants.listenerId) {
      const listenerJob = await this.reconnectQueue.getJob(
        `reconnect-${participants.listenerId}-${sessionId}`,
      );
      await listenerJob?.remove();
    }

    // Clean up Redis session state
    await this.chatService.clearAccountSession(participants.seekerId);
    if (participants.listenerId) {
      await this.chatService.clearAccountSession(participants.listenerId);
    }
    await this.chatService.purgeMessages(sessionId);

    // Return volunteer to the available pool if they are still online and eligible
    if (participants.listenerId) {
      await this.chatService.reAddVolunteerToPoolIfEligible(
        participants.listenerId,
      );
    }

    this.logger.log(`Session timed out — session=${sessionId}`);
  }
}
