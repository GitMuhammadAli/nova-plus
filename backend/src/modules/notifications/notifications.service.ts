import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Create a notification, save to DB, and emit via WebSocket
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
      companyId: new Types.ObjectId(dto.companyId),
    });

    // Emit real-time notification to the user
    this.gateway.sendToUser(dto.userId, notification.toObject());

    return notification;
  }

  /**
   * Get paginated notifications for a user
   */
  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel
        .countDocuments({ userId: new Types.ObjectId(userId) })
        .exec(),
    ]);

    return { notifications, total, page, limit };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
        },
        { isRead: true, readAt: new Date() },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }

  /**
   * Delete a notification (owned by user)
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationModel
      .deleteOne({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOld(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.notificationModel
      .deleteMany({ createdAt: { $lt: cutoff } })
      .exec();

    return result.deletedCount;
  }
}
