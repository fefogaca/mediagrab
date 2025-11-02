import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { username, password, role } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
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
      'user' // Always default to user role
    );

    return NextResponse.json({ message: 'User registered successfully', userId: result.lastID }, { status: 201 });
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ message: 'Registration failed', error: (error as Error).message }, { status: 500 });
  }
}
