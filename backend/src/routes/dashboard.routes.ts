import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/summary',         authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.getSummary);
router.get('/recent-pos',      authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), ctrl.getRecentPOs);
router.get('/recent-activity', authenticate, ctrl.getRecentActivity);

export default router;
