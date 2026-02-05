/**
 * CLOUD FIRESTORE MIGRATION SCRIPT
 *
 * Description:
 * Migrates data from MySQL to Google Cloud Firestore with snapshot embedding
 * and idempotency checks.
 *
 * Usage:
 * 1. Ensure .env has DATABASE_URL and FIREBASE_SERVICE_ACCOUNT_PATH.
 * 2. Run: node scripts/migrate-to-firestore.js
 * 3. Dry Run: node scripts/migrate-to-firestore.js --dry-run
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
const path = require('path');

// --- Configuration ---
const isDryRun = process.argv.includes('--dry-run');
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  'axis-task-manager-f6a3f8ae4929.json';
const resolvedPath = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.join(process.cwd(), serviceAccountPath);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(resolvedPath),
  databaseId: 'task-management-db',
});

const firestore = admin.firestore();

class BatchManager {
  constructor(firestore, isDryRun) {
    this.firestore = firestore;
    this.isDryRun = isDryRun;
    this.batch = firestore.batch();
    this.count = 0;
    this.totalMigrated = 0;
    this.stats = { created: 0, updated: 0, skipped: 0 };
  }

  async add(collection, data, operation) {
    const docRef = this.firestore.collection(collection).doc(data.id);

    if (operation === 'SKIP') {
      this.stats.skipped++;
      return;
    }

    if (this.isDryRun) {
      console.log(
        `[Dry Run] Would ${operation} document: ${collection}/${data.id}`,
      );
      operation === 'CREATE' ? this.stats.created++ : this.stats.updated++;
      return;
    }

    this.batch.set(docRef, data, { merge: true });
    this.count++;
    operation === 'CREATE' ? this.stats.created++ : this.stats.updated++;

    if (this.count >= 500) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count === 0) return;

    await this.batch.commit();
    this.totalMigrated += this.count;
    console.log(
      `[Firestore] Committed batch of ${this.count} records. Total so far: ${this.totalMigrated}`,
    );

    this.batch = this.firestore.batch();
    this.count = 0;
  }

  getStats() {
    return this.stats;
  }
}

async function getWriteOperation(collectionName, data) {
  const docRef = firestore.collection(collectionName).doc(data.id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) return 'CREATE';

  const existingData = docSnap.data();
  // Safe check: Only update if MySQL updated_at is newer
  // MySQL dates come as Date objects from mysql2
  const mysqlUpdate =
    data.updated_at instanceof admin.firestore.Timestamp
      ? data.updated_at.toMillis()
      : new Date(data.updated_at).getTime();

  const firestoreUpdate = existingData.updated_at
    ? existingData.updated_at.toMillis()
    : 0;

  return mysqlUpdate > firestoreUpdate ? 'UPDATE' : 'SKIP';
}

async function runMigration() {
  let mysqlConn;
  try {
    console.log('--- Migration Started ---');
    if (isDryRun)
      console.log(
        '!!! DRY RUN MODE ACTIVE - No writes will be performed !!!\n',
      );

    mysqlConn = await mysql.createConnection(process.env.DATABASE_URL);
    const batchManager = new BatchManager(firestore, isDryRun);

    // --- 1. MIGRATING USERS ---
    console.log('\n[1/4] Migrating Users...');
    const [users] = await mysqlConn.execute('SELECT * FROM users');
    for (const user of users) {
      const transformed = {
        ...user,
        created_at: admin.firestore.Timestamp.fromDate(
          new Date(user.created_at),
        ),
        updated_at: admin.firestore.Timestamp.fromDate(
          new Date(user.updated_at),
        ),
      };
      const op = await getWriteOperation('users', transformed);
      await batchManager.add('users', transformed, op);
    }
    await batchManager.commit();
    console.log(`Users Stats: ${JSON.stringify(batchManager.getStats())}`);

    // Build User Cache for Snapshots
    const usersSnapshot = await firestore.collection('users').get();
    const userMap = {};
    usersSnapshot.forEach((doc) => {
      const u = doc.data();
      userMap[u.id] = { id: u.id, name: u.name, avatar: u.avatar };
    });

    // --- 2. MIGRATING ORGANIZATIONS ---
    console.log('\n[2/4] Migrating Organizations...');
    const [orgs] = await mysqlConn.execute('SELECT * FROM organization');
    for (const org of orgs) {
      const op = await getWriteOperation('organizations', org);
      await batchManager.add('organizations', org, op);
    }
    await batchManager.commit();

    // --- 3. MIGRATING TASKS (with Snapshots) ---
    console.log('\n[3/4] Migrating Tasks...');
    const [tasks] = await mysqlConn.execute('SELECT * FROM tasks');
    for (const task of tasks) {
      const transformed = {
        ...task,
        status: task.status === 'in-process' ? 'in_process' : task.status,
        due_date: task.due_date
          ? admin.firestore.Timestamp.fromDate(new Date(task.due_date))
          : null,
        created_at: admin.firestore.Timestamp.fromDate(
          new Date(task.created_at),
        ),
        updated_at: admin.firestore.Timestamp.fromDate(
          new Date(task.updated_at),
        ),
        creator: userMap[task.creator_id] || {
          id: task.creator_id,
          name: 'Migration System',
          avatar: null,
        },
        assignee: task.assignee_id
          ? userMap[task.assignee_id] || {
              id: task.assignee_id,
              name: 'Unknown User',
              avatar: null,
            }
          : null,
      };
      // Clean up internal relational IDs that are now snapshots
      delete transformed.creator_id;
      delete transformed.assignee_id;

      const op = await getWriteOperation('tasks', transformed);
      await batchManager.add('tasks', transformed, op);
    }
    await batchManager.commit();

    // --- 4. MIGRATING ACTIVITY LOGS ---
    console.log('\n[4/4] Migrating Activity Logs...');
    const [logs] = await mysqlConn.execute('SELECT * FROM activity_logs');
    for (const log of logs) {
      const transformed = {
        ...log,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(log.timestamp)),
        // User snapshot in logs for display performance
        user: userMap[log.user_id] || { id: log.user_id, name: 'System' },
      };
      // For logs, we check ID existence. Logs usually don't have updated_at, so use timestamp
      const docSnap = await firestore
        .collection('activity_logs')
        .doc(log.id)
        .get();
      const op = docSnap.exists ? 'SKIP' : 'CREATE';

      await batchManager.add('activity_logs', transformed, op);
    }
    await batchManager.commit();

    console.log('\n--- Migration Completed Successfully ---');
    console.log('Final Stats:', batchManager.getStats());
  } catch (error) {
    console.error('\n!!! MIGRATION FAILED !!!');
    console.error(error);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    console.log('Connections closed.');
    process.exit();
  }
}

runMigration();
