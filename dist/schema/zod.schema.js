"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatusSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateUserRoleSchema = exports.createUserSchema = exports.changePasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['admin', 'staff']),
    avatar: zod_1.z.string().optional(),
});
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'staff']),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string(),
    priority: zod_1.z.enum(['low', 'medium', 'high']),
    dueDate: zod_1.z.string().optional(), // Expect ISO string
    timeAllocation: zod_1.z.number().int().optional(),
    assigneeId: zod_1.z.string().uuid().optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    dueDate: zod_1.z.string().optional().nullable(),
    timeAllocation: zod_1.z.number().int().optional().nullable(),
    assigneeId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['todo', 'in-process', 'review', 'completed']),
});
