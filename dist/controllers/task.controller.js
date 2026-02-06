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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.createTask = exports.getTask = exports.listTasks = exports.Role = exports.TaskStatus = void 0;
const uuid_1 = require("uuid");
const firebase_1 = require("../utils/firebase");
// Task Status Enum
exports.TaskStatus = {
    todo: 'todo',
    in_process: 'in_process',
    completed: 'completed',
};
// Role Enum
exports.Role = {
    admin: 'admin',
    user: 'user',
};
/**
 * Helper to fetch a user snapshot for embedding
 */
const getUserSnapshot = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        return null;
    try {
        const userDoc = yield firebase_1.firestore.collection('users').doc(userId).get();
        if (!userDoc.exists)
            return null;
        const data = userDoc.data();
        return {
            id: data.id,
            name: data.name,
            avatar: data.avatar || null,
        };
    }
    catch (error) {
        console.error('Error fetching user snapshot:', error);
        return null;
    }
});
/**
 * List tasks with filters and pagination
 * GET /api/tasks?status=...&assignee=...&priority=...&page=1&limit=10
 */
const listTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, assignee, priority, page = '1', limit = '10' } = req.query;
        const p = parseInt(page);
        const l = parseInt(limit);
        const offset = (p - 1) * l;
        let query = firebase_1.firestore.collection('tasks');
        // Filters
        if (status)
            query = query.where('status', '==', status);
        if (assignee)
            query = query.where('assignee.id', '==', assignee);
        if (priority)
            query = query.where('priority', '==', priority);
        // Get total count
        const totalSnapshot = yield query.count().get();
        const total = totalSnapshot.data().count;
        // Fetch paginated tasks
        const snapshot = yield query
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(l)
            .get();
        const tasks = snapshot.docs.map((doc) => {
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { due_date: data.due_date ? data.due_date.toDate() : null, created_at: data.created_at ? data.created_at.toDate() : null, updated_at: data.updated_at ? data.updated_at.toDate() : null });
        });
        res.json({
            tasks,
            total,
            page: p,
            limit: l,
        });
    }
    catch (error) {
        console.error('List tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.listTasks = listTasks;
/**
 * Get single task with activity logs
 * GET /api/tasks/:id
 */
const getTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Task ID is required' });
    }
    try {
        const taskDoc = yield firebase_1.firestore.collection('tasks').doc(id).get();
        if (!taskDoc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const taskData = taskDoc.data();
        // Fetch related activity logs
        const logsSnapshot = yield firebase_1.firestore
            .collection('activity_logs')
            .where('task_id', '==', id)
            .orderBy('timestamp', 'desc')
            .get();
        const activity_logs = logsSnapshot.docs.map((doc) => {
            const log = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, log), { timestamp: log.timestamp ? log.timestamp.toDate() : null });
        });
        res.json(Object.assign(Object.assign({ id: taskDoc.id }, taskData), { due_date: taskData.due_date ? taskData.due_date.toDate() : null, created_at: taskData.created_at ? taskData.created_at.toDate() : null, updated_at: taskData.updated_at ? taskData.updated_at.toDate() : null, activity_logs }));
    }
    catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getTask = getTask;
/**
 * Create task
 * POST /api/tasks
 */
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, priority, due_date, time_allocation, assignee_id, } = req.body;
    const creatorId = req.user ? req.user.id : null;
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }
    if (!creatorId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const creatorSnapshot = yield getUserSnapshot(creatorId);
        if (!creatorSnapshot) {
            return res.status(404).json({ message: 'Creator not found' });
        }
        let assigneeSnapshot = null;
        if (assignee_id) {
            assigneeSnapshot = yield getUserSnapshot(assignee_id);
        }
        const taskId = (0, uuid_1.v4)();
        const now = firebase_1.Timestamp.now();
        const newTask = {
            id: taskId,
            title,
            description: description || '',
            status: exports.TaskStatus.todo,
            priority: priority || 'medium',
            due_date: due_date ? firebase_1.Timestamp.fromDate(new Date(due_date)) : null,
            time_allocation: time_allocation || null,
            creator: creatorSnapshot,
            assignee: assigneeSnapshot,
            created_at: now,
            updated_at: now,
        };
        const logId = (0, uuid_1.v4)();
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
        yield firebase_1.firestore.runTransaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            transaction.set(firebase_1.firestore.collection('tasks').doc(taskId), newTask);
            transaction.set(firebase_1.firestore.collection('activity_logs').doc(logId), log);
        }));
        res.status(201).json(Object.assign(Object.assign({}, newTask), { due_date: newTask.due_date ? newTask.due_date.toDate() : null, created_at: newTask.created_at.toDate(), updated_at: newTask.updated_at.toDate() }));
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createTask = createTask;
/**
 * Update task
 * PUT /api/tasks/:id
 */
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user ? req.user.id : null;
    if (!id) {
        return res.status(400).json({ message: 'Task ID is required' });
    }
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const taskRef = firebase_1.firestore.collection('tasks').doc(id);
        const taskDoc = yield taskRef.get();
        if (!taskDoc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const existingTask = taskDoc.data();
        // Permissions (Staff can only update assigned/created tasks?)
        if (req.user.role !== exports.Role.admin &&
            existingTask.creator.id !== userId &&
            (existingTask.assignee ? existingTask.assignee.id !== userId : true)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const updateData = {};
        // Update fields if provided
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.priority !== undefined)
            updateData.priority = data.priority;
        if (data.due_date !== undefined) {
            updateData.due_date = data.due_date
                ? firebase_1.Timestamp.fromDate(new Date(data.due_date))
                : null;
        }
        if (data.time_allocation !== undefined) {
            updateData.time_allocation = data.time_allocation;
        }
        // Handling assignee
        if (data.assignee_id !== undefined) {
            if (data.assignee_id) {
                const assigneeSnap = yield getUserSnapshot(data.assignee_id);
                updateData.assignee = assigneeSnap;
            }
            else {
                updateData.assignee = null;
            }
        }
        updateData.updated_at = firebase_1.Timestamp.now();
        // Detect changes for log
        const changes = [];
        if (data.title && data.title !== existingTask.title)
            changes.push('title');
        if (data.description && data.description !== existingTask.description)
            changes.push('description');
        if (data.priority && data.priority !== existingTask.priority)
            changes.push('priority');
        if (data.assignee_id !== undefined &&
            data.assignee_id !==
                (existingTask.assignee ? existingTask.assignee.id : null)) {
            changes.push('assignee');
        }
        if (changes.length > 0) {
            const logId = (0, uuid_1.v4)();
            const userSnapshot = yield getUserSnapshot(userId);
            yield firebase_1.firestore
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
        yield taskRef.update(updateData);
        res.json({ message: 'Task updated successfully' });
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateTask = updateTask;
/**
 * Update task status
 * PATCH /api/tasks/:id/status
 */
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user ? req.user.id : null;
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
        const taskRef = firebase_1.firestore.collection('tasks').doc(id);
        const taskDoc = yield taskRef.get();
        if (!taskDoc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const existingTask = taskDoc.data();
        const newStatus = status === 'in-process' ? exports.TaskStatus.in_process : status;
        if (existingTask.status === newStatus) {
            return res.json({ message: 'Status unchanged' });
        }
        const now = firebase_1.Timestamp.now();
        // Update task status
        yield taskRef.update({
            status: newStatus,
            updated_at: now,
        });
        // Create activity log
        const logId = (0, uuid_1.v4)();
        const userSnapshot = yield getUserSnapshot(userId);
        yield firebase_1.firestore
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
    }
    catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateTaskStatus = updateTaskStatus;
/**
 * Delete task
 * DELETE /api/tasks/:id
 */
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Task ID is required' });
    }
    try {
        const taskRef = firebase_1.firestore.collection('tasks').doc(id);
        const taskDoc = yield taskRef.get();
        if (!taskDoc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // Delete the task
        yield taskRef.delete();
        // Delete associated activity logs
        const logsSnapshot = yield firebase_1.firestore
            .collection('activity_logs')
            .where('task_id', '==', id)
            .get();
        if (!logsSnapshot.empty) {
            const batch = firebase_1.firestore.batch();
            logsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            yield batch.commit();
        }
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteTask = deleteTask;
