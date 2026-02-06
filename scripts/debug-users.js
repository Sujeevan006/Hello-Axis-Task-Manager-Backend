require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

async function listUsers() {
  const snapshot = await firestore.collection('users').get();
  console.log('--- Current Users in Firestore ---');
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`- Email: "${data.email}", Role: ${data.role}, ID: ${data.id}`);
  });
  console.log('---------------------------------');
  process.exit();
}

listUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
