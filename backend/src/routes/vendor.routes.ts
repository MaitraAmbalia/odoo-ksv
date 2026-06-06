import { Router } from 'express';
import * as ctrl from '../controllers/vendor.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',             authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), ctrl.listVendors);
router.post('/',            authenticate, authorize('ADMIN'),                        ctrl.createVendor);
router.get('/:id',          authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'), ctrl.getVendor);
router.patch('/:id',        authenticate, authorize('ADMIN', 'MANAGER'),                        ctrl.updateVendor);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'MANAGER'),                        ctrl.changeStatus);

export default router;
