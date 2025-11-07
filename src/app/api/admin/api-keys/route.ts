import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await openDb();
    // Buscar API keys com informações do usuário
    const apiKeys = await db.all(`
      SELECT 
        ak.id, 
        ak.key, 
        ak.user_id, 
        ak.created_at, 
        ak.expires_at,
        ak.usage_count,
        ak.usage_limit,
        u.username,
        u.role
      FROM api_keys ak
      LEFT JOIN users u ON ak.user_id = u.id
      ORDER BY ak.created_at DESC
    `);
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
