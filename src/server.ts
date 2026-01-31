import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { seedAdmin } from './utils/seed';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedAdmin();
});
