import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schema/zod.schema';
import { TaskStatus, Priority, Prisma } from '@prisma/client';

export const listTasks = async (req: Request, res: Response) => {
  const { status, assignee, priority } = req.query;

  const where: Prisma.TaskWhereInput = {};

  if (status) {
    const s =
      status === 'in-process' ? TaskStatus.in_process : (status as TaskStatus);
    if (Object.values(TaskStatus).includes(s)) {
      where.status = s;
    }
  }
  if (assignee) {
    where.assignee_id = assignee as string;
  }
  if (priority && Object.values(Priority).includes(priority as Priority)) {
    where.priority = priority as Priority;
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        activity_logs: {
          include: { user: { select: { name: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        activity_logs: {
          include: { user: { select: { name: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  const validation = createTaskSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

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
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        due_date: due_date ? new Date(due_date) : null,
        time_allocation,
        creator_id: creatorId,
        assignee_id,
        status: TaskStatus.todo,
      },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        task_id: task.id,
        user_id: creatorId,
        action: 'Task created',
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const validation = updateTaskSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { id } = req.params;
  const data = validation.data;
  const userId = (req as any).user!.id;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask)
      return res.status(404).json({ message: 'Task not found' });

    // Handle due_date string to Date conversion if present
    const updateData: any = { ...data };
    if (data.due_date) {
      updateData.due_date = new Date(data.due_date);
    } else if (data.due_date === null) {
      updateData.due_date = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Detect changes for log
    const changes = [];
    if (data.title && data.title !== existingTask.title) changes.push('title');
    if (data.description && data.description !== existingTask.description)
      changes.push('description');
    if (data.priority && data.priority !== existingTask.priority)
      changes.push('priority');
    if (
      data.assignee_id !== undefined &&
      data.assignee_id !== existingTask.assignee_id
    )
      changes.push('assignee');

    // Status should be handled via status endpoint but if changed here:
    // ...

    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: {
          task_id: id,
          user_id: userId,
          action: `Updated ${changes.join(', ')}`,
        },
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const validation = updateTaskStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.issues });
  }

  const { id } = req.params;
  const { status } = validation.data;
  const userId = (req as any).user!.id;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask)
      return res.status(404).json({ message: 'Task not found' });

    if (existingTask.status === status) {
      return res.json(existingTask); // No change
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status:
          status === 'in-process'
            ? TaskStatus.in_process
            : (status as TaskStatus),
      },
    });

    await prisma.activityLog.create({
      data: {
        task_id: id,
        user_id: userId,
        action: `Changed status from ${existingTask.status} to ${status}`,
      },
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
