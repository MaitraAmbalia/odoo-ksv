import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        authenticate, ctrl.me);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

export default router;
