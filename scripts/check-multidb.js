require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

async function checkDatabase(dbId) {
  try {
    const appName = 'app-' + (dbId || 'default');
    const app = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
        databaseId: dbId,
      },
      appName,
    );

    const firestore = app.firestore();
    const snapshot = await firestore.collection('users').get();
    console.log(`\n--- Users in [${dbId || '(default)'}] ---`);
    console.log(`Count: ${snapshot.size}`);
    snapshot.forEach((doc) => {
      console.log(`- ${doc.data().email}`);
    });

    await app.delete();
  } catch (err) {
    console.log(`\n--- Error checking [${dbId || '(default)'}] ---`);
    console.log(err.message);
  }
}

async function run() {
  await checkDatabase(undefined); // (default)
  await checkDatabase('task-management-db');
  process.exit();
}

run();
