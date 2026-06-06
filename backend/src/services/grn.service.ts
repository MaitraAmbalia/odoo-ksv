import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';

export const createGRN = async (poId: string) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { items: true } });
  if (po.status === 'CANCELLED') throw new AppError(400, 'Cannot create GRN for a cancelled PO');

  const existingGrns = await prisma.gRN.findMany({
    where: { poId, status: { in: ['SUBMITTED', 'VERIFIED'] } },
    include: { items: true }
  });

  const receivedTotals: Record<string, number> = {};
  for (const g of existingGrns) {
    for (const item of g.items) {
      receivedTotals[item.poItemId] = (receivedTotals[item.poItemId] || 0) + item.qtyReceived;
    }
  }

  const allFullyReceived = po.items.every(item => (receivedTotals[item.id] || 0) >= item.quantity);
  if (allFullyReceived) {
    throw new AppError(400, 'All items in this PO have already been fully received');
  }

  return prisma.gRN.create({
    data: {
      poId,
      items: {
        create: po.items.map(item => {
          const qtyReceivedSoFar = receivedTotals[item.id] || 0;
          const remainingQty = Math.max(0, item.quantity - qtyReceivedSoFar);
          return {
            poItemId:    item.id,
            qtyOrdered:  remainingQty,
            qtyReceived: 0,
          };
        }),
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

  if (grn.status !== 'DRAFT') throw new AppError(400, 'GRN is already submitted or verified');

  await prisma.gRN.update({ where: { id: grnId }, data: { status: 'SUBMITTED', receivedAt: new Date() } });

  const allPoGrns = await prisma.gRN.findMany({
    where: { poId: grn.poId, status: { in: ['SUBMITTED', 'VERIFIED'] } },
    include: { items: true }
  });

  const receivedTotals: Record<string, number> = {};
  for (const g of allPoGrns) {
    for (const item of g.items) {
      receivedTotals[item.poItemId] = (receivedTotals[item.poItemId] || 0) + item.qtyReceived;
    }
  }

  let allReceived = true;
  let anyReceived = false;

  for (const poItem of grn.po.items) {
    const totalRec = receivedTotals[poItem.id] || 0;
    if (totalRec < poItem.quantity) {
      allReceived = false;
    }
    if (totalRec > 0) {
      anyReceived = true;
    }
  }

  const poStatus = allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIALLY_RECEIVED' : 'ISSUED');

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
