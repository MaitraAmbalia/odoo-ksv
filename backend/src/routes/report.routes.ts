import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/summary',             authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.getSummary);
router.get('/vendor-performance',  authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.vendorPerformance);
router.get('/overdue-invoices',    authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.overdueInvoices);
router.get('/monthly-spend',      authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.monthlySpend);
router.get('/spend-by-category',  authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.spendByCategory);
router.get('/invoice-aging',      authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.invoiceAging);

export default router;
