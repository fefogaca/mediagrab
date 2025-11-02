import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await openDb();
    const apiKeys = await db.all('SELECT id, key, user_id, created_at, expires_at FROM api_keys');
    return NextResponse.json(apiKeys, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user_id, expires_at, usage_limit } = await request.json();

  if (!user_id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const db = await openDb();
    const apiKey = uuidv4();
    const finalUsageLimit = usage_limit || 100; // Default to 100 if not provided

    const result = await db.run(
      'INSERT INTO api_keys (key, user_id, expires_at, usage_limit) VALUES (?, ?, ?, ?)',
      apiKey,
      user_id,
      expires_at || null,
      finalUsageLimit
    );

    return NextResponse.json({ message: 'API key created successfully', apiKey, id: result.lastID, usage_limit: finalUsageLimit }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ message: 'Failed to create API key', error: (error as Error).message }, { status: 500 });
  }
}
