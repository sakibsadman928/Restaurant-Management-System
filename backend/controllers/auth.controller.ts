import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';

const createToken = (id: string, role: string, email: string): string =>
  jwt.sign({ id, role, email }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Email and password are required');

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return sendError(res, 'Invalid email or password', 401);

  if (!user.isActive)
    return sendError(res, 'Account is deactivated. Contact admin.', 403);

  const token = createToken(user._id.toString(), user.role, user.email);

  return sendSuccess(res, { user, token }, 'Login successful');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, null, 'Logged out successfully');
});
