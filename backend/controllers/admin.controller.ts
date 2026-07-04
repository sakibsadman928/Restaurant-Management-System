import { Request, Response } from 'express';
import { User, Table, Order, MenuItem } from '../models';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayOrders, revenueAgg, activeTables, totalStaff, topDishes] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Table.countDocuments({ status: 'occupied' }),
    User.countDocuments({ role: { $ne: 'admin' }, isActive: true }),
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', name: { $first: '$items.name' }, totalOrdered: { $sum: '$items.quantity' } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return sendSuccess(res, {
    todayOrders,
    todayRevenue: revenueAgg[0]?.total ?? 0,
    activeTables,
    totalStaff,
    topDishes,
  });
});

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || 'daily';
  const now = new Date();
  let startDate: Date;

  if (period === 'weekly') {
    startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
  } else {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  let groupId: Record<string, any>;
  if (period === 'weekly') {
    groupId = { year: { $isoWeekYear: '$createdAt' }, week: { $isoWeek: '$createdAt' } };
  } else if (period === 'monthly') {
    groupId = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
  } else {
    groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }

  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
    { $group: { _id: groupId, revenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return sendSuccess(res, { period, data });
});

export const getDishReport = asyncHandler(async (req: Request, res: Response) => {
  const allDishes = await MenuItem.aggregate([
    {
      $lookup: {
        from: 'orders',
        let: { menuItemId: '$_id' },
        pipeline: [
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.menuItem', '$$menuItemId'] },
            },
          },
          {
            $group: { _id: null, totalOrdered: { $sum: '$items.quantity' } },
          },
        ],
        as: 'orderData',
      },
    },
    {
      $project: {
        name: 1,
        totalOrdered: { $ifNull: [{ $first: '$orderData.totalOrdered' }, 0] },
      },
    },
    { $sort: { totalOrdered: -1 } },
  ]);

  return sendSuccess(res, {
    mostOrdered: allDishes.slice(0, 10),
    leastOrdered: [...allDishes].reverse().slice(0, 10),
  });
});

export const getTableRevenue = asyncHandler(async (req: Request, res: Response) => {
  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: '$table',
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'tables',
        localField: '_id',
        foreignField: '_id',
        as: 'tableData',
      },
    },
    { $unwind: '$tableData' },
    {
      $project: {
        tableNumber: '$tableData.tableNumber',
        capacity: '$tableData.capacity',
        revenue: 1,
        orderCount: 1,
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return sendSuccess(res, { data });
});

export const getKitchenReport = asyncHandler(async (req: Request, res: Response) => {
  const prepData = await Order.aggregate([
    {
      $match: {
        kitchenSentAt: { $exists: true, $ne: null },
        readyAt: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        prepTimeMinutes: {
          $divide: [{ $subtract: ['$readyAt', '$kitchenSentAt'] }, 60000],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgPrepTime: { $avg: '$prepTimeMinutes' },
        minPrepTime: { $min: '$prepTimeMinutes' },
        maxPrepTime: { $max: '$prepTimeMinutes' },
        totalMeasured: { $sum: 1 },
      },
    },
  ]);

  return sendSuccess(res, {
    avgPrepTimeMinutes: prepData[0]?.avgPrepTime ?? null,
    minPrepTimeMinutes: prepData[0]?.minPrepTime ?? null,
    maxPrepTimeMinutes: prepData[0]?.maxPrepTime ?? null,
    totalMeasured: prepData[0]?.totalMeasured ?? 0,
  });
});

export const getStaffReport = asyncHandler(async (req: Request, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [todayStats, monthlyStats] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: todayStart } } },
      { $group: { _id: '$waiter', orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'waiterData' } },
      { $unwind: '$waiterData' },
      { $project: { name: '$waiterData.name', orderCount: 1, revenue: 1 } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            waiter: '$waiter',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $lookup: { from: 'users', localField: '_id.waiter', foreignField: '_id', as: 'waiterData' } },
      { $unwind: '$waiterData' },
      {
        $project: {
          waiterName: '$waiterData.name',
          year: '$_id.year',
          month: '$_id.month',
          orderCount: 1,
          revenue: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]),
  ]);

  return sendSuccess(res, { todayStats, monthlyStats });
});

export const getDishRevenue = asyncHandler(async (req: Request, res: Response) => {
  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        name: { $first: '$items.name' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalQuantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 },
  ]);

  return sendSuccess(res, { data });
});

export const getCategoryReport = asyncHandler(async (req: Request, res: Response) => {
  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'menuitems',
        localField: 'items.menuItem',
        foreignField: '_id',
        as: 'menuItemData',
      },
    },
    { $unwind: '$menuItemData' },
    {
      $group: {
        _id: '$menuItemData.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return sendSuccess(res, { data });
});

export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ role: 1, name: 1 });
  return sendSuccess(res, { staff });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return sendError(res, 'Name, email, password, and role are required');
  if (!['waiter', 'chef'].includes(role)) return sendError(res, 'Role must be waiter or chef');

  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email is already in use', 409);

  const user = await User.create({ name, email, password, role });
  return sendSuccess(res, { user }, 'Staff account created', 201);
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'Staff not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot edit an admin account', 403);

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email is already in use', 409);
    user.email = email;
  }
  if (name) user.name = name;
  await user.save();
  return sendSuccess(res, { user }, 'Staff updated');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return sendError(res, 'Password must be at least 6 characters');

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'Staff not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot reset an admin password', 403);

  user.password = newPassword;
  await user.save();
  return sendSuccess(res, null, 'Password reset successfully');
});

export const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'Staff not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot deactivate an admin account', 403);

  user.isActive = !user.isActive;
  await user.save();
  return sendSuccess(res, { user }, `Account ${user.isActive ? 'activated' : 'deactivated'}`);
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'Staff not found', 404);
  if (user.role === 'admin') return sendError(res, 'Cannot delete an admin account', 403);

  await user.deleteOne();
  return sendSuccess(res, null, 'Staff account deleted');
});
