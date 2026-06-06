import { Router } from 'express';
import * as ctrl from '../controllers/comparison.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
// Mounted at /api/v1/rfqs — these extend the RFQ routes
router.get('/:rfqId/quotations',         authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.getQuotationsForRFQ);
router.post('/:rfqId/quotations',        authenticate, authorize('VENDOR'),                                ctrl.createQuotation);
router.get('/:rfqId/comparison',         authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.getComparison);
router.post('/:rfqId/comparison/select', authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'),           ctrl.selectQuotation);

export default router;
