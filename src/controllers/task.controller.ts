import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { firestore, Timestamp } from '../utils/firebase';

// Task Status Enum
export const TaskStatus = {
  todo: 'todo',
  in_process: 'in_process',
  completed: 'completed',
} as const;

// Role Enum
export const Role = {
  admin: 'admin',
  user: 'user',
} as const;

type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

/**
 * Helper to fetch a user snapshot for embedding
 */
const getUserSnapshot = async (userId: string) => {
  if (!userId) return null;

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const data = userDoc.data()!;
    return {
      id: data.id,
      name: data.name,
      avatar: data.avatar || null,
    };
  } catch (error) {
    console.error('Error fetching user snapshot:', error);
    return null;
  }
};

/**
 * List tasks with filters and pagination
 * GET /api/tasks?status=...&assignee=...&priority=...&page=1&limit=10
 */
export const listTasks = async (req: Request, res: Response) => {
  try {
    const { status, assignee, priority, page = '1', limit = '10' } = req.query;
    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const offset = (p - 1) * l;

    let query: any = firestore.collection('tasks');

    // Filters
    if (status) query = query.where('status', '==', status);
    if (assignee) query = query.where('assignee.id', '==', assignee);
    if (priority) query = query.where('priority', '==', priority);

    // Get total count
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
        id: doc.id,
        ...data,
        due_date: data.due_date ? data.due_date.toDate() : null,
        created_at: data.created_at ? data.created_at.toDate() : null,
        updated_at: data.updated_at ? data.updated_at.toDate() : null,
      };
    });

    res.json({
      tasks,
      total,
      page: p,
      limit: l,
    });
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

  if (!id) {
    return res.status(400).json({ message: 'Task ID is required' });
  }

  try {
    const taskDoc = await firestore.collection('tasks').doc(id).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

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
        id: doc.id,
        ...log,
        timestamp: log.timestamp ? log.timestamp.toDate() : null,
      };
    });

    res.json({
      id: taskDoc.id,
      ...taskData,
      due_date: taskData.due_date ? taskData.due_date.toDate() : null,
      created_at: taskData.created_at ? taskData.created_at.toDate() : null,
      updated_at: taskData.updated_at ? taskData.updated_at.toDate() : null,
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
  const {
    title,
    description,
    priority,
    due_date,
    time_allocation,
    assignee_id,
  } = req.body;

  const creatorId = (req as any).user ? (req as any).user.id : null;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (!creatorId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const creatorSnapshot = await getUserSnapshot(creatorId);
    if (!creatorSnapshot) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    let assigneeSnapshot = null;
    if (assignee_id) {
      assigneeSnapshot = await getUserSnapshot(assignee_id);
    }

    const taskId = uuidv4();
    const now = Timestamp.now();

    const newTask = {
      id: taskId,
      title,
      description: description || '',
      status: TaskStatus.todo,
      priority: priority || 'medium',
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
      user: {
        id: creatorSnapshot.id,
        name: creatorSnapshot.name,
      },
      action: 'Task created',
      timestamp: now,
    };

    await firestore.runTransaction(async (transaction) => {
      transaction.set(firestore.collection('tasks').doc(taskId), newTask);
      transaction.set(firestore.collection('activity_logs').doc(logId), log);
    });

    res.status(201).json({
      ...newTask,
      due_date: newTask.due_date ? newTask.due_date.toDate() : null,
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
  const { id } = req.params;
  const data = req.body;
  const userId = (req as any).user ? (req as any).user.id : null;

  if (!id) {
    return res.status(400).json({ message: 'Task ID is required' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const taskRef = firestore.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const existingTask = taskDoc.data()!;

    // Permissions (Staff can only update assigned/created tasks?)
    if (
      (req as any).user.role !== Role.admin &&
      existingTask.creator.id !== userId &&
      (existingTask.assignee ? existingTask.assignee.id !== userId : true)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData: any = {};

    // Update fields if provided
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;

    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date
        ? Timestamp.fromDate(new Date(data.due_date))
        : null;
    }

    if (data.time_allocation !== undefined) {
      updateData.time_allocation = data.time_allocation;
    }

    // Handling assignee
    if (data.assignee_id !== undefined) {
      if (data.assignee_id) {
        const assigneeSnap = await getUserSnapshot(data.assignee_id);
        updateData.assignee = assigneeSnap;
      } else {
        updateData.assignee = null;
      }
    }

    updateData.updated_at = Timestamp.now();

    // Detect changes for log
    const changes = [];
    if (data.title && data.title !== existingTask.title) changes.push('title');
    if (data.description && data.description !== existingTask.description)
      changes.push('description');
    if (data.priority && data.priority !== existingTask.priority)
      changes.push('priority');
    if (
      data.assignee_id !== undefined &&
      data.assignee_id !==
        (existingTask.assignee ? existingTask.assignee.id : null)
    ) {
      changes.push('assignee');
    }

    if (changes.length > 0) {
      const logId = uuidv4();
      const userSnapshot = await getUserSnapshot(userId);

      await firestore
        .collection('activity_logs')
        .doc(logId)
        .set({
          id: logId,
          task_id: id,
          user: {
            id: userId,
            name: userSnapshot ? userSnapshot.name : 'User',
          },
          action: `Updated ${changes.join(', ')}`,
          timestamp: updateData.updated_at,
        });
    }

    await taskRef.update(updateData);

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update task status
 * PATCH /api/tasks/:id/status
 */
export const updateTaskStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = (req as any).user ? (req as any).user.id : null;

  if (!id) {
    return res.status(400).json({ message: 'Task ID is required' });
  }

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const taskRef = firestore.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const existingTask = taskDoc.data()!;
    const newStatus = status === 'in-process' ? TaskStatus.in_process : status;

    if (existingTask.status === newStatus) {
      return res.json({ message: 'Status unchanged' });
    }

    const now = Timestamp.now();

    // Update task status
    await taskRef.update({
      status: newStatus,
      updated_at: now,
    });

    // Create activity log
    const logId = uuidv4();
    const userSnapshot = await getUserSnapshot(userId);

    await firestore
      .collection('activity_logs')
      .doc(logId)
      .set({
        id: logId,
        task_id: id,
        user: {
          id: userId,
          name: userSnapshot ? userSnapshot.name : 'User',
        },
        action: `Changed status from ${existingTask.status} to ${newStatus}`,
        timestamp: now,
      });

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
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

  if (!id) {
    return res.status(400).json({ message: 'Task ID is required' });
  }

  try {
    const taskRef = firestore.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete the task
    await taskRef.delete();

    // Delete associated activity logs
    const logsSnapshot = await firestore
      .collection('activity_logs')
      .where('task_id', '==', id)
      .get();

    if (!logsSnapshot.empty) {
      const batch = firestore.batch();
      logsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
