import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { firestore, Timestamp } from '../utils/firebase';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schema/zod.schema';
import { TaskStatus, Role } from '../types/enums';

/**
 * Helper to fetch a user snapshot for embedding
 */
const getUserSnapshot = async (userId: string) => {
  const userDoc = await firestore.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;
  const data = userDoc.data()!;
  return { id: data.id, name: data.name, avatar: data.avatar || null };
};

/**
 * List tasks with filters and pagination
 * GET /api/tasks?status=...&assignee=...&priority=...&page=1&limit=10
 */
export const listTasks = async (req: Request, res: Response) => {
  const { status, assignee, priority, page = '1', limit = '10' } = req.query;
  const p = parseInt(page as string);
  const l = parseInt(limit as string);
  const offset = (p - 1) * l;

  try {
    let query: any = firestore.collection('tasks');

    // Filters
    if (status) query = query.where('status', '==', status);
    if (assignee) query = query.where('assignee.id', '==', assignee);
    if (priority) query = query.where('priority', '==', priority);

    // Apply complexity permissions if needed (e.g., staff can only see assigned tasks?)
    // Existing MySQL code didn't strictly restrict the LIST endpoint,
    // but we check user role if we wanted to enforce it.
    // if (req.user!.role !== Role.admin) { ... }

    // Get total count (using the filtered query)
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    // Fetch paginated tasks
    const snapshot = await query
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        due_date: data.due_date?.toDate() || null,
        created_at: data.created_at?.toDate() || null,
        updated_at: data.updated_at?.toDate() || null,
      };
    });

    res.json({ tasks, total, page: p, limit: l });
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get single task with activity logs
 * GET /api/tasks/:id
 */
export const getTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const taskDoc = await firestore.collection('tasks').doc(id).get();
    if (!taskDoc.exists)
      return res.status(404).json({ message: 'Task not found' });

    const taskData = taskDoc.data()!;

    // Fetch related activity logs
    const logsSnapshot = await firestore
      .collection('activity_logs')
      .where('task_id', '==', id)
      .orderBy('timestamp', 'desc')
      .get();

    const activity_logs = logsSnapshot.docs.map((doc) => {
      const log = doc.data();
      return {
        ...log,
        timestamp: log.timestamp?.toDate() || null,
      };
    });

    res.json({
      ...taskData,
      due_date: taskData.due_date?.toDate() || null,
      created_at: taskData.created_at?.toDate() || null,
      updated_at: taskData.updated_at?.toDate() || null,
      activity_logs,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create task
 * POST /api/tasks
 */
export const createTask = async (req: Request, res: Response) => {
  const validation = createTaskSchema.safeParse(req.body);
  if (!validation.success)
    return res.status(400).json({ errors: validation.error.issues });

  const {
    title,
    description,
    priority,
    due_date,
    time_allocation,
    assignee_id,
  } = validation.data;
  const creatorId = (req as any).user!.id;

  try {
    const creatorSnapshot = await getUserSnapshot(creatorId);
    if (!creatorSnapshot)
      return res.status(404).json({ message: 'Creator not found' });

    let assigneeSnapshot = null;
    if (assignee_id) {
      assigneeSnapshot = await getUserSnapshot(assignee_id);
    }

    const taskId = uuidv4();
    const now = Timestamp.now();

    const newTask = {
      id: taskId,
      title,
      description,
      status: TaskStatus.todo,
      priority,
      due_date: due_date ? Timestamp.fromDate(new Date(due_date)) : null,
      time_allocation: time_allocation || null,
      creator: creatorSnapshot,
      assignee: assigneeSnapshot,
      created_at: now,
      updated_at: now,
    };

    const logId = uuidv4();
    const log = {
      id: logId,
      task_id: taskId,
      user: { id: creatorSnapshot.id, name: creatorSnapshot.name },
      action: 'Task created',
      timestamp: now,
    };

    await firestore.runTransaction(async (transaction) => {
      transaction.set(firestore.collection('tasks').doc(taskId), newTask);
      transaction.set(firestore.collection('activity_logs').doc(logId), log);
    });

    res.status(201).json({
      ...newTask,
      due_date: newTask.due_date?.toDate() || null,
      created_at: newTask.created_at.toDate(),
      updated_at: newTask.updated_at.toDate(),
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req: Request, res: Response) => {
  const validation = updateTaskSchema.safeParse(req.body);
  if (!validation.success)
    return res.status(400).json({ errors: validation.error.issues });

  const { id } = req.params;
  const data = validation.data;
  const userId = (req as any).user!.id;

  try {
    await firestore.runTransaction(async (transaction) => {
      const taskRef = firestore.collection('tasks').doc(id);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists) throw new Error('NOT_FOUND');

      const existingTask = taskDoc.data()!;

      // Permissions (Staff can only update assigned/created tasks?)
      if (
        (req as any).user!.role !== Role.admin &&
        existingTask.creator.id !== userId &&
        existingTask.assignee?.id !== userId
      ) {
        throw new Error('FORBIDDEN');
      }

      const updateData: any = { ...data };
      if (data.due_date)
        updateData.due_date = Timestamp.fromDate(new Date(data.due_date));
      if (data.due_date === null) updateData.due_date = null;

      // Handling assignee snapshot update
      if (data.assignee_id !== undefined) {
        if (data.assignee_id) {
          const assigneeSnap = await getUserSnapshot(data.assignee_id);
          updateData.assignee = assigneeSnap;
        } else {
          updateData.assignee = null;
        }
        delete updateData.assignee_id;
      }

      updateData.updated_at = Timestamp.now();

      // Detect changes for log
      const changes = [];
      if (data.title && data.title !== existingTask.title)
        changes.push('title');
      if (data.description && data.description !== existingTask.description)
        changes.push('description');
      if (data.priority && data.priority !== existingTask.priority)
        changes.push('priority');
      if (
        data.assignee_id !== undefined &&
        data.assignee_id !== existingTask.assignee?.id
      )
        changes.push('assignee');

      if (changes.length > 0) {
        const logId = uuidv4();
        const userSnapshot = await getUserSnapshot(userId);
        transaction.set(firestore.collection('activity_logs').doc(logId), {
          id: logId,
          task_id: id,
          user: { id: userId, name: userSnapshot?.name || 'User' },
          action: `Updated ${changes.join(', ')}`,
          timestamp: updateData.updated_at,
        });
      }

      transaction.update(taskRef, updateData);
    });

    res.json({ message: 'Task updated successfully' });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND')
      return res.status(404).json({ message: 'Task not found' });
    if (error.message === 'FORBIDDEN')
      return res.status(403).json({ message: 'Access denied' });
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update task status
 * PATCH /api/tasks/:id/status
 */
export const updateTaskStatus = async (req: Request, res: Response) => {
  const validation = updateTaskStatusSchema.safeParse(req.body);
  if (!validation.success)
    return res.status(400).json({ errors: validation.error.issues });

  const { id } = req.params;
  const { status } = validation.data;
  const userId = (req as any).user!.id;

  try {
    await firestore.runTransaction(async (transaction) => {
      const taskRef = firestore.collection('tasks').doc(id);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists) throw new Error('NOT_FOUND');

      const existingTask = taskDoc.data()!;
      const newStatus =
        status === 'in-process' ? TaskStatus.in_process : status;

      if (existingTask.status === newStatus) return;

      const now = Timestamp.now();
      transaction.update(taskRef, { status: newStatus, updated_at: now });

      const logId = uuidv4();
      const userSnapshot = await getUserSnapshot(userId);
      transaction.set(firestore.collection('activity_logs').doc(logId), {
        id: logId,
        task_id: id,
        user: { id: userId, name: userSnapshot?.name || 'User' },
        action: `Changed status from ${existingTask.status} to ${status}`,
        timestamp: now,
      });
    });

    res.json({ message: 'Status updated successfully' });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND')
      return res.status(404).json({ message: 'Task not found' });
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Transactional delete: also remove logs?
    // Usually activity logs should persist, but let's follow standard cleanup if requested.
    // For now, mirroring MySQL CASCADE behavior.
    await firestore.runTransaction(async (transaction) => {
      const taskRef = firestore.collection('tasks').doc(id);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) throw new Error('NOT_FOUND');

      transaction.delete(taskRef);

      // Delete associated activity logs
      const logsSnapshot = await firestore
        .collection('activity_logs')
        .where('task_id', '==', id)
        .get();
      logsSnapshot.forEach((doc) => {
        transaction.delete(doc.ref);
      });
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND')
      return res.status(404).json({ message: 'Task not found' });
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
