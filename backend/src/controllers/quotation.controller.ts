import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as quotationService from '../services/quotation.service';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../middlewares/errorHandler';

export const createQuotation = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await (await import('../config/db')).default.vendor.findUnique({ where: { userId: req.user.id } });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  const quotation = await quotationService.createQuotation((req.params.rfqId as string), req.body, vendor.id);
  res.status(201).json(apiResponse.success(quotation, 'Quotation saved'));
});

export const submitQuotation = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await (await import('../config/db')).default.vendor.findUnique({ where: { userId: req.user.id } });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  const result = await quotationService.submitQuotation((req.params.id as string), vendor.id);
  res.json(apiResponse.success(result, 'Quotation submitted'));
});

export const withdrawQuotation = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await (await import('../config/db')).default.vendor.findUnique({ where: { userId: req.user.id } });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  const result = await quotationService.withdrawQuotation((req.params.id as string), vendor.id);
  res.json(apiResponse.success(result, 'Quotation withdrawn'));
});

export const getQuotation = asyncHandler(async (req: Request, res: Response) => {
  const quotation = await quotationService.getQuotation((req.params.id as string));
  res.json(apiResponse.success(quotation));
});

export const getMyQuotations = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await (await import('../config/db')).default.vendor.findUnique({ where: { userId: req.user.id } });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  const quotations = await quotationService.getMyQuotations(vendor.id);
  res.json(apiResponse.success(quotations));
});

export const getQuotationsForRFQ = asyncHandler(async (req: Request, res: Response) => {
  const quotations = await quotationService.getQuotationsForRFQ((req.params.rfqId as string));
  res.json(apiResponse.success(quotations));
});

export const listAllQuotations = asyncHandler(async (req: Request, res: Response) => {
  const quotations = await quotationService.listAllQuotations();
  res.json(apiResponse.success(quotations));
});
