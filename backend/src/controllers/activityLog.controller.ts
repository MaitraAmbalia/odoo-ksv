import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';

export const listLogs = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId, userId } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({ where, skip, take: limit, include: { user: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.activityLog.count({ where }),
  ]);
  res.json(apiResponse.paginated(logs, { page, limit, total }));
});
