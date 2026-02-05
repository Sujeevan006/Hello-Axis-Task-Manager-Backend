import { z } from 'zod';
import { Role, Priority, TaskStatus } from '../types/enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  password: z.string().min(1),
  newPassword: z.string().min(6),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  avatar: z.string().optional(),
  department: z.string().optional(),
});

export const registerSchema = createUserSchema.extend({
  password: z.string().min(6),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  priority: z.nativeEnum(Priority),
  due_date: z.string().optional(), // ISO string expected
  time_allocation: z.number().int().optional(), // In minutes or hours
  assignee_id: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  due_date: z.string().optional().nullable(),
  time_allocation: z.number().int().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});
