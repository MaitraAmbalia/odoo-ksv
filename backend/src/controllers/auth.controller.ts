import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as authService from '../services/auth.service';
import { apiResponse } from '../utils/apiResponse';
import { registerSchema, loginSchema } from '../validators/auth.validator';

export const register = asyncHandler(async (req: Request, res: Response) => {
  registerSchema.parse({ body: req.body });
  const result = await authService.register(req.body);
  res.status(201).json(apiResponse.success(result, 'Registered successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  loginSchema.parse({ body: req.body });
  const result = await authService.login(req.body.email, req.body.password);
  res.status(200).json(apiResponse.success(result, 'Login successful'));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { passwordHash, ...user } = req.user as any;
  res.json(apiResponse.success(user));
});
