import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';

export const createGRN = async (poId: string) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { items: true } });
  if (po.status === 'CANCELLED') throw new AppError(400, 'Cannot create GRN for a cancelled PO');

  return prisma.gRN.create({
    data: {
      poId,
      items: {
        create: po.items.map(item => ({
          poItemId:    item.id,
          qtyOrdered:  item.quantity,
          qtyReceived: 0,
        })),
      },
    },
    include: { items: true },
  });
};

export const updateGRNItems = async (grnId: string, items: { id: string; qtyReceived: number }[]) => {
  await Promise.all(items.map(item =>
    prisma.gRNItem.update({ where: { id: item.id }, data: { qtyReceived: item.qtyReceived } })
  ));
  return prisma.gRN.findUniqueOrThrow({ where: { id: grnId }, include: { items: true } });
};

export const submitGRN = async (grnId: string, actorId: string) => {
  const grn = await prisma.gRN.findUniqueOrThrow({
    where: { id: grnId },
    include: { items: true, po: { include: { items: true } } },
  });

  await prisma.gRN.update({ where: { id: grnId }, data: { status: 'SUBMITTED' } });

  const allReceived = grn.items.every(item => item.qtyReceived >= item.qtyOrdered);
  const poStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

  await prisma.purchaseOrder.update({
    where: { id: grn.poId },
    data: { status: poStatus as any },
  });
  await auditLog.write({ userId: actorId, entityType: 'GRN', entityId: grnId, action: Actions.GRN_SUBMITTED, meta: { poStatus } });
};

export const getGRN = async (id: string) => {
  return prisma.gRN.findUniqueOrThrow({ where: { id }, include: { items: { include: { poItem: { include: { rfqItem: true } } } }, po: true } });
};

export const listGRNs = async (query: any) => {
  const { poId } = query;
  const where: any = {};
  if (poId) where.poId = poId;
  return prisma.gRN.findMany({ where, include: { po: true, items: true }, orderBy: { createdAt: 'desc' } });
};
