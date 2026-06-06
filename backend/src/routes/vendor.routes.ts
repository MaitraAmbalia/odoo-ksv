import { Router } from 'express';
import * as ctrl from '../controllers/vendor.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',             authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), ctrl.listVendors);
router.post('/',            authenticate, authorize('ADMIN'),                        ctrl.createVendor);
router.get('/:id',          authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'), ctrl.getVendor);
router.patch('/:id',        authenticate, authorize('ADMIN'),                        ctrl.updateVendor);
router.patch('/:id/status', authenticate, authorize('ADMIN'),                        ctrl.changeStatus);

export default router;
