import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket, DefaultEventsMap } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ChatService } from './chat.service.js';
import { ChatServerService } from './chat-server.service.js';

// The BullMQ queue name — must match BullModule.registerQueue in chat.module.ts
export const RECONNECT_QUEUE = 'chat-reconnect';
export const SESSION_TIMEOUT_QUEUE = 'chat-timeout';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Typed socket.data — avoids unsafe `any` access in handlers
interface SocketData {
  accountId?: string;
  roles?: string[];
}
type AuthSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

// How long (ms) to wait for a reconnect before ending the session
const RECONNECT_WINDOW_MS = 60_000;
// Authoritative session time limit — 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

@WebSocketGateway({ cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly chatServer: ChatServerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue(RECONNECT_QUEUE) private readonly reconnectQueue: Queue,
    @InjectQueue(SESSION_TIMEOUT_QUEUE) private readonly timeoutQueue: Queue,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────

  afterInit(server: Server) {
    // Share the server reference with the BullMQ processor so it can
    // emit events to rooms when a reconnect window expires.
    this.chatServer.register(server);
  }

  // ── JWT Verification ─────────────────────────────────────────────

  /**
   * Extract and verify the JWT from the Socket.IO handshake.
   * Clients must include: `{ auth: { token: 'Bearer <access_token>' } }`
   */
  private async verifyToken(
    client: AuthSocket,
  ): Promise<{ accountId: string; roles: string[] } | null> {
    const raw = client.handshake.auth?.token as string | undefined;

    // Development-only fallback: accept a plain accountId from query params so
    // the mobile team can connect before the JWT auth flow is wired up.
    if (!raw && process.env.NODE_ENV !== 'production') {
      const q = client.handshake.query?.userId;
      const queryUserId = Array.isArray(q) ? q[0] : q;
      if (queryUserId && UUID_RE.test(queryUserId)) {
        return { accountId: queryUserId, roles: [] };
      }
    }

    if (!raw) return null;
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        roles: string[];
      }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      return { accountId: payload.sub, roles: payload.roles };
    } catch {
      return null;
    }
  }

  // ── Connection Lifecycle ─────────────────────────────────────────

  async handleConnection(client: AuthSocket) {
    // 1. Verify JWT
    const identity = await this.verifyToken(client);
    if (!identity) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
      return;
    }

    const { accountId, roles } = identity;

    // 2. Single-device enforcement — disconnect any existing socket for this account
    const existingSocketId =
      await this.chatService.getSocketIdByAccount(accountId);
    if (existingSocketId && existingSocketId !== client.id) {
      const existingSocket = this.server.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('error', {
          message: 'Displaced by new connection',
        });
        existingSocket.disconnect();
      }
    }

    // 3. Register socket ↔ account mappings in Redis
    await this.chatService.mapSocket(client.id, accountId);

    // 4. Attach to socket data for cheap access in handlers
    client.data.accountId = accountId;
    client.data.roles = roles;

    // 5. Add volunteer to pool if eligible (has volunteer role, isAvailable, no active session)
    if (roles.includes('volunteer')) {
      const eligible = await this.chatService.isEligibleForPool(accountId);
      if (eligible) {
        const activeSessionId =
          await this.chatService.getActiveSessionId(accountId);
        if (!activeSessionId) {
          await this.chatService.addToPool(accountId);
        }
      }
    }

    console.log(`[WS] Connected  accountId=${accountId} socket=${client.id}`);
  }

  async handleDisconnect(client: AuthSocket) {
    // client.data is available even after disconnect on the same event loop tick
    const accountId =
      client.data.accountId ??
      (await this.chatService.getAccountIdBySocket(client.id));

    // Clean up Redis mappings
    await this.chatService.unmapSocket(client.id);

    if (!accountId) return;

    // Remove from volunteer pool (no-op if not in pool)
    await this.chatService.removeFromPool(accountId);

    // Check whether this account was in an active session
    const sessionId = await this.chatService.getAccountSession(accountId);
    if (sessionId) {
      // Mark the account as reconnecting in the session hash
      await this.chatService.updateSessionHash(sessionId, {
        [`reconnecting:${accountId}`]: '1',
      });

      // Notify the peer that this participant dropped
      this.server.to(sessionId).emit('peer:disconnected', { accountId });

      // Schedule a delayed job — if no reconnect within 60 s, end the session
      const jobId = `reconnect-${accountId}-${sessionId}`;
      await this.reconnectQueue.add(
        'reconnect-expire',
        { accountId, sessionId },
        { delay: RECONNECT_WINDOW_MS, jobId, removeOnComplete: true },
      );
    }

    console.log(`[WS] Disconnected accountId=${accountId} socket=${client.id}`);
  }

  // ── Room Management ─────────────────────────────────────────────

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @MessageBody()
    payload: { sessionId: string; lastMsgIndex?: number },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return { status: 'error', message: 'Not authenticated' };

    const isValid = await this.chatService.validateSession(
      payload.sessionId,
      accountId,
    );
    if (!isValid) return { status: 'error', message: 'Invalid session' };

    await client.join(payload.sessionId);

    // Track this account's current session for disconnect handling
    await this.chatService.setAccountSession(accountId, payload.sessionId);

    // ── Reconnect path ──────────────────────────────────────────
    const sessionHash = await this.chatService.getSessionHash(
      payload.sessionId,
    );
    const reconnectKey = `reconnecting:${accountId}`;
    const isReconnect = sessionHash?.[reconnectKey] === '1';

    if (isReconnect) {
      // Cancel the pending reconnect-expire job
      const jobId = `reconnect-${accountId}-${payload.sessionId}`;
      const job = await this.reconnectQueue.getJob(jobId);
      await job?.remove();

      // Clear the reconnecting flag
      await this.chatService.updateSessionHash(payload.sessionId, {
        [reconnectKey]: '0',
      });

      // Server-push missed messages to the reconnecting client
      const afterIndex = payload.lastMsgIndex ?? 0;
      const messages = await this.chatService.getMessages(
        payload.sessionId,
        afterIndex,
      );
      if (messages.length > 0) {
        client.emit('message:sync', {
          sessionId: payload.sessionId,
          messages,
        });
      }

      // Let the peer know their partner is back
      client.to(payload.sessionId).emit('peer:reconnected', { accountId });

      console.log(
        `[WS] Reconnected accountId=${accountId} session=${payload.sessionId}`,
      );
      return { sessionId: payload.sessionId, status: 'reconnected' };
    }

    // ── Fresh join: send stored public keys so late joiners can catch up ──
    const storedKeys = await this.chatService.getStoredKeys(payload.sessionId);
    for (const [keyAccountId, publicKey] of Object.entries(storedKeys)) {
      if (keyAccountId !== accountId) {
        client.emit('key:exchange', {
          sessionId: payload.sessionId,
          accountId: keyAccountId,
          publicKey,
        });
      }
    }

    // Start the 30-minute authoritative timer exactly once per session.
    // Keyed by sessionId so both participants racing to join are idempotent.
    if (!sessionHash?.timerStarted) {
      const jobId = `timeout-${payload.sessionId}`;
      await this.timeoutQueue.add(
        'session-timeout',
        { sessionId: payload.sessionId },
        { delay: SESSION_TIMEOUT_MS, jobId, removeOnComplete: true },
      );
      await this.chatService.updateSessionHash(payload.sessionId, {
        timerStarted: '1',
      });
    }

    console.log(
      `[WS] Room join  accountId=${accountId} session=${payload.sessionId}`,
    );
    return { sessionId: payload.sessionId, status: 'joined' };
  }

  // ── E2EE Key Exchange ───────────────────────────────────────────

  @SubscribeMessage('key:exchange')
  async handleKeyExchange(
    @MessageBody() payload: { sessionId: string; publicKey: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return { status: 'error', message: 'Not authenticated' };

    if (!client.rooms.has(payload.sessionId)) {
      return { status: 'error', message: 'Not in session' };
    }

    // Persist key so late joiners / reconnects can get it via room:join
    await this.chatService.storePublicKey(
      payload.sessionId,
      accountId,
      payload.publicKey,
    );

    // Relay to all other participants — opaque, no processing
    client.to(payload.sessionId).emit('key:exchange', {
      sessionId: payload.sessionId,
      accountId,
      publicKey: payload.publicKey,
    });

    return { status: 'ok' };
  }

  // ── Messaging ───────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @MessageBody()
    payload: {
      sessionId: string;
      encryptedPayload: string;
      clientMsgId: string;
      timestamp: number;
    },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return { status: 'error', message: 'Not authenticated' };

    if (!client.rooms.has(payload.sessionId)) {
      return { status: 'error', message: 'Not in session' };
    }

    // Rate limit: 30 messages per minute
    const allowed = await this.chatService.checkRateLimit(
      client.id,
      'message:send',
    );
    if (!allowed) {
      return { status: 'error', message: 'Rate limit exceeded' };
    }

    const message = { ...payload, senderId: accountId };

    // Buffer in Redis for reconnection recovery
    const msgIndex = await this.chatService.bufferMessage(
      payload.sessionId,
      message,
    );

    // Relay to the peer
    client
      .to(payload.sessionId)
      .emit('message:receive', { ...message, msgIndex });

    // Ack to sender
    return { clientMsgId: payload.clientMsgId, status: 'delivered', msgIndex };
  }

  @SubscribeMessage('message:seen')
  handleMessageSeen(
    @MessageBody()
    payload: { sessionId: string; clientMsgId: string; msgIndex: number },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return { status: 'error', message: 'Not authenticated' };

    if (!client.rooms.has(payload.sessionId)) {
      return { status: 'error', message: 'Not in session' };
    }

    // Relay the seen acknowledgement to the peer
    client.to(payload.sessionId).emit('message:ack', {
      ...payload,
      status: 'seen',
      seenBy: accountId,
    });

    return { status: 'ok' };
  }

  // ── Typing Indicators ────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return;
    if (!client.rooms.has(payload.sessionId)) return;

    // Rate limit: 5 per 5 s to prevent abuse
    const allowed = await this.chatService.checkRateLimit(
      client.id,
      'typing:start',
    );
    if (!allowed) return;

    client
      .to(payload.sessionId)
      .emit('typing:start', { sessionId: payload.sessionId, accountId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return;
    if (!client.rooms.has(payload.sessionId)) return;

    client
      .to(payload.sessionId)
      .emit('typing:stop', { sessionId: payload.sessionId, accountId });
  }

  // ── Session End ──────────────────────────────────────────────────

  @SubscribeMessage('session:end')
  async handleSessionEnd(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return { status: 'error', message: 'Not authenticated' };

    if (!client.rooms.has(payload.sessionId)) {
      return { status: 'error', message: 'Not in session' };
    }

    const participants = await this.chatService.endSession(
      payload.sessionId,
      'completed',
    );
    if (!participants) {
      // Already ended
      return { status: 'already_ended' };
    }

    // Notify everyone in the room that the session is over
    this.server.to(payload.sessionId).emit('session:ended', {
      sessionId: payload.sessionId,
      endedBy: accountId,
      reason: 'user_ended',
    });

    // Cancel the server-side 30-minute timeout (no-op if already fired)
    const timeoutJob = await this.timeoutQueue.getJob(
      `timeout-${payload.sessionId}`,
    );
    await timeoutJob?.remove();

    // Cancel any pending reconnect-expire jobs for both participants
    const seekerReconnectJob = await this.reconnectQueue.getJob(
      `reconnect-${participants.seekerId}-${payload.sessionId}`,
    );
    await seekerReconnectJob?.remove();
    if (participants.listenerId) {
      const listenerReconnectJob = await this.reconnectQueue.getJob(
        `reconnect-${participants.listenerId}-${payload.sessionId}`,
      );
      await listenerReconnectJob?.remove();
    }

    // Clean up Redis
    await this.chatService.clearAccountSession(participants.seekerId);
    if (participants.listenerId) {
      await this.chatService.clearAccountSession(participants.listenerId);
    }
    await this.chatService.purgeMessages(payload.sessionId);

    return { status: 'ok' };
  }

  // ── WebRTC Signaling — pure relay ────────────────────────────────

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @MessageBody() payload: { sessionId: string; [key: string]: unknown },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.rooms.has(payload.sessionId)) return;
    client.to(payload.sessionId).emit('call:offer', payload);
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @MessageBody() payload: { sessionId: string; [key: string]: unknown },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.rooms.has(payload.sessionId)) return;
    client.to(payload.sessionId).emit('call:answer', payload);
  }

  @SubscribeMessage('call:rejected')
  handleCallRejected(
    @MessageBody() payload: { sessionId: string; [key: string]: unknown },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.rooms.has(payload.sessionId)) return;
    client.to(payload.sessionId).emit('call:rejected', payload);
  }

  @SubscribeMessage('call:ended')
  handleCallEnded(
    @MessageBody() payload: { sessionId: string; [key: string]: unknown },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.rooms.has(payload.sessionId)) return;
    client.to(payload.sessionId).emit('call:ended', payload);
  }

  @SubscribeMessage('ice:candidate')
  handleIceCandidate(
    @MessageBody() payload: { sessionId: string; [key: string]: unknown },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.rooms.has(payload.sessionId)) return;
    client.to(payload.sessionId).emit('ice:candidate', payload);
  }
}
