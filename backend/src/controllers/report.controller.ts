import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import prisma from '../config/db';
import { apiResponse } from '../utils/apiResponse';

export const vendorPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as any;
  const dateFilter = from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};
  const poDateFilter = from && to ? { issuedAt: { gte: new Date(from), lte: new Date(to) } } : {};

  const vendors = await prisma.vendor.findMany({
    include: {
      quotations: { where: dateFilter, select: { status: true, deliveryDays: true } },
      purchaseOrders: { where: poDateFilter, include: { items: true } },
    },
  });

  const result = vendors.map(v => ({
    vendorId:             v.id,
    companyName:          v.companyName,
    category:             v.category,
    rating:               v.rating,
    quotationsSubmitted:  v.quotations.length,
    quotationsWon:        v.quotations.filter((q: any) => q.status === 'ACCEPTED').length,
    avgDeliveryDays:      v.quotations.length > 0
      ? v.quotations.reduce((s: number, q: any) => s + q.deliveryDays, 0) / v.quotations.length
      : 0,
    totalPOValue: v.purchaseOrders.reduce(
      (sum: number, po: any) => sum + po.items.reduce((s: number, i: any) => s + i.totalPrice, 0), 0
    ),
  }));
  res.json(apiResponse.success(result));
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as any;
  const dateFilter = from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};
  const poDateFilter = from && to ? { issuedAt: { gte: new Date(from), lte: new Date(to) } } : {};

  const [poCount, spendResult] = await Promise.all([
    prisma.purchaseOrder.count({ where: poDateFilter }),
    prisma.invoice.aggregate({ where: { ...dateFilter, status: { in: ['SENT', 'PAID'] } }, _sum: { grandTotal: true } }),
  ]);
  res.json(apiResponse.success({ totalPOs: poCount, totalSpend: spendResult._sum.grandTotal ?? 0 }));
});

export const overdueInvoices = asyncHandler(async (req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'OVERDUE' },
    include: { vendor: true, po: true },
    orderBy: { dueDate: 'asc' },
  });
  res.json(apiResponse.success(invoices));
});
