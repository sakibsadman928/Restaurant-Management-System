import { Router } from 'express';
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} from '../controllers/menu.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

router.use(protect);

router.get('/', getMenuItems);
router.get('/:id', getMenuItem);
router.post('/', authorize('admin'), uploadSingle, createMenuItem);
router.put('/:id', authorize('admin'), uploadSingle, updateMenuItem);
router.delete('/:id', authorize('admin'), deleteMenuItem);
router.patch('/:id/availability', authorize('admin'), toggleAvailability);

export default router;
