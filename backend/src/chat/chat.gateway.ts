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
import { Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ChatGateway.name);

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

    // 5. Volunteer pool management
    if (roles.includes('volunteer')) {
      // Always track the volunteer as online (regardless of availability/session)
      await this.chatService.addToOnlinePool(accountId);

      // Add to available (matchable) pool only if eligible and not already in a session
      const eligible = await this.chatService.isEligibleForPool(accountId);
      if (eligible) {
        const activeSessionId =
          await this.chatService.getActiveSessionId(accountId);
        if (!activeSessionId) {
          await this.chatService.addToPool(accountId);
        }
      }
    }

    this.logger.log(`Connected  accountId=${accountId} socket=${client.id}`);
  }

  async handleDisconnect(client: AuthSocket) {
    // client.data is available even after disconnect on the same event loop tick
    const accountId =
      client.data.accountId ??
      (await this.chatService.getAccountIdBySocket(client.id));

    // Clean up Redis mappings
    await this.chatService.unmapSocket(client.id);

    if (!accountId) return;

    // Remove from volunteer pools (both no-ops if not a member)
    await this.chatService.removeFromPool(accountId);
    if (client.data.roles?.includes('volunteer')) {
      await this.chatService.removeFromOnlinePool(accountId);
    }

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

    this.logger.log(`Disconnected accountId=${accountId} socket=${client.id}`);
  }

  // ── Session Matching ─────────────────────────────────────────────

  /**
   * Emitted by a seeker to request a chat session.
   *
   * Flow:
   *  1. Validate the seeker is not already in a session.
   *  2. Validate the UserProblem belongs to the seeker and is still 'waiting'.
   *  3. Loop: SPOP a volunteer, verify their socket is alive, skip stale entries.
   *  4. Create the ChatSession in Postgres (guarded updateMany prevents double-match).
   *  5. Emit `session:matched` to the volunteer; return { status, sessionId } to seeker.
   *     On DB failure, return the volunteer to the pool and ack an error to the seeker.
   */
  @SubscribeMessage('session:request')
  async handleSessionRequest(
    @MessageBody() payload: { problemId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const accountId = client.data.accountId;
    if (!accountId) return { status: 'error', message: 'Not authenticated' };

    // Reject if the seeker already has an active session in the DB
    const existingSession =
      await this.chatService.getActiveSessionId(accountId);
    if (existingSession) {
      return { status: 'error', message: 'Already in a session' };
    }

    // Validate the problem is owned by this seeker and still waiting
    const problemValid = await this.chatService.validateProblemForSeeker(
      payload.problemId,
      accountId,
    );
    if (!problemValid) {
      return { status: 'error', message: 'Invalid or unavailable problem' };
    }

    // Loop over the available pool until we find a volunteer whose socket is
    // still alive, skipping stale entries left by disconnect races or crashes.
    let volunteerId: string | null;
    let volSocket: Socket | undefined;

    while (true) {
      volunteerId = await this.chatService.claimVolunteer();
      if (!volunteerId) {
        return { status: 'no_volunteer' };
      }

      const volSocketId =
        await this.chatService.getSocketIdByAccount(volunteerId);
      volSocket = volSocketId
        ? this.server.sockets.sockets.get(volSocketId)
        : undefined;

      if (volSocket) break;

      // Stale pool entry — purge the stale socket mapping and try the next candidate
      if (volSocketId) await this.chatService.unmapSocket(volSocketId);
    }

    // volunteerId and volSocket are both non-null/defined from here.
    // Wrap session creation so a DB failure returns the volunteer to the pool.
    try {
      const sessionId = await this.chatService.createSession(
        accountId,
        volunteerId,
        payload.problemId,
      );

      // Notify the volunteer — they will call room:join after receiving this
      volSocket.emit('session:matched', { sessionId });

      this.logger.log(
        `Matched  seeker=${accountId} listener=${volunteerId} session=${sessionId}`,
      );

      // Return sessionId to the seeker via ack — they will also call room:join
      return { status: 'matched', sessionId };
    } catch (err) {
      this.logger.error(
        `Session creation failed seeker=${accountId} listener=${volunteerId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Return the volunteer to the available pool if they're still connected
      await this.chatService.reAddVolunteerToPoolIfEligible(volunteerId);
      return {
        status: 'error',
        message: 'Failed to start session. Please try again.',
      };
    }
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
        const messagesWithIndex = messages.map((msg, idx) => ({
          ...msg,
          msgIndex: afterIndex + idx,
        }));
        client.emit('message:sync', {
          sessionId: payload.sessionId,
          messages: messagesWithIndex,
        });
      }

      // Let the peer know their partner is back
      client.to(payload.sessionId).emit('peer:reconnected', { accountId });

      this.logger.log(
        `Reconnected accountId=${accountId} session=${payload.sessionId}`,
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

    this.logger.log(
      `Room join  accountId=${accountId} session=${payload.sessionId}`,
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

    // If the volunteer is still online and available, return them to the pool
    if (participants.listenerId) {
      await this.chatService.reAddVolunteerToPoolIfEligible(
        participants.listenerId,
      );
    }

    return { status: 'ok' };
  }

  // ── WebRTC Signaling ─────────────────────────────────────────────
  // Calling is post-MVP. When re-enabling, add handlers for:
  //   call:offer, call:answer, call:rejected, call:ended, ice:candidate
  // Each handler should verify the client is in the session room before
  // relaying the payload to the peer.
}
