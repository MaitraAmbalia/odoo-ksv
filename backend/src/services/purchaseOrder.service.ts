import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { getPagination } from '../utils/pagination';
import { auditLog, Actions } from '../utils/auditLog';

export const listPOs = async (query: any, user: any) => {
  const { status, vendorId } = query;
  const { page, limit, skip } = getPagination(query);
  const where: any = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;
  if (user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    where.vendorId = vendor.id;
  }

  const [pos, total] = await Promise.all([
    prisma.purchaseOrder.findMany({ where, skip, take: limit, include: { vendor: true, quotation: { include: { rfq: true } }, items: { include: { rfqItem: true } } }, orderBy: { issuedAt: 'desc' } }),
    prisma.purchaseOrder.count({ where }),
  ]);
  return { pos, total, page, limit };
};

export const getPO = async (id: string, user: any) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { vendor: true, quotation: true, items: { include: { rfqItem: true } }, approval: true } });
  if (user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findFirst({ where: { userId: user.id } });
    if (!vendor || po.vendorId !== vendor.id) {
      throw new AppError(403, 'Access denied: You cannot view other vendors\' purchase orders');
    }
  }
  return po;
};

export const cancelPO = async (id: string, actorId: string) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status === 'CANCELLED') throw new AppError(400, 'PO already cancelled');
  const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  await auditLog.write({ userId: actorId, entityType: 'PO', entityId: id, action: Actions.PO_CANCELLED });
  return updated;
};
