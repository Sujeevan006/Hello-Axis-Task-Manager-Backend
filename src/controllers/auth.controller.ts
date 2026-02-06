import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { firestore, Timestamp } from '../utils/firebase';
import { Role } from '../types/enums';

/**
 * User Login
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Normalize email
  email = email.toLowerCase().trim();

  try {
    console.log('🔑 Login attempt:', email);

    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.log('❌ Login failed: User not found', email);
      return res
        .status(401)
        .json({ message: 'User not found. Check email spelling.' });
    }

    const userDoc = userQuery.docs[0];
    const user = userDoc.data();
    console.log('👤 User found in Firestore:', {
      id: user.id,
      role: user.role,
      needs_password_change: user.needs_password_change,
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Login failed: Incorrect password for', email);
      return res
        .status(401)
        .json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );

    console.log('✅ Login successful:', email);

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
        created_at: user.created_at ? user.created_at.toDate() : null,
      },
    });
  } catch (error: any) {
    console.error('❌ Login error DETAILS:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * User Registration
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  const { name, email, role, avatar, department, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Name, email and password are required' });
  }

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
      role: role || Role.staff,
      avatar: avatar || null,
      department: department || null,
      needs_password_change: false,
      created_at: now,
      updated_at: now,
    };

    await firestore.collection('users').doc(id).set(newUser);

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET as string, // Changed from 'your-secret-key'
      { expiresIn: '1d' },
    );

    res.status(201).json({
      token,
      user: {
        id,
        name,
        email,
        role: newUser.role,
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
  const userId = (req as any).user ? (req as any).user.id : null;

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
      created_at: user.created_at ? user.created_at.toDate() : null,
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
  const { password, newPassword } = req.body;
  const userId = (req as any).user ? (req as any).user.id : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!password || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Current and new password are required' });
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
