import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

/**
 * Shared singleton that holds the Socket.IO server reference so that
 * BullMQ job processors (which live outside the gateway) can emit events
 * to connected clients.
 *
 * The gateway calls `register(server)` inside `afterInit()`.
 */
@Injectable()
export class ChatServerService {
  private _server: Server | null = null;

  register(server: Server): void {
    this._server = server;
  }

  get server(): Server {
    if (!this._server) {
      throw new Error('ChatServerService: server not registered yet');
    }
    return this._server;
  }
}
