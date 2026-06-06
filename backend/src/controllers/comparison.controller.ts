import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as comparisonService from '../services/comparison.service';
import { apiResponse } from '../utils/apiResponse';
import * as quotationCtrl from './quotation.controller';

export const getComparison = asyncHandler(async (req: Request, res: Response) => {
  const result = await comparisonService.getComparison((req.params.rfqId as string));
  res.json(apiResponse.success(result));
});

export const selectQuotation = asyncHandler(async (req: Request, res: Response) => {
  await comparisonService.selectQuotation((req.params.rfqId as string), req.body.quotationId, req.user.id);
  res.json(apiResponse.success(null, 'Quotation selected, approval created'));
});

// Re-export quotation creation for RFQ-scoped route
export const createQuotation = quotationCtrl.createQuotation;
export const getQuotationsForRFQ = quotationCtrl.getQuotationsForRFQ;
