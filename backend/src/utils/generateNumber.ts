import prisma from '../config/db';

const year = () => new Date().getFullYear();
const pad  = (n: number) => String(n).padStart(4, '0');

export const generatePONumber = async (): Promise<string> => {
  const count = await prisma.purchaseOrder.count();
  return `PO-${year()}-${pad(count + 1)}`;
};

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.invoice.count();
  return `INV-${year()}-${pad(count + 1)}`;
};
