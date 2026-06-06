import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';
import { calculateGST } from '../utils/calculateTax';
import { getPagination } from '../utils/pagination';

export const listAllQuotations = async (query: any) => {
  const { status, search } = query;
  const { page, limit, skip } = getPagination(query);

  const where: any = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
    { rfq: { title: { contains: search, mode: 'insensitive' } } },
  ];

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where, skip, take: limit,
      include: {
        vendor: { select: { companyName: true } },
        rfq: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quotation.count({ where }),
  ]);
  return { quotations, total, page, limit };
};

export const createQuotation = async (rfqId: string, body: any, vendorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId }, include: { items: true } });
  if (rfq.status !== 'PUBLISHED') throw new AppError(400, 'RFQ is not accepting quotations');

  const invite = await prisma.rFQVendorInvite.findUnique({ where: { rfqId_vendorId: { rfqId, vendorId } } });
  if (!invite) throw new AppError(403, 'Not invited to this RFQ');

  const subtotal = body.items.reduce((sum: number, item: any) => {
    const rfqItem = rfq.items.find(i => i.id === item.rfqItemId);
    if (!rfqItem) throw new AppError(400, `RFQ item ${item.rfqItemId} not found`);
    return sum + item.unitPrice * rfqItem.quantity;
  }, 0);
  const tax = calculateGST(subtotal, body.gstRate, body.taxType);

  const quotation = await prisma.quotation.upsert({
    where: { rfqId_vendorId: { rfqId, vendorId } },
    create: {
      rfqId, vendorId, ...body,
      subtotal, gstAmount: tax.gstAmount, grandTotal: tax.grandTotal,
      items: {
        create: body.items.map((item: any) => {
          const rfqItem = rfq.items.find(i => i.id === item.rfqItemId)!;
          return { rfqItemId: item.rfqItemId, unitPrice: item.unitPrice, totalPrice: item.unitPrice * rfqItem.quantity };
        }),
      },
    },
    update: {
      ...body, subtotal, gstAmount: tax.gstAmount, grandTotal: tax.grandTotal, status: 'DRAFT',
      items: {
        deleteMany: {},
        create: body.items.map((item: any) => {
          const rfqItem = rfq.items.find(i => i.id === item.rfqItemId)!;
          return { rfqItemId: item.rfqItemId, unitPrice: item.unitPrice, totalPrice: item.unitPrice * rfqItem.quantity };
        }),
      },
    },
    include: { items: true },
  });
  return quotation;
};

export const submitQuotation = async (quotationId: string, vendorId: string) => {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id: quotationId } });
  if (q.vendorId !== vendorId) throw new AppError(403, 'Not your quotation');
  if (q.status !== 'DRAFT') throw new AppError(400, 'Only DRAFT quotations can be submitted');

  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
  await prisma.rFQVendorInvite.update({
    where: { rfqId_vendorId: { rfqId: q.rfqId, vendorId } },
    data: { status: 'SUBMITTED' },
  });
  await auditLog.write({ userId: vendor.userId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_SUBMITTED });
  return updated;
};

export const withdrawQuotation = async (quotationId: string, vendorId: string) => {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id: quotationId } });
  if (q.vendorId !== vendorId) throw new AppError(403, 'Not your quotation');
  if (q.status !== 'SUBMITTED') throw new AppError(400, 'Only SUBMITTED quotations can be withdrawn');

  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });

  const updated = await prisma.quotation.update({ where: { id: quotationId }, data: { status: 'WITHDRAWN' } });
  await auditLog.write({ userId: vendor.userId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_WITHDRAWN });
  return updated;
};

export const getQuotation = async (id: string, user: any) => {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id }, include: { items: { include: { rfqItem: true } }, vendor: true } });
  if (user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findFirst({ where: { userId: user.id } });
    if (!vendor || q.vendorId !== vendor.id) {
      throw new AppError(403, 'Access denied: You cannot view other vendors\' quotations');
    }
  }
  return q;
};

export const getMyQuotations = async (vendorId: string) => {
  return prisma.quotation.findMany({ where: { vendorId }, include: { rfq: true, items: true }, orderBy: { createdAt: 'desc' } });
};

export const getQuotationsForRFQ = async (rfqId: string) => {
  return prisma.quotation.findMany({ where: { rfqId }, include: { vendor: true, items: { include: { rfqItem: true } } }, orderBy: { createdAt: 'desc' } });
};


