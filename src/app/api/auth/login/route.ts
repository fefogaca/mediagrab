import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/utils';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  try {
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getJwtSecret(), { expiresIn: '1h' });

    const response = NextResponse.json({ message: 'Login successful', role: user.role, token: token }, { status: 200 });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Login failed', error: (error as Error).message }, { status: 500 });
  }
}
