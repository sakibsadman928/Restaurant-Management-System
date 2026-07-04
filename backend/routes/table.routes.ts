import { Router } from 'express';
import {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  assignWaiter,
} from '../controllers/table.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect);

router.get('/', authorize('waiter', 'admin'), getTables);
router.get('/:id', authorize('waiter', 'admin'), getTable);
router.post('/', authorize('admin'), createTable);
router.put('/:id', authorize('admin'), updateTable);
router.delete('/:id', authorize('admin'), deleteTable);
router.put('/:id/assign', authorize('admin'), assignWaiter);

export default router;
