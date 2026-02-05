import * as admin from 'firebase-admin';
import path from 'path';

let db: admin.firestore.Firestore | null = null;

const initializeFirestore = (): admin.firestore.Firestore => {
  if (!db) {
    // Use ENV variable or default to the filename you provided
    // For Cloud Run: Use the service account JSON directly from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      // Cloud Run: JSON from environment variable
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Local fallback
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    db = admin.firestore();

    // ✅ OPTIONAL: Set Firestore database ID if using a specific database (rarely needed)
    // For your default Firestore database, this line is unnecessary
    // db = admin.firestore(admin.app(), 'your-database-id');

    console.log('Firestore initialized successfully');
  }
  return db;
};

export const firestore = initializeFirestore();
export const Timestamp = admin.firestore.Timestamp;
export default admin;
