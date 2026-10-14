import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.list);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);

export const notificationRoutes = router;
