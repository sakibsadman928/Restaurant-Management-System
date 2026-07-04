import { Request, Response } from 'express';
import { Table, Order, User, Group } from '../models';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getTables = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.user!.role === 'waiter' ? { assignedWaiter: req.user!.id } : {};

  const tables = await Table.find(filter)
    .populate('assignedWaiter', 'name email')
    .sort({ tableNumber: 1 });

  const activeGroupAgg = await Group.aggregate([
    { $match: { paymentStatus: 'unpaid' } },
    { $group: { _id: '$table', usedSeats: { $sum: '$guestCount' } } },
  ]);

  const usedSeatsMap = new Map(
    activeGroupAgg.map((g) => [g._id.toString(), g.usedSeats])
  );

  const tablesWithSeats = tables.map((t) => ({
    ...t.toJSON(),
    usedSeats: usedSeatsMap.get(t._id.toString()) ?? 0,
    remainingSeats: t.capacity - (usedSeatsMap.get(t._id.toString()) ?? 0),
  }));

  return sendSuccess(res, { tables: tablesWithSeats });
});

export const getTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await Table.findById(req.params.id).populate('assignedWaiter', 'name email');
  if (!table) return sendError(res, 'Table not found', 404);

  if (req.user!.role === 'waiter' && table.assignedWaiter?._id?.toString() !== req.user!.id)
    return sendError(res, 'You are not assigned to this table', 403);

  const activeGroups = await Group.find({ table: req.params.id, paymentStatus: 'unpaid' });
  const usedSeats = activeGroups.reduce((sum, g) => sum + g.guestCount, 0);

  return sendSuccess(res, {
    table: table.toJSON(),
    remainingSeats: table.capacity - usedSeats,
    usedSeats,
  });
});

export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const { tableNumber, capacity } = req.body;
  if (!tableNumber || !capacity) return sendError(res, 'Table number and capacity are required');

  const table = await Table.create({ tableNumber, capacity });
  return sendSuccess(res, { table }, 'Table created', 201);
});

export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const { tableNumber, capacity } = req.body;

  const table = await Table.findByIdAndUpdate(
    req.params.id,
    { ...(tableNumber && { tableNumber }), ...(capacity && { capacity }) },
    { new: true, runValidators: true }
  );

  if (!table) return sendError(res, 'Table not found', 404);
  return sendSuccess(res, { table }, 'Table updated');
});

export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await Table.findById(req.params.id);
  if (!table) return sendError(res, 'Table not found', 404);

  if (table.status === 'occupied')
    return sendError(res, 'Cannot delete an occupied table', 400);

  await table.deleteOne();
  return sendSuccess(res, null, 'Table deleted');
});

export const assignWaiter = asyncHandler(async (req: Request, res: Response) => {
  const { waiterId } = req.body;
  if (!waiterId) return sendError(res, 'Waiter ID is required');

  const waiter = await User.findById(waiterId);
  if (!waiter || waiter.role !== 'waiter')
    return sendError(res, 'Waiter not found or invalid role', 404);

  if (!waiter.isActive) return sendError(res, 'Cannot assign a deactivated waiter', 400);

  const table = await Table.findByIdAndUpdate(
    req.params.id,
    { assignedWaiter: waiterId },
    { new: true }
  ).populate('assignedWaiter', 'name email');

  if (!table) return sendError(res, 'Table not found', 404);
  return sendSuccess(res, { table }, 'Waiter assigned to table');
});
