/* eslint-disable @typescript-eslint/no-require-imports */
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function migrate() {
  const db = await open({
    filename: './mydb.sqlite',
    driver: sqlite3.Database,
  });

  try {
    console.log('Running migration...');
    // Use try-catch for each alteration in case the script is run more than once.
    try {
      await db.exec('ALTER TABLE api_keys ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0');
      console.log('Column usage_count added.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Column usage_count already exists.');
      } else {
        throw e;
      }
    }

    try {
      await db.exec('ALTER TABLE api_keys ADD COLUMN usage_limit INTEGER NOT NULL DEFAULT 100');
      console.log('Column usage_limit added.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Column usage_limit already exists.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await db.close();
  }
}

migrate();
