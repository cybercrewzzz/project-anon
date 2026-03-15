import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ChatService } from './chat.service.js';
import { ChatServerService } from './chat-server.service.js';
import { RECONNECT_QUEUE } from './chat.gateway.js';

interface ReconnectExpireJob {
  accountId: string;
  sessionId: string;
}

/**
 * Processes `reconnect-expire` jobs from the chat-reconnect queue.
 *
 * A job is enqueued (with a 60 s delay) when a participant disconnects from
 * an active session. If the participant reconnects within the window the job
 * is removed. If not, this processor fires and ends the session.
 */
@Processor(RECONNECT_QUEUE)
export class ChatProcessor extends WorkerHost {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatServer: ChatServerService,
  ) {
    super();
  }

  async process(job: Job<ReconnectExpireJob>): Promise<void> {
    const { accountId, sessionId } = job.data;

    // Check whether the account actually reconnected (flag cleared in room:join)
    const sessionHash = await this.chatService.getSessionHash(sessionId);
    const reconnectFlag = sessionHash?.[`reconnecting:${accountId}`];
    if (!reconnectFlag || reconnectFlag === '0') {
      // Already reconnected — nothing to do
      return;
    }

    // End the session in Postgres
    const participants = await this.chatService.endSession(
      sessionId,
      'cancelled_disconnect',
    );

    if (participants) {
      // Notify all remaining room members
      this.chatServer.server.to(sessionId).emit('session:ended', {
        sessionId,
        reason: 'peer_disconnected',
      });

      // Clean up Redis session state
      await this.chatService.clearAccountSession(participants.seekerId);
      if (participants.listenerId) {
        await this.chatService.clearAccountSession(participants.listenerId);
      }
      await this.chatService.purgeMessages(sessionId);
    }

    console.log(
      `[BullMQ] Reconnect expired — accountId=${accountId} session=${sessionId}`,
    );
  }
}
