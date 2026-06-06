import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as vendorService from '../services/vendor.service';
import { apiResponse } from '../utils/apiResponse';

export const listVendors = asyncHandler(async (req: Request, res: Response) => {
  const result = await vendorService.listVendors(req.query);
  res.json(apiResponse.paginated(result.vendors, { page: result.page, limit: result.limit, total: result.total }));
});

export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.createVendor(req.body, req.user.id);
  res.status(201).json(apiResponse.success(vendor, 'Vendor created'));
});

export const getVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.getVendor((req.params.id as string));
  res.json(apiResponse.success(vendor));
});

export const updateVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.updateVendor((req.params.id as string), req.body);
  res.json(apiResponse.success(vendor, 'Vendor updated'));
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.changeStatus((req.params.id as string), req.body.status, req.user.id);
  res.json(apiResponse.success(vendor, 'Status updated'));
});
