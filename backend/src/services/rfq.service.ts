import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';
import { getPagination } from '../utils/pagination';

export const listRFQs = async (query: any) => {
  const { status, search } = query;
  const { page, limit, skip } = getPagination(query);
  const where: any = {};
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const [rfqs, total] = await Promise.all([
    prisma.rFQ.findMany({ where, skip, take: limit, include: { items: true, vendorInvites: true, createdBy: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.rFQ.count({ where }),
  ]);
  return { rfqs, total, page, limit };
};

export const createRFQ = async (body: any, actorId: string) => {
  const { items, vendorIds, ...rfqData } = body;
  const rfq = await prisma.rFQ.create({
    data: {
      ...rfqData,
      createdById: actorId,
      deadline: new Date(rfqData.deadline),
      items: { create: items },
      vendorInvites: vendorIds?.length
        ? { create: vendorIds.map((vendorId: string) => ({ vendorId })) }
        : undefined,
    },
    include: { items: true, vendorInvites: true },
  });
  await auditLog.write({ userId: actorId, entityType: 'RFQ', entityId: rfq.id, action: Actions.RFQ_CREATED });
  return rfq;
};

export const getRFQ = async (rfqId: string) => {
  return prisma.rFQ.findUniqueOrThrow({
    where: { id: rfqId },
    include: { items: true, vendorInvites: { include: { vendor: true } }, quotations: true, createdBy: { select: { firstName: true, lastName: true, email: true } } },
  });
};

export const updateRFQ = async (rfqId: string, body: any) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId } });
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Only DRAFT RFQs can be updated');
  return prisma.rFQ.update({ where: { id: rfqId }, data: body });
};

export const deleteRFQ = async (rfqId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId } });
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Only DRAFT RFQs can be deleted');
  return prisma.rFQ.delete({ where: { id: rfqId } });
};

export const publishRFQ = async (rfqId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({
    where: { id: rfqId },
    include: { vendorInvites: { include: { vendor: { include: { user: true } } } } },
  });
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Only DRAFT RFQs can be published');
  if (rfq.vendorInvites.length === 0) throw new AppError(400, 'Assign at least one vendor before publishing');

  const updated = await prisma.rFQ.update({ where: { id: rfqId }, data: { status: 'PUBLISHED' } });

  // Notify each invited vendor
  await Promise.all(
    rfq.vendorInvites.map(invite =>
      prisma.notification.create({
        data: {
          userId:     invite.vendor.userId,
          type:       'RFQ_INVITE',
          title:      'New RFQ Invitation',
          body:       `You have been invited to submit a quotation for: ${rfq.title}`,
          entityType: 'RFQ',
          entityId:   rfqId,
        },
      })
    )
  );
  await auditLog.write({ userId: actorId, entityType: 'RFQ', entityId: rfqId, action: Actions.RFQ_PUBLISHED, meta: { vendorCount: rfq.vendorInvites.length } });
  return updated;
};

export const closeRFQ = async (rfqId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId } });
  if (rfq.status !== 'PUBLISHED') throw new AppError(400, 'Only PUBLISHED RFQs can be closed');
  const updated = await prisma.rFQ.update({ where: { id: rfqId }, data: { status: 'CLOSED' } });
  await auditLog.write({ userId: actorId, entityType: 'RFQ', entityId: rfqId, action: Actions.RFQ_CLOSED });
  return updated;
};

export const cancelRFQ = async (rfqId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId } });
  if (rfq.status === 'CLOSED' || rfq.status === 'CANCELLED') throw new AppError(400, 'RFQ is already closed or cancelled');
  const updated = await prisma.rFQ.update({ where: { id: rfqId }, data: { status: 'CANCELLED' } });
  await auditLog.write({ userId: actorId, entityType: 'RFQ', entityId: rfqId, action: Actions.RFQ_CANCELLED });
  return updated;
};

export const addVendors = async (rfqId: string, vendorIds: string[], actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId } });
  if (rfq.status !== 'DRAFT' && rfq.status !== 'PUBLISHED') throw new AppError(400, 'Cannot add vendors to this RFQ');
  await prisma.rFQVendorInvite.createMany({
    data: vendorIds.map(vendorId => ({ rfqId, vendorId })),
    skipDuplicates: true,
  });
  return prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId }, include: { vendorInvites: true } });
};

export const removeVendor = async (rfqId: string, vendorId: string) => {
  await prisma.rFQVendorInvite.delete({ where: { rfqId_vendorId: { rfqId, vendorId } } });
};
