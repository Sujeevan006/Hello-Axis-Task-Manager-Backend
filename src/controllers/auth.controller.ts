import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { firestore, Timestamp } from '../utils/firebase';
import {
  loginSchema,
  changePasswordSchema,
  registerSchema,
} from '../schema/zod.schema';

/**
 * User Login
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { email, password } = validation.data;

  try {
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = userQuery.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        needs_password_change: user.needs_password_change,
        created_at: user.created_at?.toDate() || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * User Registration
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { name, email, role, avatar, department, password } = validation.data;

  try {
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = Timestamp.now();

    const newUser = {
      id,
      name,
      email,
      password: hashedPassword,
      role,
      avatar: avatar || null,
      department: department || null,
      needs_password_change: false,
      created_at: now,
      updated_at: now,
    };

    await firestore.collection('users').doc(id).set(newUser);

    const token = jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });

    res.status(201).json({
      token,
      user: {
        id,
        name,
        email,
        role,
        avatar: newUser.avatar,
        department: newUser.department,
        needs_password_change: newUser.needs_password_change,
        created_at: newUser.created_at.toDate(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get User Profile
 * GET /api/auth/me
 */
export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userDoc.data()!;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      created_at: user.created_at?.toDate() || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Change Password
 * POST /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  const validation = changePasswordSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { password, newPassword } = validation.data;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userDoc.data()!;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await firestore.collection('users').doc(userId).update({
      password: hashedPassword,
      needs_password_change: false,
      updated_at: Timestamp.now(),
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
