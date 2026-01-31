import { Role } from '@prisma/client';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export const seedAdmin = async () => {
  const adminEmail = 'avsinfo0824@gmail.com';

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      console.log('Seeding super admin...');

      const hashedPassword = await bcrypt.hash('admin123', 10);

      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: adminEmail,
          role: Role.admin,
          password: hashedPassword,
          needs_password_change: true,
          department: 'Management',
        },
      });
      console.log(
        'Super Admin seeded. Email: avsinfo0824@gmail.com, Password: admin123',
      );
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};
