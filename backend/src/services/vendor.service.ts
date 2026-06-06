import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';
import { getPagination } from '../utils/pagination';

export const listVendors = async (query: any) => {
  const { status, category, search } = query;
  const { page, limit, skip } = getPagination(query);

  const where: any = {};
  if (status)   where.status   = status;
  if (category) where.category = category;
  if (search)   where.OR = [
    { companyName: { contains: search, mode: 'insensitive' } },
    { gstNumber:   { contains: search, mode: 'insensitive' } },
  ];

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where, skip, take: limit,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendor.count({ where }),
  ]);
  return { vendors, total, page, limit };
};

export const createVendor = async (body: any, actorId: string) => {
  const vendor = await prisma.vendor.create({ data: body });
  await auditLog.write({ userId: actorId, entityType: 'VENDOR', entityId: vendor.id, action: Actions.VENDOR_REGISTERED });
  return vendor;
};

export const getVendor = async (id: string, user: any) => {
  const vendor = await prisma.vendor.findUniqueOrThrow({
    where: { id },
    include: { user: { select: { email: true, firstName: true, lastName: true, phone: true } } },
  });
  if (user.role === 'VENDOR') {
    if (vendor.userId !== user.id) {
      throw new AppError(403, 'Access denied: You cannot view other vendor profiles');
    }
  }
  return vendor;
};

export const updateVendor = async (id: string, body: any) => {
  return prisma.vendor.update({ where: { id }, data: body });
};

export const changeStatus = async (id: string, status: string, actorId: string) => {
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.vendor.update({ where: { id }, data: { status: status as any } });
  await auditLog.write({ userId: actorId, entityType: 'VENDOR', entityId: id, action: Actions.VENDOR_STATUS_CHANGED, meta: { from: vendor.status, to: status } });
  return updated;
};
