'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const user_controller_1 = require('../controllers/user.controller');
const auth_middleware_1 = require('../middleware/auth.middleware');
const role_middleware_1 = require('../middleware/role.middleware');

// Define Role enum locally (remove Prisma import)
const Role = {
  admin: 'admin',
  user: 'user',
};

const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, user_controller_1.listUsers);
router.post(
  '/',
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)([Role.admin]),
  user_controller_1.createUser,
);
router.put(
  '/:id/role',
  auth_middleware_1.authenticate,
  (0, role_middleware_1.authorize)([Role.admin]),
  user_controller_1.updateUserRole,
);
exports.default = router;
