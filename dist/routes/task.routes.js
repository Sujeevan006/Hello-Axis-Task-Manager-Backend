'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const task_controller_1 = require('../controllers/task.controller');
const auth_middleware_1 = require('../middleware/auth.middleware');
const role_middleware_1 = require('../middleware/role.middleware');

// Define Role enum locally (remove Prisma import)
const Role = {
  admin: 'admin',
  user: 'user',
};

const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', task_controller_1.listTasks);
router.post('/', task_controller_1.createTask);
router.put('/:id', task_controller_1.updateTask);
router.patch('/:id/status', task_controller_1.updateTaskStatus);
router.delete(
  '/:id',
  (0, role_middleware_1.authorize)([Role.admin]),
  task_controller_1.deleteTask,
);
exports.default = router;
