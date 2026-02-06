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
exports.seedAdmin = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("./prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const adminEmail = 'avsinfo0824@gmail.com';
    try {
        const existingAdmin = yield prisma_1.default.user.findUnique({
            where: { email: adminEmail },
        });
        if (!existingAdmin) {
            console.log('Seeding super admin...');
            const hashedPassword = yield bcryptjs_1.default.hash('admin123', 10);
            yield prisma_1.default.user.create({
                data: {
                    name: 'Super Admin',
                    email: adminEmail,
                    role: client_1.Role.admin,
                    password: hashedPassword,
                    needs_password_change: true,
                    department: 'Management',
                },
            });
            console.log('Super Admin seeded. Email: avsinfo0824@gmail.com, Password: admin123');
        }
    }
    catch (error) {
        console.error('Error seeding admin:', error);
    }
});
exports.seedAdmin = seedAdmin;
