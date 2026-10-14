import { prisma } from '../../db/prisma';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  static async createNotification(data: {
    hospitalId: string;
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        hospitalId: data.hospitalId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.SYSTEM,
        link: data.link || null,
        isRead: false,
      },
    });
  }

  static async listUserNotifications(
    hospitalId: string,
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId, userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { hospitalId, userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async markAsRead(hospitalId: string, userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, hospitalId, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(hospitalId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { hospitalId, userId, isRead: false },
      data: { isRead: true },
    });
  }
}
