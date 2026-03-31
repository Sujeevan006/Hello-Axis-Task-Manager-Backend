import { firestore, Timestamp } from './utils/firebase';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './types/enums';

const seedFirebase = async () => {
    const adminEmail = 'avsinfo0824@gmail.com';
    
    try {
        console.log('🔥 Checking if admin exists in Firestore...');
        const userQuery = await firestore
            .collection('users')
            .where('email', '==', adminEmail)
            .limit(1)
            .get();

        if (userQuery.empty) {
            console.log('🚀 Seeding Super Admin to Firestore...');
            const id = uuidv4();
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const now = Timestamp.now();

            const newUser = {
                id,
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: Role.admin,
                avatar: null,
                department: 'Management',
                needs_password_change: true,
                created_at: now,
                updated_at: now,
            };

            await firestore.collection('users').doc(id).set(newUser);
            console.log('✅ Super Admin seeded to Firestore successfully!');
            console.log('Email: avsinfo0824@gmail.com');
            console.log('Password: admin123');
        } else {
            console.log('ℹ️ Admin already exists in Firestore.');
        }
    } catch (error) {
        console.error('❌ Error seeding Firestore:', error);
    } finally {
        process.exit(0);
    }
};

seedFirebase();
