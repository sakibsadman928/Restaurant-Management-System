import { Request, Response } from "express";
import { Order, Table, MenuItem, Notification, Group } from "../models";
import { ITable } from "../models/table.model";
import asyncHandler from "../utils/asyncHandler";
import { sendSuccess, sendError } from "../utils/apiResponse";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, items } = req.body;
  if (!groupId) return sendError(res, "Group ID is required");

  const group = await Group.findById(groupId).populate<{ table: ITable }>(
    "table",
  );
  if (!group) return sendError(res, "Group not found", 404);
  if (group.paymentStatus === "paid")
    return sendError(res, "This group has already paid", 400);

  const table = group.table;
  if (table.assignedWaiter?.toString() !== req.user!.id)
    return sendError(res, "You are not assigned to this table", 403);

  const orderItems = [];
  if (items && items.length > 0) {
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem)
        return sendError(res, `Menu item not found: ${item.menuItemId}`, 404);
      if (!menuItem.isAvailable)
        return sendError(res, `${menuItem.name} is currently unavailable`, 400);
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? "",
      });
    }
  }

  const order = await Order.create({
    table: table._id,
    group: groupId,
    waiter: req.user!.id,
    items: orderItems,
  });

  return sendSuccess(res, { order }, "Order created", 201);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, table: tableQuery, group: groupQuery } = req.query;
  const table = typeof tableQuery === "string" ? tableQuery : undefined;
  const group = typeof groupQuery === "string" ? groupQuery : undefined;
  const filter: Record<string, any> = {};

  if (req.user!.role === "waiter") {
    if (table) {
      const owns = await Table.exists({
        _id: table,
        assignedWaiter: req.user!.id,
      });
      if (!owns)
        return sendError(res, "You are not assigned to this table", 403);
      filter.table = table;
    } else if (group) {
      filter.group = group;
    } else {
      const tables = await Table.find({ assignedWaiter: req.user!.id }).select(
        "_id",
      );
      filter.table = { $in: tables.map((t) => t._id) };
    }
    if (status) filter.status = status;
  } else if (req.user!.role === "chef") {
    filter.status = { $in: ["preparing", "ready"] };
    if (table) filter.table = table;
    if (group) filter.group = group;
  } else {
    if (status) filter.status = status;
    if (table) filter.table = table;
    if (group) filter.group = group;
  }

  const sortOrder = req.user!.role === "chef" ? 1 : -1;

  const orders = await Order.find(filter)
    .populate("table", "tableNumber status")
    .populate("waiter", "name")
    .populate("group", "groupLabel guestCount")
    .sort({ createdAt: sortOrder });

  return sendSuccess(res, { orders });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate("table", "tableNumber capacity status")
    .populate("waiter", "name email")
    .populate("group", "groupLabel guestCount")
    .populate("items.menuItem", "name price category");

  if (!order) return sendError(res, "Order not found", 404);

  if (
    req.user!.role === "waiter" &&
    order.waiter._id.toString() !== req.user!.id
  )
    return sendError(res, "Not authorized to view this order", 403);

  return sendSuccess(res, { order });
});

export const updateItems = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return sendError(res, "At least one item is required");

  const order = await Order.findById(req.params.id);
  if (!order) return sendError(res, "Order not found", 404);
  if (order.waiter.toString() !== req.user!.id)
    return sendError(res, "Not authorized to modify this order", 403);
  if (order.status !== "pending")
    return sendError(
      res,
      "Order cannot be modified after being sent to kitchen",
      400,
    );

  const orderItems = [];
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItemId);
    if (!menuItem)
      return sendError(res, `Menu item not found: ${item.menuItemId}`, 404);
    if (!menuItem.isAvailable)
      return sendError(res, `${menuItem.name} is currently unavailable`, 400);
    orderItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions ?? "",
    });
  }

  order.items = orderItems as typeof order.items;
  await order.save();
  return sendSuccess(res, { order }, "Order updated");
});

export const sendToKitchen = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, "Order not found", 404);
    if (order.waiter.toString() !== req.user!.id)
      return sendError(res, "Not authorized to update this order", 403);
    if (order.status !== "pending")
      return sendError(res, "Order has already been sent to kitchen", 400);
    if (order.items.length === 0)
      return sendError(res, "Cannot send an empty order to kitchen", 400);

    order.status = "preparing";
    order.kitchenSentAt = new Date();
    await order.save();
    return sendSuccess(res, { order }, "Order sent to kitchen");
  },
);

export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body;
    if (!["preparing", "ready"].includes(status))
      return sendError(res, "Chef can only set status to preparing or ready");

    const order = await Order.findById(req.params.id).populate<{
      table: ITable;
    }>("table");
    if (!order) return sendError(res, "Order not found", 404);
    if (order.status !== "preparing")
      return sendError(
        res,
        "Only preparing orders can be updated by the kitchen",
        400,
      );

    order.status = status;
    if (status === "ready") order.readyAt = new Date();
    await order.save();

    if (status === "ready" && order.table.assignedWaiter) {
      await Notification.create({
        type: "order_ready",
        order: order._id,
        table: order.table._id,
        waiter: order.table.assignedWaiter,
      });
    }

    return sendSuccess(res, { order }, `Order marked as ${status}`);
  },
);

export const markServed = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) return sendError(res, "Order not found", 404);
  if (order.waiter.toString() !== req.user!.id)
    return sendError(res, "Not authorized to update this order", 403);
  if (order.status !== "ready")
    return sendError(res, "Order must be ready before marking as served", 400);

  order.status = "served";
  await order.save();
  return sendSuccess(res, { order }, "Order marked as served");
});
