import { Router } from 'express';
import * as ctrl from '../controllers/activityLog.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), ctrl.listLogs);

export default router;
