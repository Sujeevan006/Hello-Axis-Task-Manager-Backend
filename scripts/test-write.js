require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

async function testWrite() {
  console.log('Target Project:', admin.app().options.projectId);
  const id = 'test-write-' + Date.now();
  await firestore.collection('users').doc(id).set({
    email: 'tester@mail.com',
    name: 'Tester',
    role: 'staff',
    created_at: admin.firestore.Timestamp.now(),
  });
  console.log('✅ Created user with ID:', id);
  process.exit();
}

testWrite().catch((err) => {
  console.error(err);
  process.exit(1);
});
