import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/summary',             authenticate, authorize('ADMIN','MANAGER'), ctrl.getSummary);
router.get('/vendor-performance',  authenticate, authorize('ADMIN','MANAGER'), ctrl.vendorPerformance);
router.get('/overdue-invoices',    authenticate, authorize('ADMIN','MANAGER'), ctrl.overdueInvoices);
router.get('/monthly-spend',      authenticate, authorize('ADMIN','MANAGER'), ctrl.monthlySpend);
router.get('/spend-by-category',  authenticate, authorize('ADMIN','MANAGER'), ctrl.spendByCategory);
router.get('/invoice-aging',      authenticate, authorize('ADMIN','MANAGER'), ctrl.invoiceAging);

export default router;
