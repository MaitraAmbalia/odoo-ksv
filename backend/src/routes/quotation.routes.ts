import { Router } from 'express';
import * as ctrl from '../controllers/quotation.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',               authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'),         ctrl.listAllQuotations);
router.get('/mine',            authenticate, authorize('VENDOR'),                                       ctrl.getMyQuotations);
router.get('/:id',             authenticate,                                                             ctrl.getQuotation);
router.post('/:id/submit',    authenticate, authorize('VENDOR'),                                       ctrl.submitQuotation);
router.post('/:id/withdraw',  authenticate, authorize('VENDOR'),                                       ctrl.withdrawQuotation);

export default router;
