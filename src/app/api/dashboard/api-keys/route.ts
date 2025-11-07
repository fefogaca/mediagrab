import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

interface DecodedToken {
  id: number;
  username: string;
  role: string;
}

function getUserIdFromRequest(request: Request): number | null {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      // Tentar pegar do cookie
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
          const decoded = jwt.verify(tokenMatch[1], JWT_SECRET);
          if (typeof decoded !== 'string' && 'id' in decoded) {
            return (decoded as DecodedToken).id;
          }
        }
      }
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string' || !('id' in decoded)) {
      return null;
    }
    return (decoded as DecodedToken).id;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await openDb();
    const apiKeys = await db.all('SELECT id, key, user_id, created_at, expires_at, usage_count, usage_limit FROM api_keys WHERE user_id = ?', userId);

    return NextResponse.json(apiKeys, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { expires_at, usage_limit } = await request.json();

    const db = await openDb();
    const apiKey = `user-${uuidv4()}`;

    let expiresAtToSend: string | null = null;
    if (expires_at) {
      const date = new Date(expires_at);
      if (!isNaN(date.getTime())) {
        expiresAtToSend = date.toISOString();
      }
    }

    const limitToSend = usage_limit || 100; // Default to Developer plan limit

    await db.run(
      'INSERT INTO api_keys (key, user_id, expires_at, usage_limit) VALUES (?, ?, ?, ?)',
      apiKey,
      userId,
      expiresAtToSend,
      limitToSend
    );

    return NextResponse.json({ message: 'API key created successfully', apiKey }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ message: 'Failed to create API key', error: (error as Error).message }, { status: 500 });
  }
}

