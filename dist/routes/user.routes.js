"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([enums_1.Role.admin]), user_controller_1.listUsers); // Admin only or Auth
router.get('/test/firestore', user_controller_1.testFirestore);
router.get('/:id', auth_middleware_1.authenticate, user_controller_1.getUser);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([enums_1.Role.admin]), user_controller_1.createUser);
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([enums_1.Role.admin]), user_controller_1.updateUser);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([enums_1.Role.admin]), user_controller_1.deleteUser);
exports.default = router;
