import { Router } from 'express';
import * as ctrl from '../controllers/purchaseOrder.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',            authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER','VENDOR'), ctrl.listPOs);
router.get('/:id',         authenticate, ctrl.getPO);
router.patch('/:id/cancel',authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'), ctrl.cancelPO);

export default router;
