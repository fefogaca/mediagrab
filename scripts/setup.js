
import { setupDatabase } from '../src/lib/database.ts';

async function setup() {
  try {
    console.log('Setting up database...');
    await setupDatabase();
  } catch (err) {
    console.error('Database setup failed:', err.message);
  } 
}

setup();
