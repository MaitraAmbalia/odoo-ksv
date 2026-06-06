import { Router } from 'express';
import * as ctrl from '../controllers/approval.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',            authenticate, authorize('MANAGER', 'ADMIN'), ctrl.listApprovals);
router.get('/pending',     authenticate, authorize('MANAGER'),          ctrl.getPendingApprovals);
router.get('/:id',         authenticate, authorize('MANAGER', 'PROCUREMENT_OFFICER', 'ADMIN'), ctrl.getApproval);
router.post('/:id/approve',authenticate, authorize('MANAGER', 'ADMIN'), ctrl.approve);
router.post('/:id/reject', authenticate, authorize('MANAGER', 'ADMIN'), ctrl.reject);

export default router;
