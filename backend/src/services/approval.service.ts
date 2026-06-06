import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';
import { generatePONumber } from '../utils/generateNumber';
import { getPagination } from '../utils/pagination';

export const listApprovals = async (query: any) => {
  const { status } = query;
  const { page, limit, skip } = getPagination(query);
  const where: any = {};
  if (status) where.status = status;

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({ where, skip, take: limit, include: { rfq: true, quotation: { include: { vendor: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.approval.count({ where }),
  ]);
  return { approvals, total, page, limit };
};

export const getApproval = async (id: string) => {
  return prisma.approval.findUniqueOrThrow({
    where: { id },
    include: { rfq: { include: { items: true } }, quotation: { include: { vendor: true, items: { include: { rfqItem: true } } } } },
  });
};

export const getPendingApprovals = async () => {
  return prisma.approval.findMany({ where: { status: 'PENDING' }, include: { rfq: true, quotation: { include: { vendor: true } } }, orderBy: { createdAt: 'desc' } });
};
export const approveQuotation = async (approvalId: string, remarks: string, approverId: string) => {
  const approval = await prisma.approval.findUniqueOrThrow({
    where: { id: approvalId },
    include: { quotation: { include: { items: { include: { rfqItem: true } } } }, rfq: true },
  });
  if (approval.status !== 'PENDING') throw new AppError(400, 'Approval already decided');

  const poNumber = await generatePONumber();

  await prisma.$transaction(async (tx) => {
    await tx.approval.update({
      where: { id: approvalId },
      data: { status: 'APPROVED', approverId, remarks, decidedAt: new Date() },
    });

    // Set selected quotation status to ACCEPTED
    await tx.quotation.update({
      where: { id: approval.quotationId },
      data: { status: 'ACCEPTED' }
    });

    // Set other quotations for this RFQ to REJECTED
    await tx.quotation.updateMany({
      where: { rfqId: approval.rfqId, id: { not: approval.quotationId }, status: 'SUBMITTED' },
      data: { status: 'REJECTED' },
    });

    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        approvalId,
        quotationId: approval.quotationId,
        vendorId:    approval.quotation.vendorId,
        status:      'ISSUED',
        items: {
          create: approval.quotation.items.map(qi => ({
            rfqItemId:       qi.rfqItemId,
            quotationItemId: qi.id,
            quantity:        qi.rfqItem.quantity,
            unitPrice:       qi.unitPrice,
            totalPrice:      qi.totalPrice,
          })),
        },
      },
    });

    const [officer, vendor] = await Promise.all([
      tx.user.findUnique({ where: { id: approval.rfq.createdById } }),
      tx.vendor.findUnique({ where: { id: approval.quotation.vendorId }, include: { user: true } }),
    ]);
    await Promise.all([
      officer && tx.notification.create({ data: { userId: officer.id, type: 'APPROVAL_DECIDED', title: 'Quotation Approved', body: `PO ${poNumber} has been generated.`, entityType: 'PO', entityId: po.id } }),
      vendor  && tx.notification.create({ data: { userId: vendor.user.id, type: 'PO_ISSUED', title: 'Purchase Order Issued', body: `PO ${poNumber} has been issued to your company.`, entityType: 'PO', entityId: po.id } }),
    ]);
  });

  await auditLog.write({ userId: approverId, entityType: 'APPROVAL', entityId: approvalId, action: Actions.APPROVAL_APPROVED, meta: { poNumber, remarks } });
};

export const rejectQuotation = async (approvalId: string, remarks: string, approverId: string) => {
  const approval = await prisma.approval.findUniqueOrThrow({ where: { id: approvalId }, include: { rfq: true } });
  if (approval.status !== 'PENDING') throw new AppError(400, 'Approval already decided');
  if (!remarks) throw new AppError(400, 'Remarks are required when rejecting');

  await prisma.$transaction(async (tx) => {
    await tx.approval.update({
      where: { id: approvalId },
      data: { status: 'REJECTED', approverId, remarks, decidedAt: new Date() },
    });

    // Set the selected quotation to REJECTED so it can't be chosen again
    await tx.quotation.update({
      where: { id: approval.quotationId },
      data: { status: 'REJECTED' }
    });

    // Revert RFQ status back to PUBLISHED so officer can select another quote
    await tx.rFQ.update({
      where: { id: approval.rfqId },
      data: { status: 'PUBLISHED' }
    });
  });

  const officer = await prisma.user.findUnique({ where: { id: approval.rfq.createdById } });
  if (officer) {
    await prisma.notification.create({ data: { userId: officer.id, type: 'APPROVAL_DECIDED', title: 'Quotation Rejected', body: `Rejection reason: ${remarks}`, entityType: 'RFQ', entityId: approval.rfqId } });
  }
  await auditLog.write({ userId: approverId, entityType: 'APPROVAL', entityId: approvalId, action: Actions.APPROVAL_REJECTED, meta: { remarks } });
};
