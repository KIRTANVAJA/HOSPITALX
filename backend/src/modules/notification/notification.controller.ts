import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await NotificationService.listUserNotifications(
        req.user!.hospitalId,
        req.user!.id,
        page,
        limit,
        unreadOnly
      );

      return sendSuccess(res, {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      }, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAsRead(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id
      );
      return sendSuccess(res, { success: true }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(
        req.user!.hospitalId,
        req.user!.id
      );
      return sendSuccess(res, { success: true }, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}
