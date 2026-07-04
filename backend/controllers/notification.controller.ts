import { Request, Response } from 'express';
import { Notification } from '../models';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({
    waiter: req.user!.id,
    status: 'unread',
  })
    .populate('order', 'items totalAmount status')
    .populate('table', 'tableNumber')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { notifications });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, waiter: req.user!.id },
    { status: 'read' },
    { new: true }
  );

  if (!notification) return sendError(res, 'Notification not found', 404);

  return sendSuccess(res, { notification }, 'Notification marked as read');
});
