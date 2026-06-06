import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.get('/',               authenticate, ctrl.listNotifications);
router.get('/unread-count',   authenticate, ctrl.getUnreadCount);
router.patch('/:id/read',     authenticate, ctrl.markOneRead);
router.patch('/read-all',     authenticate, ctrl.markAllRead);

export default router;
