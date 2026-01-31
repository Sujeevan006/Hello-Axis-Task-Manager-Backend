"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.createTask = exports.listTasks = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_schema_1 = require("../schema/zod.schema");
const client_1 = require("@prisma/client");
const listTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, assignee, priority } = req.query;
    const where = {};
    if (status && Object.values(client_1.TaskStatus).includes(status)) {
        where.status = status;
    }
    if (assignee) {
        where.assigneeId = assignee;
    }
    if (priority && Object.values(client_1.Priority).includes(priority)) {
        where.priority = priority;
    }
    try {
        const tasks = yield prisma_1.default.task.findMany({
            where,
            include: {
                creator: { select: { id: true, name: true, avatar: true } },
                assignee: { select: { id: true, name: true, avatar: true } },
                activityLogs: {
                    include: { user: { select: { name: true } } },
                    orderBy: { timestamp: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.listTasks = listTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = zod_schema_1.createTaskSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { title, description, priority, dueDate, timeAllocation, assigneeId } = validation.data;
    const creatorId = req.user.id;
    try {
        const task = yield prisma_1.default.task.create({
            data: {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                timeAllocation,
                creatorId,
                assigneeId,
                status: client_1.TaskStatus.todo,
            },
            include: {
                creator: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
            },
        });
        // Log activity
        yield prisma_1.default.activityLog.create({
            data: {
                taskId: task.id,
                userId: creatorId,
                action: 'Task created',
            },
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createTask = createTask;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = zod_schema_1.updateTaskSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { id } = req.params;
    const data = validation.data;
    const userId = req.user.id;
    try {
        const existingTask = yield prisma_1.default.task.findUnique({ where: { id } });
        if (!existingTask)
            return res.status(404).json({ message: 'Task not found' });
        const updatedTask = yield prisma_1.default.task.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate }),
        });
        // Detect changes for log
        const changes = [];
        if (data.title && data.title !== existingTask.title)
            changes.push('title');
        if (data.description && data.description !== existingTask.description)
            changes.push('description');
        if (data.priority && data.priority !== existingTask.priority)
            changes.push('priority');
        if (data.assigneeId !== undefined &&
            data.assigneeId !== existingTask.assigneeId)
            changes.push('assignee');
        if (changes.length > 0) {
            yield prisma_1.default.activityLog.create({
                data: {
                    taskId: id,
                    userId,
                    action: `Updated ${changes.join(', ')}`,
                },
            });
        }
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateTask = updateTask;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = zod_schema_1.updateTaskStatusSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { id } = req.params;
    const { status } = validation.data;
    const userId = req.user.id;
    try {
        const existingTask = yield prisma_1.default.task.findUnique({ where: { id } });
        if (!existingTask)
            return res.status(404).json({ message: 'Task not found' });
        if (existingTask.status === status) {
            return res.json(existingTask); // No change
        }
        const updatedTask = yield prisma_1.default.task.update({
            where: { id },
            data: { status },
        });
        yield prisma_1.default.activityLog.create({
            data: {
                taskId: id,
                userId,
                action: `Changed status from ${existingTask.status} to ${status}`,
            },
        });
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateTaskStatus = updateTaskStatus;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.default.task.delete({ where: { id } });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteTask = deleteTask;
