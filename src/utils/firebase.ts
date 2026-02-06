import * as admin from 'firebase-admin';

// Initialize Firebase
const serviceAccount = require(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;
export const adminInstance = admin;
