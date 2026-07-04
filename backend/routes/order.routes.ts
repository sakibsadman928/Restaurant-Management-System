import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateItems,
  sendToKitchen,
  updateStatus,
  markServed,
} from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect);

router.post('/', authorize('waiter'), createOrder);
router.get('/', authorize('waiter', 'chef', 'admin'), getOrders);
router.get('/:id', authorize('waiter', 'chef', 'admin'), getOrder);
router.put('/:id/items', authorize('waiter'), updateItems);
router.put('/:id/send', authorize('waiter'), sendToKitchen);
router.put('/:id/status', authorize('chef'), updateStatus);
router.put('/:id/serve', authorize('waiter'), markServed);

export default router;
