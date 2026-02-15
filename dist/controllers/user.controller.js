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
exports.deleteUser = exports.updateUserRole = exports.updateUser = exports.testFirestore = exports.createUser = exports.getUser = exports.listUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const firebase_1 = require("../utils/firebase");
const enums_1 = require("../types/enums");
/**
 * List all users with pagination
 * GET /api/users?page=1&limit=10
 */
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('📋 Fetching user list... Query:', req.query);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const usersRef = firebase_1.firestore.collection('users');
        // Get total count using aggregation query
        const totalSnapshot = yield usersRef.count().get();
        const total = totalSnapshot.data().count;
        // Fetch paginated users
        const snapshot = yield usersRef
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .get();
        const users = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
                avatar: data.avatar,
                department: data.department,
                created_at: data.created_at ? data.created_at.toDate() : null,
            };
        });
        res.json({
            users,
            total,
            page,
            limit,
        });
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.listUsers = listUsers;
/**
 * Get a single user by ID
 * GET /api/users/:id
 */
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const userDoc = yield firebase_1.firestore.collection('users').doc(id).get();
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUser = getUser;
/**
 * Create user (Admin only)
 * POST /api/users
 */
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { name, email, role, avatar, department } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }
    // Normalize email
    email = email.toLowerCase().trim();
    try {
        console.log('🔧 Creating user with data:', {
            name,
            email,
            role,
            department,
        });
        // Check if user exists
        const existingQuery = yield firebase_1.firestore
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        if (!existingQuery.empty) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }
        // Auto-generate temp password
        const tempPassword = Math.random().toString(36).slice(-8);
        console.log('🔧 Generated temp password:', tempPassword);
        const hashedPassword = yield bcryptjs_1.default.hash(tempPassword, 10);
        console.log('🔧 Password hashed successfully');
        // Generate a new document ID
        const id = firebase_1.firestore.collection('users').doc().id;
        const now = firebase_1.Timestamp.now();
        const newUser = {
            id,
            name,
            email,
            role: role || enums_1.Role.staff,
            avatar: avatar || null,
            department: department || null,
            password: hashedPassword,
            needs_password_change: true,
            created_at: now,
            updated_at: now,
        };
        console.log('🔧 Saving user to Firestore:', newUser);
        yield firebase_1.firestore.collection('users').doc(id).set(newUser);
        console.log('✅ User created successfully:', id);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id,
                name,
                email,
                role: newUser.role,
                department: newUser.department,
            },
            tempPassword,
        });
    }
    catch (error) {
        console.error('❌ Create user error DETAILS:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Request body:', req.body);
        console.error('❌ Request user:', req.user);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
});
exports.createUser = createUser;
/**
 * Test Firestore connection
 * GET /api/users/test/firestore
 */
const testFirestore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔧 Testing Firestore connection...');
        // Try to write a test document
        const testRef = firebase_1.firestore.collection('test').doc('connection-test');
        yield testRef.set({
            test: true,
            timestamp: firebase_1.Timestamp.now(),
        });
        // Try to read it back
        const doc = yield testRef.get();
        if (doc.exists) {
            console.log('✅ Firestore connection test PASSED');
            yield testRef.delete(); // Clean up
            res.json({ message: 'Firestore is working', data: doc.data() });
        }
        else {
            console.log('❌ Firestore connection test FAILED');
            res.status(500).json({ message: 'Firestore test failed' });
        }
    }
    catch (error) {
        console.error('❌ Firestore test error:', error);
        res.status(500).json({ message: 'Firestore error', error: error.message });
    }
});
exports.testFirestore = testFirestore;
/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, email, role, avatar, department } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    try {
        const userRef = firebase_1.firestore.collection('users').doc(id);
        const userDoc = yield userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (role !== undefined)
            updateData.role = role;
        if (avatar !== undefined)
            updateData.avatar = avatar;
        if (department !== undefined)
            updateData.department = department;
        updateData.updated_at = firebase_1.Timestamp.now();
        yield userRef.update(updateData);
        const updatedDoc = yield userRef.get();
        const user = updatedDoc.data();
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            department: user.department,
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateUser = updateUser;
/**
 * Update user role
 * PUT /api/users/:id/role
 */
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { role } = req.body;
    if (!id || !role) {
        return res.status(400).json({ message: 'User ID and role are required' });
    }
    try {
        const userRef = firebase_1.firestore.collection('users').doc(id);
        const userDoc = yield userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        yield userRef.update({
            role: role,
            updated_at: firebase_1.Timestamp.now(),
        });
        res.json({ message: 'User role updated successfully' });
    }
    catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateUserRole = updateUserRole;
/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    try {
        console.log('🗑️ Deleting user:', id);
        // First, check if user exists
        const userRef = firebase_1.firestore.collection('users').doc(id);
        const userDoc = yield userRef.get();
        if (!userDoc.exists) {
            console.log('❌ Delete failed: User not found', id);
            return res.status(404).json({ message: 'User not found' });
        }
        // Delete the user
        yield userRef.delete();
        console.log('✅ User document deleted from Firestore');
        // Post-transaction cleanup: Detach from tasks (Async)
        console.log('🔧 Detaching user from assigned tasks...');
        const assignedTasks = yield firebase_1.firestore
            .collection('tasks')
            .where('assignee.id', '==', id)
            .get();
        if (!assignedTasks.empty) {
            console.log(`🔧 Found ${assignedTasks.size} tasks to update`);
            const batch = firebase_1.firestore.batch();
            assignedTasks.forEach((doc) => {
                batch.update(doc.ref, { assignee: null });
            });
            yield batch.commit();
            console.log('✅ Tasks updated successfully');
        }
        else {
            console.log('ℹ️ No assigned tasks found for this user');
        }
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('❌ Delete user error DETAILS:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
});
exports.deleteUser = deleteUser;
