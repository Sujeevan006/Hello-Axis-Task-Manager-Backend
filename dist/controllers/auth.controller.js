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
exports.changePassword = exports.getProfile = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const firebase_1 = require("../utils/firebase");
/**
 * User Login
 * POST /api/auth/login
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const userQuery = yield firebase_1.firestore
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        if (userQuery.empty) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const userDoc = userQuery.docs[0];
        const user = userDoc.data();
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, // Changed from 'your-secret-key'
        { expiresIn: '1d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.login = login;
/**
 * User Registration
 * POST /api/auth/register
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, role, avatar, department, password } = req.body;
    if (!name || !email || !password) {
        return res
            .status(400)
            .json({ message: 'Name, email and password are required' });
    }
    try {
        const userQuery = yield firebase_1.firestore
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        if (!userQuery.empty) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const id = (0, uuid_1.v4)();
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const now = firebase_1.Timestamp.now();
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
        yield firebase_1.firestore.collection('users').doc(id).set(newUser);
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, // Changed from 'your-secret-key'
        { expiresIn: '1d' });
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.register = register;
/**
 * Get User Profile
 * GET /api/auth/me
 */
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const userDoc = yield firebase_1.firestore.collection('users').doc(userId).get();
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
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProfile = getProfile;
/**
 * Change Password
 * POST /api/auth/change-password
 */
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const userDoc = yield firebase_1.firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userDoc.data();
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        yield firebase_1.firestore.collection('users').doc(userId).update({
            password: hashedPassword,
            needs_password_change: false,
            updated_at: firebase_1.Timestamp.now(),
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.changePassword = changePassword;
