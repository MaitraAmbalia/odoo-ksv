import { Router } from 'express';
import * as ctrl from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/',              authenticate, authorize('ADMIN'), ctrl.listUsers);
router.get('/:id',           authenticate, authorize('ADMIN'), ctrl.getUser);
router.patch('/:id/status',  authenticate, authorize('ADMIN'), ctrl.updateUserStatus);
router.patch('/:id/role',    authenticate, authorize('ADMIN'), ctrl.updateUserRole);

export default router;
