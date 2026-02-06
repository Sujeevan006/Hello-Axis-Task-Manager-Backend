'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.firestore =
  exports.Timestamp =
  exports.FieldValue =
  exports.auth =
  exports.adminInstance =
    void 0;
const admin = require('firebase-admin');
// Initialize Firebase
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  throw new Error(
    'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set',
  );
}
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'axis-task-manager-df9bf',
  });
  console.log('✅ Firebase Admin initialized');
}
exports.adminInstance = admin;
exports.auth = admin.auth();
exports.firestore = admin.firestore();
exports.Timestamp = admin.firestore.Timestamp;
exports.FieldValue = admin.firestore.FieldValue;
