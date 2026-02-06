const admin = require('firebase-admin');
const serviceAccount = require('C:\\Users\\User\\Documents\\axis-task-manager-0d483f7967ae.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'axis-task-manager',
});

const firestore = admin.firestore();

async function check() {
  const snapshot = await firestore.collection('users').get();
  console.log('Project ID:', admin.app().options.projectId);
  console.log('User count:', snapshot.size);
  snapshot.forEach((doc) => console.log('-', doc.data().email));
  process.exit();
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
