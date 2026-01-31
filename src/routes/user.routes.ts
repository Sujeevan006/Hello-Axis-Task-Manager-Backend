import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, authorize([Role.admin]), listUsers); // Admin only or Auth
router.get('/:id', authenticate, getUser);
router.post('/', authenticate, authorize([Role.admin]), createUser);
router.put('/:id', authenticate, authorize([Role.admin]), updateUser);
router.delete('/:id', authenticate, authorize([Role.admin]), deleteUser);

export default router;
