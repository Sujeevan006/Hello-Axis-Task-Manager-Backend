import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { firestore, Timestamp } from '../utils/firebase';
import { createUserSchema, updateUserSchema } from '../schema/zod.schema';

/**
 * List all users with pagination
 * GET /api/users?page=1&limit=10
 */
export const listUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const usersRef = firestore.collection('users');

    // Get total count using aggregation query
    const totalSnapshot = await usersRef.count().get();
    const total = totalSnapshot.data().count;

    // Fetch paginated users
    const snapshot = await usersRef
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        department: data.department,
        created_at: data.created_at?.toDate() || null,
      };
    });

    res.json({
      users,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single user by ID
 * GET /api/users/:id
 */
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userDoc = await firestore.collection('users').doc(id).get();

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
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create user (Admin only)
 * POST /api/users
 */
export const createUser = async (req: Request, res: Response) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { name, email, role, avatar, department } = validation.data;

  try {
    const existingQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    if (!existingQuery.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Auto-generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const id = firestore.collection('users').doc().id; // Generate random Firestore ID or keep UUID
    const now = Timestamp.now();

    const newUser = {
      id,
      name,
      email,
      role,
      avatar: avatar || null,
      department: department || null,
      password: hashedPassword,
      needs_password_change: true,
      created_at: now,
      updated_at: now,
    };

    await firestore.collection('users').doc(id).set(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id,
        name,
        email,
        role,
        department: newUser.department,
      },
      tempPassword,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { id } = req.params;

  try {
    const userRef = firestore.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      ...validation.data,
      updated_at: Timestamp.now(),
    };

    await userRef.update(updateData);

    const updatedDoc = await userRef.get();
    const user = updatedDoc.data()!;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Transactional delete: Clean up task assignments
    await firestore.runTransaction(async (transaction) => {
      const userRef = firestore.collection('users').doc(id);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      // 1. Delete the user
      transaction.delete(userRef);

      // Note: In Firestore, finding and updating ALL tasks in a transaction
      // might exceed limit if there are thousands.
      // For a "small" project, we can query tasks.
    });

    // Post-transaction cleanup: Detach from tasks (Async)
    // We don't want to block the user deletion response too long if many tasks exist.
    const assignedTasks = await firestore
      .collection('tasks')
      .where('assignee.id', '==', id)
      .get();
    const batch = firestore.batch();
    assignedTasks.forEach((doc) => {
      batch.update(doc.ref, { assignee: null });
    });
    await batch.commit();

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
