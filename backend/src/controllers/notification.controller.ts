import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where: { userId: req.user.id } }),
  ]);
  res.json(apiResponse.paginated(notifications, { page, limit, total }));
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json(apiResponse.success({ count }));
});

export const markOneRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.update({ where: { id: (req.params.id as string) }, data: { isRead: true } });
  res.json(apiResponse.success(null, 'Marked as read'));
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json(apiResponse.success(null, 'All marked as read'));
});
