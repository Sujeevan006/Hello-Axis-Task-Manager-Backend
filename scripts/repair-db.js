require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs');

const credPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const resolvedCredPath = path.isAbsolute(credPath)
  ? credPath
  : path.resolve(process.cwd(), credPath);

console.log('--- REPAIR SCRIPT ---');
console.log('Project:', process.env.FIREBASE_PROJECT_ID);
console.log('Creds:', resolvedCredPath);

const serviceAccount = require(resolvedCredPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function repair() {
  const usersToCreate = [
    {
      id: 'admin-001',
      email: 'admin@mail.com',
      name: 'Admin User',
      password: 'password123',
      role: 'admin',
      needs_password_change: false,
    },
    {
      id: 'kumar-001',
      email: 'kumar@gmail.com',
      name: 'Kumar Staff',
      password: 'password123',
      role: 'staff',
      needs_password_change: false,
    },
  ];

  for (const userData of usersToCreate) {
    const query = await db
      .collection('users')
      .where('email', '==', userData.email)
      .get();

    if (query.empty) {
      console.log(`➕ Creating missing user: ${userData.email}`);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const now = admin.firestore.Timestamp.now();

      await db
        .collection('users')
        .doc(userData.id)
        .set({
          ...userData,
          password: hashedPassword,
          created_at: now,
          updated_at: now,
        });
      console.log(
        `✅ ${userData.email} created with password: ${userData.password}`,
      );
    } else {
      console.log(`✔ User already exists: ${userData.email}`);
    }
  }

  console.log('\n--- Final User List ---');
  const allUsers = await db.collection('users').get();
  allUsers.forEach((doc) =>
    console.log(`- ${doc.data().email} [${doc.data().role}]`),
  );

  process.exit();
}

repair().catch((err) => {
  console.error('❌ Repair failed:', err);
  process.exit(1);
});
