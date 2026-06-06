import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const now   = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const userRole = (req.user as any).role;
  const userId = (req.user as any).id;

  if (userRole === 'VENDOR') {
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (!vendor) return res.json(apiResponse.success({ activeRFQs: 0, pendingApprovals: 0, posThisMonth: 0, overdueInvoices: 0, totalSpendThisMonth: 0 }));

    const [activeRFQs, pendingQuotations, posThisMonth, overdueInvoices, vendorPOs] = await Promise.all([
      prisma.rFQ.count({ where: { vendorInvites: { some: { vendorId: vendor.id } }, status: 'PUBLISHED' } }),
      prisma.quotation.count({ where: { vendorId: vendor.id, status: 'SUBMITTED' } }),
      prisma.purchaseOrder.count({ where: { vendorId: vendor.id, issuedAt: { gte: month } } }),
      prisma.invoice.count({ where: { vendorId: vendor.id, status: 'OVERDUE' } }),
      prisma.purchaseOrder.findMany({ where: { vendorId: vendor.id, issuedAt: { gte: month } }, include: { quotation: true } })
    ]);
    
    const totalSpendThisMonth = vendorPOs.reduce((sum, po) => sum + (po.quotation?.grandTotal || 0), 0);

    return res.json(apiResponse.success({
      activeRFQs,
      pendingApprovals: pendingQuotations, // mapped to pendingQuotations for vendors
      posThisMonth,
      overdueInvoices,
      totalSpendThisMonth
    }));
  }

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
  const userRole = (req.user as any).role;
  const userId = (req.user as any).id;
  let whereClause = {};

  if (userRole === 'VENDOR') {
    const vendor = await prisma.vendor.findFirst({ where: { userId } });
    if (vendor) {
      whereClause = { vendorId: vendor.id };
    } else {
      return res.json(apiResponse.success([]));
    }
  }

  const pos = await prisma.purchaseOrder.findMany({ 
    where: whereClause,
    take: 5, 
    include: { vendor: true, quotation: { select: { grandTotal: true } } }, 
    orderBy: { issuedAt: 'desc' } 
  });
  res.json(apiResponse.success(pos));
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.activityLog.findMany({ take: 10, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(apiResponse.success(logs));
});
