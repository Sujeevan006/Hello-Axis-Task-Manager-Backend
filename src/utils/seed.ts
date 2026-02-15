import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
          password: hashedPassword,
          role: Role.ADMIN, // ✅ Correct capitalization
          needs_password_change: true, // ✅ now exists in schema
          department: 'Management', // ✅ now exists in schema
        },
      });

      console.log(
        'Super Admin seeded. Email: avsinfo0824@gmail.com, Password: admin123',
      );
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await prisma.$disconnect();
  }
};
