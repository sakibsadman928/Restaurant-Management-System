import { Request, Response } from "express";
import { MenuItem } from "../models";
import asyncHandler from "../utils/asyncHandler";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { uploadImage, deleteImage } from "../utils/cloudinaryUpload";

export const getMenuItems = asyncHandler(
  async (req: Request, res: Response) => {
    const { search, category, available } = req.query;
    const filter: Record<string, any> = {};

    if (search) filter.name = { $regex: search as string, $options: "i" };
    if (category) filter.category = category as string;
    if (available !== undefined) filter.isAvailable = available === "true";

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    return sendSuccess(res, { items });
  },
);

export const getMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return sendError(res, "Menu item not found", 404);
  return sendSuccess(res, { item });
});

export const createMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, price, category } = req.body;
    if (!name || price === undefined || !category)
      return sendError(res, "Name, price, and category are required");

    let image = { url: "", publicId: "" };
    if (req.file) {
      const result = await uploadImage(req.file.buffer);
      image = { url: result.secure_url, publicId: result.public_id };
    }

    const item = await MenuItem.create({
      name,
      description: description ?? "",
      price: Number(price),
      category,
      image,
    });

    return sendSuccess(res, { item }, "Menu item created", 201);
  },
);

export const updateMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, price, category } = req.body;
    const item = await MenuItem.findById(req.params.id);
    if (!item) return sendError(res, "Menu item not found", 404);

    if (req.file) {
      if (item.image.publicId) await deleteImage(item.image.publicId);
      const result = await uploadImage(req.file.buffer);
      item.image = { url: result.secure_url, publicId: result.public_id };
    }

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = Number(price);
    if (category !== undefined) item.category = category;

    await item.save();
    return sendSuccess(res, { item }, "Menu item updated");
  },
);

export const deleteMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return sendError(res, "Menu item not found", 404);

    if (item.image.publicId) await deleteImage(item.image.publicId);
    await item.deleteOne();
    return sendSuccess(res, null, "Menu item deleted");
  },
);

export const toggleAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return sendError(res, "Menu item not found", 404);

    item.isAvailable = !item.isAvailable;
    await item.save();

    return sendSuccess(
      res,
      { item },
      `Item marked as ${item.isAvailable ? "available" : "unavailable"}`,
    );
  },
);
