import { Router } from 'express';
import * as ctrl from '../controllers/grn.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',              authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'), ctrl.listGRNs);
router.post('/',             authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'), ctrl.createGRN);
router.get('/:id',           authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'), ctrl.getGRN);
router.patch('/:id/items',   authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'), ctrl.updateGRNItems);
router.post('/:id/submit',  authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'), ctrl.submitGRN);

export default router;
