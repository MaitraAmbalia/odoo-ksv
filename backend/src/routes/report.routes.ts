import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/summary',             authenticate, authorize('ADMIN','MANAGER'),                       ctrl.getSummary);
router.get('/vendor-performance',  authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.vendorPerformance);
router.get('/overdue-invoices',    authenticate, authorize('ADMIN','MANAGER'),                       ctrl.overdueInvoices);

export default router;
