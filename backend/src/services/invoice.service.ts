import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';
import { calculateGST } from '../utils/calculateTax';
import { generateInvoiceNumber } from '../utils/generateNumber';
import { getPagination } from '../utils/pagination';
import * as pdfService from './pdf.service';
import * as emailService from './email.service';

export const generateInvoice = async (body: any, actorId: string) => {
  const { poId, dueDate, taxType, gstRate, notes } = body;
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: poId },
    include: { items: { include: { rfqItem: true } }, vendor: { include: { user: true } } },
  });
  if (po.status === 'CANCELLED') throw new AppError(400, 'Cannot invoice a cancelled PO');

  const actor = await prisma.user.findUniqueOrThrow({ where: { id: actorId } });
  if (actor.role === 'VENDOR') {
    if (po.vendor.userId !== actorId) {
      throw new AppError(403, 'You are not authorized to generate invoices for this Purchase Order');
    }
  }

  const subtotal = po.items.reduce((sum, i) => sum + i.totalPrice, 0);
  const tax = calculateGST(subtotal, gstRate ?? 18, taxType ?? 'GST_INTRA');
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber, poId, vendorId: po.vendorId,
      taxType: taxType ?? 'GST_INTRA',
      gstRate: gstRate ?? 18,
      subtotal,
      cgst:       tax.cgst,
      sgst:       tax.sgst,
      igst:       tax.igst,
      grandTotal: tax.grandTotal,
      dueDate:    new Date(dueDate),
      notes,
      items: {
        create: po.items.map(i => ({
          description: i.rfqItem.itemName,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          totalPrice:  i.totalPrice,
        })),
      },
    },
    include: { items: true },
  });

  await auditLog.write({ userId: actorId, entityType: 'INVOICE', entityId: invoice.id, action: Actions.INVOICE_GENERATED, meta: { invoiceNumber, grandTotal: tax.grandTotal } });
  return invoice;
};

export const sendInvoice = async (invoiceId: string, actorId: string) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { vendor: { include: { user: true } }, items: true },
  });
  if (!['DRAFT', 'OVERDUE'].includes(invoice.status)) throw new AppError(400, 'Invoice already sent or paid');

  const pdfBuffer = await pdfService.generateInvoicePDF(invoice);
  await emailService.sendInvoiceEmail({ to: invoice.vendor.user.email, invoice, pdfBuffer });

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'SENT', sentAt: new Date() } });
  await auditLog.write({ userId: actorId, entityType: 'INVOICE', entityId: invoiceId, action: Actions.INVOICE_SENT });
};

export const markPaid = async (invoiceId: string, actorId: string) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status === 'PAID') throw new AppError(400, 'Already paid');
  const updated = await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID', paidAt: new Date() } });
  await auditLog.write({ userId: actorId, entityType: 'INVOICE', entityId: invoiceId, action: Actions.INVOICE_PAID });
  return updated;
};

export const cancelInvoice = async (invoiceId: string, actorId: string) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status === 'PAID') throw new AppError(400, 'Cannot cancel a paid invoice');
  const updated = await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'CANCELLED' } });
  await auditLog.write({ userId: actorId, entityType: 'INVOICE', entityId: invoiceId, action: Actions.INVOICE_CANCELLED });
  return updated;
};

export const getInvoice = async (id: string, user: any) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id }, include: { items: true, vendor: true, po: true } });
  if (user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findFirst({ where: { userId: user.id } });
    if (!vendor || invoice.vendorId !== vendor.id) {
      throw new AppError(403, 'Access denied: You cannot view other vendors\' invoices');
    }
  }
  return invoice;
};

export const listInvoices = async (query: any, user: any) => {
  const { status, vendorId } = query;
  const { page, limit, skip } = getPagination(query);
  const where: any = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;
  if (user && user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    where.vendorId = vendor.id;
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, skip, take: limit, include: { vendor: true, po: true }, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.count({ where }),
  ]);
  return { invoices, total, page, limit };
};

export const getInvoicePDFBuffer = async (id: string, user: any) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id }, include: { items: true, vendor: true } });
  if (user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findFirst({ where: { userId: user.id } });
    if (!vendor || invoice.vendorId !== vendor.id) {
      throw new AppError(403, 'Access denied: You cannot view other vendors\' invoices');
    }
  }
  return { buffer: await pdfService.generateInvoicePDF(invoice), invoiceNumber: invoice.invoiceNumber };
};
