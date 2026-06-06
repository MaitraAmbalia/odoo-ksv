import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const now   = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeRFQs, pendingApprovals, posThisMonth, overdueInvoices, spendResult] =
    await Promise.all([
      prisma.rFQ.count({ where: { status: 'PUBLISHED' } }),
      prisma.approval.count({ where: { status: 'PENDING' } }),
      prisma.purchaseOrder.count({ where: { issuedAt: { gte: month } } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: { status: { in: ['SENT', 'PAID'] }, createdAt: { gte: month } },
        _sum: { grandTotal: true },
      }),
    ]);

  res.json(apiResponse.success({
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    overdueInvoices,
    totalSpendThisMonth: spendResult._sum.grandTotal ?? 0,
  }));
});

export const getRecentPOs = asyncHandler(async (req: Request, res: Response) => {
  const pos = await prisma.purchaseOrder.findMany({ take: 5, include: { vendor: true }, orderBy: { issuedAt: 'desc' } });
  res.json(apiResponse.success(pos));
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.activityLog.findMany({ take: 10, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(apiResponse.success(logs));
});
