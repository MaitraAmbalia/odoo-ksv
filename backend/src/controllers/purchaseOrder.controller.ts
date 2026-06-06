import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as poService from '../services/purchaseOrder.service';
import { apiResponse } from '../utils/apiResponse';

export const listPOs = asyncHandler(async (req: Request, res: Response) => {
  const result = await poService.listPOs(req.query, req.user);
  res.json(apiResponse.paginated(result.pos, { page: result.page, limit: result.limit, total: result.total }));
});

export const getPO = asyncHandler(async (req: Request, res: Response) => {
  const po = await poService.getPO((req.params.id as string));
  res.json(apiResponse.success(po));
});

export const cancelPO = asyncHandler(async (req: Request, res: Response) => {
  const po = await poService.cancelPO((req.params.id as string), req.user.id);
  res.json(apiResponse.success(po, 'PO cancelled'));
});
