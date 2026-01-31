import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate as any);

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', authorize([Role.admin]), deleteTask);

export default router;
