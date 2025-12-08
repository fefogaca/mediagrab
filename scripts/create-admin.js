/* eslint-disable @typescript-eslint/no-require-imports */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

async function createAdmin(username, password) {
  if (!username || !password) {
    console.error('Usage: node scripts/create-admin.js <username> <password>');
    process.exit(1);
  }

  try {
    const db = await open({
      filename: './mydb.sqlite',
      driver: sqlite3.Database,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      username,
      hashedPassword,
      'admin'
    );

    console.log(`Admin user "${username}" created successfully.`);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.error(`Error: User "${username}" already exists.`);
    } else {
      console.error('Failed to create admin user:', error);
    }
    process.exit(1);
  }
}

const [username, password] = process.argv.slice(2);
createAdmin(username, password);
