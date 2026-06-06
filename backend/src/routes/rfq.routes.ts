import { Router } from 'express';
import * as ctrl from '../controllers/rfq.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',                         authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.listRFQs);
router.post('/',                        authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.createRFQ);
router.get('/:id',                      authenticate,                                                     ctrl.getRFQ);
router.patch('/:id',                    authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.updateRFQ);
router.delete('/:id',                   authenticate, authorize('PROCUREMENT_OFFICER'),                   ctrl.deleteRFQ);
router.post('/:id/publish',             authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.publishRFQ);
router.post('/:id/close',              authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.closeRFQ);
router.post('/:id/cancel',             authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.cancelRFQ);
router.post('/:id/vendors',            authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.addVendors);
router.delete('/:id/vendors/:vendorId',authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           ctrl.removeVendor);

export default router;
