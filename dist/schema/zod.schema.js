"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatusSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateUserSchema = exports.registerSchema = exports.createUserSchema = exports.changePasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    role: zod_1.z.nativeEnum(enums_1.Role),
    avatar: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
});
exports.registerSchema = exports.createUserSchema.extend({
    password: zod_1.z.string().min(6),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    department: zod_1.z.string().optional(),
    role: zod_1.z.nativeEnum(enums_1.Role).optional(),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string(),
    priority: zod_1.z.nativeEnum(enums_1.Priority),
    due_date: zod_1.z.string().optional(), // ISO string expected
    time_allocation: zod_1.z.number().int().optional(), // In minutes or hours
    assignee_id: zod_1.z.string().optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(enums_1.Priority).optional(),
    due_date: zod_1.z.string().optional().nullable(),
    time_allocation: zod_1.z.number().int().optional().nullable(),
    assignee_id: zod_1.z.string().optional().nullable(),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(enums_1.TaskStatus),
});
