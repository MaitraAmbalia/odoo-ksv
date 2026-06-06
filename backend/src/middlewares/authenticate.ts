import jwt from 'jsonwebtoken';
import { asyncHandler } from './asyncHandler';
import { AppError } from './errorHandler';
import prisma from '../config/db';
import { env } from '../config/env';

interface JWTPayload { id: string; role: string; }

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError(401, 'No token provided');

  const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!user || !user.isActive) throw new AppError(401, 'Account not found or inactive');
  req.user = user;
  next();
});
