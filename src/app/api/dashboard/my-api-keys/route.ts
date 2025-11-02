
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userId = decoded.id;

    const db = await openDb();
    const apiKeys = await db.all('SELECT * FROM api_keys WHERE user_id = ?', userId);

    return NextResponse.json(apiKeys, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}
