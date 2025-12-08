
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';

export async function GET() {
  try {
    const db = await openDb();
    const { count } = await db.get('SELECT COUNT(*) as count FROM download_logs');
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch total downloads:', error);
    return NextResponse.json({ message: 'Failed to fetch total downloads', error: (error as Error).message }, { status: 500 });
  }
}
