require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

async function createKumar() {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = {
    id: 'kumar-staff-001',
    name: 'Kumar Staff',
    email: 'kumar@gmail.com',
    password: hashedPassword,
    role: 'staff',
    needs_password_change: false,
    created_at: admin.firestore.Timestamp.now(),
    updated_at: admin.firestore.Timestamp.now(),
  };

  await firestore.collection('users').doc(user.id).set(user);
  console.log('✅ Kumar created in (default) database!');
  process.exit();
}

createKumar().catch((err) => {
  console.error('Failed to create Kumar:', err.message);
  process.exit(1);
});
