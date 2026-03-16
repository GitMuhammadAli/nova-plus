import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../auth/utils/jwt-secret.util';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3100'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // Track connected users for cleanup
  private connectedUsers = new Map<string, { userId: string; companyId: string }>();

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token`);
        client.disconnect();
        return;
      }

      const secret = getJwtSecret();
      const payload: any = jwt.verify(token, secret);

      if (!payload?.sub) {
        this.logger.warn(`Client ${client.id} disconnected: invalid payload`);
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      const companyId = payload.companyId;

      // Store user info on socket for later use
      client.data.userId = userId;
      client.data.companyId = companyId;

      // Join user-specific and company-specific rooms
      client.join(`user:${userId}`);
      if (companyId) {
        client.join(`company:${companyId}`);
      }

      this.connectedUsers.set(client.id, { userId, companyId });

      this.logger.log(
        `Client connected: ${client.id} (user: ${userId}, company: ${companyId})`,
      );
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} disconnected: auth failed - ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('markRead')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    // The actual DB update is handled by the controller/service via REST.
    // This event allows the client to optimistically update and notify other tabs.
    const userId = client.data.userId;
    if (userId) {
      this.server
        .to(`user:${userId}`)
        .emit('notificationRead', { notificationId: data.notificationId });
    }
  }

  @SubscribeMessage('markAllRead')
  handleMarkAllRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.server.to(`user:${userId}`).emit('allNotificationsRead');
    }
  }

  /**
   * Send a notification to a specific user's room
   */
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Send a notification to all users in a company room
   */
  sendToCompany(companyId: string, notification: any) {
    this.server.to(`company:${companyId}`).emit('notification', notification);
  }
}
