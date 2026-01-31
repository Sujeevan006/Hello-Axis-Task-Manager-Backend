import { z } from 'zod';

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
  role: z.enum(['admin', 'staff']),
  avatar: z.string().optional(),
  department: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  role: z.enum(['admin', 'staff']).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional(), // ISO string expected
  time_allocation: z.number().int().optional(), // In minutes or hours
  assignee_id: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional().nullable(),
  time_allocation: z.number().int().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in-process', 'review', 'completed']),
});
