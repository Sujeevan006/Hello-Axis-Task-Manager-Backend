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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const firebase_1 = require("../utils/firebase");
const enums_1 = require("../types/enums");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const adminEmail = 'avsinfo0824@gmail.com';
    const plainPassword = 'admin123';
    try {
        console.log('🔍 Checking for existing admin user...');
        const userQuery = yield firebase_1.firestore
            .collection('users')
            .where('email', '==', adminEmail)
            .limit(1)
            .get();
        if (!userQuery.empty) {
            console.log('⚠️ Admin user already exists.');
            // Update password just in case
            const userDoc = userQuery.docs[0];
            const hashedPassword = yield bcryptjs_1.default.hash(plainPassword, 10);
            yield userDoc.ref.update({
                password: hashedPassword,
                role: enums_1.Role.admin,
                updated_at: firebase_1.Timestamp.now(),
            });
            console.log('✅ Admin password updated to default: admin123');
            process.exit(0);
        }
        console.log('🌱 Seeding super admin...');
        const hashedPassword = yield bcryptjs_1.default.hash(plainPassword, 10);
        const id = (0, uuid_1.v4)();
        const now = firebase_1.Timestamp.now();
        const newAdmin = {
            id,
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: enums_1.Role.admin,
            avatar: null,
            department: 'Management',
            needs_password_change: true,
            created_at: now,
            updated_at: now,
        };
        yield firebase_1.firestore.collection('users').doc(id).set(newAdmin);
        console.log('✅ Super Admin seeded successfully.');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', plainPassword);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
});
seedAdmin();
