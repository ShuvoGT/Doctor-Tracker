import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ensureSeedData } from './utils/seed.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const { usingMemoryServer } = await connectDB();

    // Always ensure an admin user exists. When running on the throwaway
    // in-memory DB, also seed demo doctors/patients so the UI isn't empty.
    await ensureSeedData({ withDemoData: usingMemoryServer });

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
