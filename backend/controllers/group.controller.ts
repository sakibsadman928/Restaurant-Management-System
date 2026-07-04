import { Request, Response } from "express";
import { Group, Table, Order } from "../models";
import { ITable } from "../models/table.model";
import asyncHandler from "../utils/asyncHandler";
import { sendSuccess, sendError } from "../utils/apiResponse";

export const getGroupsByTable = asyncHandler(
  async (req: Request, res: Response) => {
    let tableId = req.query.table;
    if (Array.isArray(tableId)) tableId = tableId[0];
    if (!tableId || typeof tableId !== "string")
      return sendError(res, "Table ID is required");

    const table = await Table.findById(tableId);
    if (!table) return sendError(res, "Table not found", 404);

    if (
      req.user!.role === "waiter" &&
      table.assignedWaiter?.toString() !== req.user!.id
    )
      return sendError(res, "You are not assigned to this table", 403);

    const groups = await Group.find({ table: tableId }).sort({ createdAt: 1 });

    const groupsWithStats = await Promise.all(
      groups.map(async (g) => {
        const orders = await Order.find({
          group: g._id,
          paymentStatus: "unpaid",
        });
        return {
          ...g.toJSON(),
          activeOrderCount: orders.length,
          runningTotal: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        };
      }),
    );

    const activeGuestTotal = groups
      .filter((g) => g.paymentStatus === "unpaid")
      .reduce((sum, g) => sum + g.guestCount, 0);

    return sendSuccess(res, {
      groups: groupsWithStats,
      remainingSeats: table.capacity - activeGuestTotal,
      capacity: table.capacity,
    });
  },
);

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const { tableId, guestCount } = req.body;
  if (!tableId || !guestCount)
    return sendError(res, "tableId and guestCount are required");

  const table = await Table.findById(tableId);
  if (!table) return sendError(res, "Table not found", 404);

  if (
    req.user!.role === "waiter" &&
    table.assignedWaiter?.toString() !== req.user!.id
  )
    return sendError(res, "You are not assigned to this table", 403);

  const activeGroups = await Group.find({
    table: tableId,
    paymentStatus: "unpaid",
  });
  const usedSeats = activeGroups.reduce((sum, g) => sum + g.guestCount, 0);
  const remainingSeats = table.capacity - usedSeats;

  if (Number(guestCount) > remainingSeats)
    return sendError(
      res,
      `Table capacity exceeded. Maximum available seats: ${remainingSeats}`,
      400,
    );

  const totalGroups = await Group.countDocuments({ table: tableId });
  const groupLabel = `G${totalGroups + 1}`;

  const group = await Group.create({
    table: tableId,
    groupLabel,
    guestCount: Number(guestCount),
  });

  if (table.status === "available") {
    table.status = "occupied";
    await table.save();
  }

  return sendSuccess(
    res,
    { group, remainingSeats: remainingSeats - Number(guestCount) },
    `${groupLabel} created — ${guestCount} guest(s) seated`,
    201,
  );
});

export const getGroupBill = asyncHandler(
  async (req: Request, res: Response) => {
    const group = await Group.findById(req.params.id).populate<{
      table: ITable;
    }>("table");
    if (!group) return sendError(res, "Group not found", 404);

    if (
      req.user!.role === "waiter" &&
      group.table.assignedWaiter?.toString() !== req.user!.id
    )
      return sendError(res, "Not authorized", 403);

    const orders = await Order.find({
      group: req.params.id,
      paymentStatus: "unpaid",
    });
    const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return sendSuccess(res, { orders, total, group });
  },
);

export const payGroup = asyncHandler(async (req: Request, res: Response) => {
  const { paymentMethod } = req.body;
  if (!["cash", "card"].includes(paymentMethod))
    return sendError(res, "Payment method must be cash or card");

  const group = await Group.findById(req.params.id).populate<{ table: ITable }>(
    "table",
  );
  if (!group) return sendError(res, "Group not found", 404);
  if (group.paymentStatus === "paid")
    return sendError(res, "Group has already paid", 400);

  if (
    req.user!.role === "waiter" &&
    group.table.assignedWaiter?.toString() !== req.user!.id
  )
    return sendError(res, "Not authorized", 403);

  const unpaidOrders = await Order.countDocuments({
    group: req.params.id,
    paymentStatus: "unpaid",
  });
  if (unpaidOrders === 0)
    return sendError(res, "No unpaid orders found for this group", 400);

  await Order.updateMany(
    { group: req.params.id, paymentStatus: "unpaid" },
    { paymentStatus: "paid", paymentMethod, status: "completed" },
  );

  group.paymentStatus = "paid";
  group.paymentMethod = paymentMethod;
  await group.save();

  const remainingUnpaidGroups = await Group.countDocuments({
    table: group.table._id,
    paymentStatus: "unpaid",
  });

  if (remainingUnpaidGroups === 0) {
    await Table.findByIdAndUpdate(group.table._id, { status: "available" });
  }

  return sendSuccess(res, null, "Payment completed successfully");
});
