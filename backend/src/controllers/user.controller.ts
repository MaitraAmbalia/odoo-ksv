import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const where: any = {};
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);
  res.json(apiResponse.paginated(users, { page, limit, total }));
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: (req.params.id as string) }, select: { id: true, firstName: true, lastName: true, email: true, role: true, phone: true, country: true, isActive: true, createdAt: true } });
  res.json(apiResponse.success(user));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({ where: { id: (req.params.id as string) }, data: { isActive: req.body.isActive } });
  res.json(apiResponse.success({ id: user.id, isActive: user.isActive }, 'User status updated'));
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({ where: { id: (req.params.id as string) }, data: { role: req.body.role } });
  res.json(apiResponse.success({ id: user.id, role: user.role }, 'User role updated'));
});
