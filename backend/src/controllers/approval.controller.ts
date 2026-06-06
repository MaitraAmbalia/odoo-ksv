import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as approvalService from '../services/approval.service';
import { apiResponse } from '../utils/apiResponse';

export const listApprovals = asyncHandler(async (req: Request, res: Response) => {
  const result = await approvalService.listApprovals(req.query);
  res.json(apiResponse.paginated(result.approvals, { page: result.page, limit: result.limit, total: result.total }));
});

export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  const approvals = await approvalService.getPendingApprovals();
  res.json(apiResponse.success(approvals));
});

export const getApproval = asyncHandler(async (req: Request, res: Response) => {
  const approval = await approvalService.getApproval(req.params.id);
  res.json(apiResponse.success(approval));
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  await approvalService.approveQuotation(req.params.id, req.body.remarks || '', req.user.id);
  res.json(apiResponse.success(null, 'Approved — Purchase Order generated'));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  await approvalService.rejectQuotation(req.params.id, req.body.remarks, req.user.id);
  res.json(apiResponse.success(null, 'Rejected'));
});
