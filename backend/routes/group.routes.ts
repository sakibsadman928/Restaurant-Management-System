import { Router } from 'express';
import {
  getGroupsByTable,
  createGroup,
  getGroupBill,
  payGroup,
} from '../controllers/group.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect);

router.get('/', authorize('waiter', 'admin'), getGroupsByTable);
router.post('/', authorize('waiter'), createGroup);
router.get('/:id/bill', authorize('waiter'), getGroupBill);
router.post('/:id/pay', authorize('waiter'), payGroup);

export default router;
