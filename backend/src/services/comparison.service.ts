import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';

export const getComparison = async (rfqId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({
    where: { id: rfqId },
    include: {
      items: true,
      quotations: {
        where: { status: 'SUBMITTED' },
        include: { vendor: true, items: { include: { rfqItem: true } } },
      },
    },
  });

  const quotes = rfq.quotations;
  if (quotes.length === 0) return { rfq: { id: rfq.id, title: rfq.title, items: rfq.items }, quotations: [] };

  const minTotal    = Math.min(...quotes.map(q => q.grandTotal));
  const minDelivery = Math.min(...quotes.map(q => q.deliveryDays));

  return {
    rfq: { id: rfq.id, title: rfq.title, items: rfq.items },
    quotations: quotes.map(q => ({
      quotationId:       q.id,
      vendorId:          q.vendorId,
      vendorName:        q.vendor.companyName,
      vendorRating:      q.vendor.rating,
      grandTotal:        q.grandTotal,
      subtotal:          q.subtotal,
      gstRate:           q.gstRate,
      taxType:           q.taxType,
      deliveryDays:      q.deliveryDays,
      paymentTerms:      q.paymentTerms,
      notes:             q.notes,
      items:             q.items.map(i => ({ rfqItemId: i.rfqItemId, itemName: i.rfqItem.itemName, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
      isLowestPrice:     q.grandTotal   === minTotal,
      isFastestDelivery: q.deliveryDays === minDelivery,
    })),
  };
};

export const selectQuotation = async (rfqId: string, quotationId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId }, include: { quotations: true } });

  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({ where: { id: quotationId }, data: { status: 'ACCEPTED' } });
    await tx.quotation.updateMany({
      where: { rfqId, id: { not: quotationId }, status: 'SUBMITTED' },
      data: { status: 'REJECTED' },
    });
    await tx.approval.create({ data: { rfqId, quotationId, status: 'PENDING' } });
    await tx.rFQ.update({ where: { id: rfqId }, data: { status: 'CLOSED' } });
  });

  const managers = await prisma.user.findMany({ where: { role: 'MANAGER', isActive: true } });
  await Promise.all(managers.map(m =>
    prisma.notification.create({
      data: { userId: m.id, type: 'APPROVAL_NEEDED', title: 'Approval Required', body: `A quotation has been selected for RFQ: ${rfq.title}`, entityType: 'RFQ', entityId: rfqId },
    })
  ));
  await auditLog.write({ userId: actorId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_SELECTED, meta: { rfqId } });
};
