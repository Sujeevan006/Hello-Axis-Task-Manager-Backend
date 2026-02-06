"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    var _a;
    const authHeader = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    // DEVELOPMENT BYPASS: Accept mock token for superadmin@axivers.com
    if (authHeader === 'dev-superadmin-token-12345') {
        console.log('✅ Development token accepted for superadmin');
        req.user = {
            id: 'superadmin-dev-id',
            email: 'superadmin@axivers.com',
            role: 'admin',
            name: 'Super Admin',
        };
        return next();
    }
    // NORMAL JWT VERIFICATION for all other tokens
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
            name: decoded.name,
        };
        next();
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
