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
exports.updateUserRole = exports.createUser = exports.listUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_schema_1 = require("../schema/zod.schema");
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.listUsers = listUsers;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = zod_schema_1.createUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { name, email, role, avatar } = validation.data;
    try {
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Auto-generate temp password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = yield bcryptjs_1.default.hash(tempPassword, 10);
        const newUser = yield prisma_1.default.user.create({
            data: {
                name,
                email,
                role,
                avatar,
                password: hashedPassword,
                needsPasswordChange: true,
            },
        });
        // In a real app, send email with tempPassword
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
            tempPassword, // Returning for demo purposes
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createUser = createUser;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = zod_schema_1.updateUserRoleSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { id } = req.params;
    const { role } = validation.data;
    try {
        const user = yield prisma_1.default.user.update({
            where: { id },
            data: { role },
            select: { id: true, role: true },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error or user not found' });
    }
});
exports.updateUserRole = updateUserRole;
