import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';
import { calculateGST } from '../utils/calculateTax';

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

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
  await prisma.rFQVendorInvite.update({
    where: { rfqId_vendorId: { rfqId: q.rfqId, vendorId } },
    data: { status: 'SUBMITTED' },
  });
  await auditLog.write({ userId: vendorId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_SUBMITTED });
  return updated;
};

export const withdrawQuotation = async (quotationId: string, vendorId: string) => {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id: quotationId } });
  if (q.vendorId !== vendorId) throw new AppError(403, 'Not your quotation');
  if (q.status !== 'SUBMITTED') throw new AppError(400, 'Only SUBMITTED quotations can be withdrawn');
  const updated = await prisma.quotation.update({ where: { id: quotationId }, data: { status: 'WITHDRAWN' } });
  await auditLog.write({ userId: vendorId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_WITHDRAWN });
  return updated;
};

export const getQuotation = async (id: string) => {
  return prisma.quotation.findUniqueOrThrow({ where: { id }, include: { items: { include: { rfqItem: true } }, vendor: true } });
};

export const getMyQuotations = async (vendorId: string) => {
  return prisma.quotation.findMany({ where: { vendorId }, include: { rfq: true, items: true }, orderBy: { createdAt: 'desc' } });
};

export const getQuotationsForRFQ = async (rfqId: string) => {
  return prisma.quotation.findMany({ where: { rfqId }, include: { vendor: true, items: { include: { rfqItem: true } } }, orderBy: { createdAt: 'desc' } });
};
