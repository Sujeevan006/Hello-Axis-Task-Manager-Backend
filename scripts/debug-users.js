require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

console.log('Using Project ID:', admin.app().options.projectId);
const firestore = admin.firestore();

async function listEverything() {
  const collections = await firestore.listCollections();
  console.log('--- Collections found ---');
  collections.forEach((col) => console.log(`- ${col.id}`));

  for (const col of collections) {
    const snapshot = await col.limit(5).get();
    console.log(`\n--- Samples from ${col.id} ---`);
    snapshot.forEach((doc) => console.log(`- ID: ${doc.id}`));
  }
  process.exit();
}

listEverything().catch((err) => {
  console.error(err);
  process.exit(1);
});
