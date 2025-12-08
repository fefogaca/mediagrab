
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';

export async function GET() {
  try {
    const db = await openDb();
    const logs = await db.all("SELECT DATE(downloaded_at) as date, COUNT(*) as count FROM download_logs GROUP BY DATE(downloaded_at) ORDER BY date ASC");
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch downloads over time:', error);
    return NextResponse.json({ message: 'Failed to fetch downloads over time', error: (error as Error).message }, { status: 500 });
  }
}
