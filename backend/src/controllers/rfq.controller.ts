import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as rfqService from '../services/rfq.service';
import { apiResponse } from '../utils/apiResponse';

export const listRFQs = asyncHandler(async (req: Request, res: Response) => {
  const result = await rfqService.listRFQs(req.query);
  res.json(apiResponse.paginated(result.rfqs, { page: result.page, limit: result.limit, total: result.total }));
});

export const listInvitedRFQs = asyncHandler(async (req: Request, res: Response) => {
  const result = await rfqService.listInvitedRFQs(req.user.id, req.query);
  res.json(apiResponse.paginated(result.rfqs, { page: result.page, limit: result.limit, total: result.total }));
});

export const createRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.createRFQ(req.body, req.user.id);
  res.status(201).json(apiResponse.success(rfq, 'RFQ created'));
});

export const getRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.getRFQ(req.params.id);
  res.json(apiResponse.success(rfq));
});

export const updateRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.updateRFQ(req.params.id, req.body);
  res.json(apiResponse.success(rfq, 'RFQ updated'));
});

export const deleteRFQ = asyncHandler(async (req: Request, res: Response) => {
  await rfqService.deleteRFQ(req.params.id);
  res.json(apiResponse.success(null, 'RFQ deleted'));
});

export const publishRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.publishRFQ(req.params.id, req.user.id);
  res.json(apiResponse.success(rfq, 'RFQ published'));
});

export const closeRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.closeRFQ(req.params.id, req.user.id);
  res.json(apiResponse.success(rfq, 'RFQ closed'));
});

export const cancelRFQ = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.cancelRFQ(req.params.id, req.user.id);
  res.json(apiResponse.success(rfq, 'RFQ cancelled'));
});

export const addVendors = asyncHandler(async (req: Request, res: Response) => {
  const rfq = await rfqService.addVendors(req.params.id, req.body.vendorIds, req.user.id);
  res.json(apiResponse.success(rfq, 'Vendors added'));
});

export const removeVendor = asyncHandler(async (req: Request, res: Response) => {
  await rfqService.removeVendor(req.params.id, req.params.vendorId);
  res.json(apiResponse.success(null, 'Vendor removed'));
});
