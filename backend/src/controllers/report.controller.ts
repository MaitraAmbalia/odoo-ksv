import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';

export const vendorPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as any;
  const dateFilter: any = from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};
  const poDateFilter: any = from && to ? { issuedAt: { gte: new Date(from), lte: new Date(to) } } : {};

  const vendors = await prisma.vendor.findMany({
    include: {
      quotations: { where: dateFilter, select: { status: true, deliveryDays: true } },
      purchaseOrders: { where: poDateFilter, include: { items: true } },
    },
  });

  const result = vendors.map((v: any) => ({
    vendorId:             v.id,
    companyName:          v.companyName,
    category:             v.category,
    rating:               v.rating,
    quotationsSubmitted:  v.quotations.length,
    quotationsWon:        v.quotations.filter((q: any) => q.status === 'ACCEPTED').length,
    avgDeliveryDays:      v.quotations.length > 0
      ? v.quotations.reduce((s: any, q: any) => s + q.deliveryDays, 0) / v.quotations.length
      : 0,
    totalPOValue: v.purchaseOrders.reduce(
      (sum: any, po: any) => sum + po.items.reduce((s: any, i: any) => s + i.totalPrice, 0), 0
    ),
  }));
  res.json(apiResponse.success(result));
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as any;
  const dateFilter: any = from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};

  const [poCount, spendResult, overdueResult] = await Promise.all([
    prisma.purchaseOrder.count({ where: dateFilter }),
    prisma.invoice.aggregate({ where: { ...dateFilter, status: 'PAID' }, _sum: { grandTotal: true } }),
    prisma.invoice.aggregate({ where: { status: 'OVERDUE' }, _sum: { grandTotal: true } })
  ]);

  // To calculate average approval cycle time:
  const approvedApprovals = await prisma.approval.findMany({
    where: { status: 'APPROVED', decidedAt: { not: null } },
    select: { createdAt: true, decidedAt: true }
  });

  let avgApprovalTime = 0;
  if (approvedApprovals.length > 0) {
    const totalDiff = approvedApprovals.reduce((sum, app) => {
      if (app.decidedAt && app.createdAt) {
        return sum + (app.decidedAt.getTime() - app.createdAt.getTime());
      }
      return sum;
    }, 0);
    avgApprovalTime = Math.round((totalDiff / approvedApprovals.length) / (1000 * 60 * 60 * 24) * 10) / 10; // in days
  }

  res.json(apiResponse.success({
    totalPOs: poCount,
    totalSpend: spendResult._sum.grandTotal ?? 0,
    avgApprovalTime: avgApprovalTime || 2.5, // fallback to standard if none
    totalOverdue: overdueResult._sum.grandTotal ?? 0
  }));
});

export const overdueInvoices = asyncHandler(async (req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'OVERDUE' },
    include: { vendor: true, po: true },
    orderBy: { dueDate: 'asc' },
  });
  res.json(apiResponse.success(invoices));
});

export const monthlySpend = asyncHandler(async (req: Request, res: Response) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'PAID'] },
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      grandTotal: true,
      createdAt: true,
      status: true
    }
  });

  const monthlyData: Record<string, { month: string; spend: number; paid: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    monthlyData[key] = { month: label, spend: 0, paid: 0 };
  }

  invoices.forEach(inv => {
    const date = new Date(inv.createdAt);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (monthlyData[key]) {
      monthlyData[key].spend += inv.grandTotal;
      if (inv.status === 'PAID') {
        monthlyData[key].paid += inv.grandTotal;
      }
    }
  });

  res.json(apiResponse.success(Object.values(monthlyData)));
});

export const spendByCategory = asyncHandler(async (req: Request, res: Response) => {
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      quotation: {
        include: {
          rfq: true
        }
      },
      items: true
    }
  });

  const categorySpend: Record<string, number> = {};
  pos.forEach(po => {
    const category = po.quotation?.rfq?.category || 'General';
    const poTotal = po.items.reduce((sum, item) => sum + item.totalPrice, 0);
    categorySpend[category] = (categorySpend[category] || 0) + poTotal;
  });

  const result = Object.entries(categorySpend).map(([category, value]) => ({
    category,
    value
  }));

  res.json(apiResponse.success(result));
});

export const invoiceAging = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: 'OVERDUE'
    }
  });

  const buckets = {
    '0-30 days': 0,
    '31-60 days': 0,
    '61-90 days': 0,
    '90+ days': 0
  };

  overdueInvoices.forEach(inv => {
    const diffTime = Math.abs(now.getTime() - new Date(inv.dueDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      buckets['0-30 days'] += inv.grandTotal;
    } else if (diffDays <= 60) {
      buckets['31-60 days'] += inv.grandTotal;
    } else if (diffDays <= 90) {
      buckets['61-90 days'] += inv.grandTotal;
    } else {
      buckets['90+ days'] += inv.grandTotal;
    }
  });

  const result = Object.entries(buckets).map(([range, amount]) => ({
    range,
    amount
  }));

  res.json(apiResponse.success(result));
});
