'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

// Just export Firebase Firestore without re-initializing
const { firestore, Timestamp } = require('./firebase');

// Export as default (mimics Prisma's default export for compatibility)
exports.default = firestore;

// Also export directly
exports.firestore = firestore;
exports.Timestamp = Timestamp;

// Create a mock Prisma-like client for compatibility
const firebaseClient = {
  // User operations (mock for compatibility)
  user: {
    findUnique: async (params) => {
      const { where } = params;
      if (where.id) {
        const doc = await firestore.collection('users').doc(where.id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      }
      if (where.email) {
        const query = await firestore
          .collection('users')
          .where('email', '==', where.email)
          .limit(1)
          .get();
        return query.empty
          ? null
          : { id: query.docs[0].id, ...query.docs[0].data() };
      }
      return null;
    },
  },
  // Task operations (mock for compatibility)
  task: {
    findMany: async (params) => {
      let query = firestore.collection('tasks');
      const { where } = params || {};

      if (where) {
        if (where.userId) query = query.where('userId', '==', where.userId);
        if (where.status) query = query.where('status', '==', where.status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
  },
};

// Export the mock client as well for compatibility
exports.prisma = firebaseClient;
