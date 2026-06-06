import { Router } from 'express';
import * as ctrl from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',               authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.listInvoices);
router.post('/',              authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.generateInvoice);
router.get('/:id',            authenticate,                                                     ctrl.getInvoice);
router.post('/:id/send',     authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.sendInvoice);
router.post('/:id/mark-paid',authenticate, authorize('ADMIN','MANAGER'),                       ctrl.markPaid);
router.get('/:id/pdf',        authenticate,                                                     ctrl.downloadPDF);
router.post('/:id/cancel',   authenticate, authorize('ADMIN'),                                 ctrl.cancelInvoice);

export default router;
