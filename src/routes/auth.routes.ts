import { Router } from 'express';
import { login, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/change-password', authenticate, changePassword);

export default router;
