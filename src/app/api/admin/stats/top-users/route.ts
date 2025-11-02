
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';

export async function GET() {
  try {
    const db = await openDb();
    const topUsers = await db.all("SELECT u.username, COUNT(d.id) as download_count FROM download_logs d JOIN users u ON d.user_id = u.id WHERE d.user_id IS NOT NULL GROUP BY u.id ORDER BY download_count DESC LIMIT 5");
    return NextResponse.json(topUsers, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch top users:', error);
    return NextResponse.json({ message: 'Failed to fetch top users', error: (error as Error).message }, { status: 500 });
  }
}
