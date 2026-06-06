import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as invoiceService from '../services/invoice.service';
import { apiResponse } from '../utils/apiResponse';

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const result = await invoiceService.listInvoices(req.query, req.user);
  res.json(apiResponse.paginated(result.invoices, { page: result.page, limit: result.limit, total: result.total }));
});

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.generateInvoice(req.body, req.user.id);
  res.status(201).json(apiResponse.success(invoice, 'Invoice generated'));
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoice((req.params.id as string), req.user);
  res.json(apiResponse.success(invoice));
});

export const sendInvoice = asyncHandler(async (req: Request, res: Response) => {
  await invoiceService.sendInvoice((req.params.id as string), req.user.id);
  res.json(apiResponse.success(null, 'Invoice sent'));
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.markPaid((req.params.id as string), req.user.id);
  res.json(apiResponse.success(invoice, 'Invoice marked as paid'));
});

export const downloadPDF = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, invoiceNumber } = await invoiceService.getInvoicePDFBuffer((req.params.id as string), req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoiceNumber}.pdf"`);
  res.send(buffer);
});

export const cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.cancelInvoice((req.params.id as string), req.user.id);
  res.json(apiResponse.success(invoice, 'Invoice cancelled'));
});
