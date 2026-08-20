import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeGatewayPort } from '../../application/ports/realtime-gateway.port.js';
import type { TokenProviderPort } from '../../application/ports/token-provider.port.js';

@Injectable()
@WebSocketGateway({ cors: true })
export class SocketIoGatewayService
  implements RealtimeGatewayPort, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketIoGatewayService.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject('TokenProviderPort')
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  handleConnection(client: Socket): void {
    // Public order rooms (tracking page): no auth needed, join the room by name
    const room = (client.handshake.query?.room as string | undefined)?.trim();
    if (room && room.startsWith('order:')) {
      client.join(room);
      this.logger.log(`Client ${client.id} joined public room ${room}`);
      return;
    }

    const token = (client.handshake.auth?.token ??
      client.handshake.query?.token) as string | undefined;
    if (!token) {
      this.logger.warn(`Client ${client.id} disconnected: no auth token`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.tokenProvider.verifyAccess(token);
      client.join(`restaurant:${payload.restaurantId}`);
      (client as any).restaurantId = payload.restaurantId;
      this.logger.log(
        `Client authenticated for restaurant:${payload.restaurantId}`,
      );
    } catch {
      this.logger.warn(`Client ${client.id} disconnected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToRestaurant(restaurantId: string, event: string, data: unknown): void {
    this.server?.to(`restaurant:${restaurantId}`).emit(event, data);
  }

  emitToOrderRoom(
    restaurantId: string,
    code: string,
    event: string,
    data: unknown,
  ): void {
    this.server?.to(`order:${restaurantId}:${code}`).emit(event, data);
  }
}
