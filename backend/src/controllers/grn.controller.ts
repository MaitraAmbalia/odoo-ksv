import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as grnService from '../services/grn.service';
import { apiResponse } from '../utils/apiResponse';

export const createGRN = asyncHandler(async (req: Request, res: Response) => {
  const grn = await grnService.createGRN(req.body.poId);
  res.status(201).json(apiResponse.success(grn, 'GRN created'));
});

export const updateGRNItems = asyncHandler(async (req: Request, res: Response) => {
  const grn = await grnService.updateGRNItems((req.params.id as string), req.body.items);
  res.json(apiResponse.success(grn, 'GRN items updated'));
});

export const submitGRN = asyncHandler(async (req: Request, res: Response) => {
  await grnService.submitGRN((req.params.id as string), req.user.id);
  res.json(apiResponse.success(null, 'GRN submitted'));
});

export const getGRN = asyncHandler(async (req: Request, res: Response) => {
  const grn = await grnService.getGRN((req.params.id as string));
  res.json(apiResponse.success(grn));
});

export const listGRNs = asyncHandler(async (req: Request, res: Response) => {
  const grns = await grnService.listGRNs(req.query);
  res.json(apiResponse.success(grns));
});
