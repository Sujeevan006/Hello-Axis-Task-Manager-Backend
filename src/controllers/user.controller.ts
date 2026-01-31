import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { createUserSchema, updateUserSchema } from '../schema/zod.schema';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        created_at: true,
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { name, email, role, avatar, department } = validation.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Auto-generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        avatar,
        department,
        password: hashedPassword,
        needs_password_change: true,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
      tempPassword, // Returned for admin visibility as requested
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { id } = req.params;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser)
      return res.status(404).json({ message: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
