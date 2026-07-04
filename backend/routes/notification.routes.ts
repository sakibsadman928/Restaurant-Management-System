import { Router } from 'express';
import { getNotifications, markRead } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect, authorize('waiter'));

router.get('/', getNotifications);
router.put('/:id/read', markRead);

export default router;
