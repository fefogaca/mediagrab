import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const db = await openDb();
    const users = await db.all('SELECT id, username, role FROM users');
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { username, password, role } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
  }

  try {
    const db = await openDb();

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      username,
      hashedPassword,
      role || 'user' // Default role to 'user' if not provided
    );

    return NextResponse.json({ message: 'User created successfully', userId: result.lastID }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ message: 'Failed to create user', error: (error as Error).message }, { status: 500 });
  }
}
