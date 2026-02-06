import * as admin from 'firebase-admin';

// Initialize Firebase
import path from 'path';

// Resolve service account path relative to project root
const credPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
const resolvedCredPath = path.isAbsolute(credPath)
  ? credPath
  : path.resolve(process.cwd(), credPath);

console.log(
  '🔥 Initializing Firebase with project:',
  process.env.FIREBASE_PROJECT_ID,
);
console.log('📂 Credentials path:', resolvedCredPath);

let serviceAccount;
try {
  serviceAccount = require(resolvedCredPath);
} catch (error) {
  console.error(
    '❌ Failed to load Firebase credentials from:',
    resolvedCredPath,
  );
  throw error;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;
export const adminInstance = admin;
