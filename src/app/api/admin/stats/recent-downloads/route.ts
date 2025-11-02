
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';

export async function GET() {
  try {
    const db = await openDb();
    const logs = await db.all('SELECT * FROM download_logs ORDER BY downloaded_at DESC LIMIT 10');
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch recent downloads:', error);
    return NextResponse.json({ message: 'Failed to fetch recent downloads', error: (error as Error).message }, { status: 500 });
  }
}
