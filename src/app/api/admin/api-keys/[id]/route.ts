import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const db = await openDb();
    const apiKey = await db.get('SELECT id, key, user_id, created_at, expires_at FROM api_keys WHERE id = ?', id);

    if (!apiKey) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json(apiKey, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API key:', error);
    return NextResponse.json({ message: 'Failed to fetch API key', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { key, user_id, expires_at } = await request.json();

  if (!key && !user_id && !expires_at) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  try {
    const db = await openDb();
    let updateQuery = 'UPDATE api_keys SET';
    const updateParams: (string | number | null)[] = [];
    const fields: string[] = [];

    if (key) {
      fields.push('key = ?');
      updateParams.push(key);
    }
    if (user_id) {
      fields.push('user_id = ?');
      updateParams.push(user_id);
    }
    if (expires_at) {
      fields.push('expires_at = ?');
      updateParams.push(expires_at);
    }

    updateQuery += ' ' + fields.join(', ') + ' WHERE id = ?';
    updateParams.push(id);

    const result = await db.run(updateQuery, ...updateParams);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'API key not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json({ message: 'Failed to update API key', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const db = await openDb();
    const result = await db.run('DELETE FROM api_keys WHERE id = ?', id);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ message: 'Failed to delete API key', error: (error as Error).message }, { status: 500 });
  }
}
