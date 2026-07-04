import { Router } from 'express';
import {
  getDashboard,
  getSalesReport,
  getDishReport,
  getTableRevenue,
  getKitchenReport,
  getStaffReport,
  getDishRevenue,
  getCategoryReport,
  getStaff,
  createStaff,
  updateStaff,
  resetPassword,
  toggleActive,
  deleteStaff,
} from '../controllers/admin.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/reports/sales', getSalesReport);
router.get('/reports/dishes', getDishReport);
router.get('/reports/table-revenue', getTableRevenue);
router.get('/reports/kitchen', getKitchenReport);
router.get('/reports/staff', getStaffReport);
router.get('/reports/dish-revenue', getDishRevenue);
router.get('/reports/categories', getCategoryReport);
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.put('/staff/:id/reset-password', resetPassword);
router.put('/staff/:id/toggle-active', toggleActive);
router.delete('/staff/:id', deleteStaff);

export default router;
