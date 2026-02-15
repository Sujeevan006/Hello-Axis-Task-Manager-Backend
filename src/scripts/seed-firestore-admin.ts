import dotenv from 'dotenv';
dotenv.config();

import { firestore, Timestamp } from '../utils/firebase';
import { Role } from '../types/enums';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seedAdmin = async () => {
  const adminEmail = 'avsinfo0824@gmail.com';
  const plainPassword = 'admin123';

  try {
    console.log('🔍 Checking for existing admin user...');
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', adminEmail)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      console.log('⚠️ Admin user already exists.');
      // Update password just in case
      const userDoc = userQuery.docs[0];
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await userDoc.ref.update({
        password: hashedPassword,
        role: Role.admin,
        updated_at: Timestamp.now(),
      });
      console.log('✅ Admin password updated to default: admin123');
      process.exit(0);
    }

    console.log('🌱 Seeding super admin...');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const id = uuidv4();
    const now = Timestamp.now();

    const newAdmin = {
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

    await firestore.collection('users').doc(id).set(newAdmin);
    console.log('✅ Super Admin seeded successfully.');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', plainPassword);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
