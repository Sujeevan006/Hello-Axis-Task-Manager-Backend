'use strict';

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { firestore, Timestamp } = require('../utils/firebase');

/**
 * User Login
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

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

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, // Remove the fallback 'your-secret-key'
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
        created_at: user.created_at ? user.created_at.toDate() : null,
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
const register = async (req, res) => {
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
    const hashedPassword = await bcryptjs.hash(password, 10);
    const now = Timestamp.now();

    const newUser = {
      id,
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      avatar: avatar || null,
      department: department || null,
      needs_password_change: false,
      created_at: now,
      updated_at: now,
    };

    await firestore.collection('users').doc(id).set(newUser);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, // Remove the fallback 'your-secret-key'
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
const getProfile = async (req, res) => {
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userDoc.data();
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
const changePassword = async (req, res) => {
  const { password, newPassword } = req.body;
  const userId = req.user ? req.user.id : null;

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

    const user = userDoc.data();
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

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

// Export the functions
module.exports = {
  login,
  register,
  getProfile,
  changePassword,
};
