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
exports.changePassword = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_schema_1 = require("../schema/zod.schema");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = zod_schema_1.loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { email, password } = validation.data;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                needsPasswordChange: user.needsPasswordChange,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.login = login;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validation = zod_schema_1.changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
    }
    const { oldPassword, newPassword } = validation.data;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        yield prisma_1.default.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                needsPasswordChange: false,
            },
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.changePassword = changePassword;
