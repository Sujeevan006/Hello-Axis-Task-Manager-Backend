const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

const path = require('path');
const admin = require('firebase-admin');

async function debug() {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log('Cred Path from env:', credPath);

  try {
    const serviceAccount = require(credPath);
    console.log(
      'JSON loaded successfully. Project ID in JSON:',
      serviceAccount.project_id,
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    console.log('Successfully connected! User count:', snapshot.size);
    snapshot.forEach((doc) => console.log(' -', doc.data().email));
  } catch (err) {
    console.error('--- DEBUG ERROR ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    if (err.code) console.error('Code:', err.code);
  }
  process.exit();
}

debug();
