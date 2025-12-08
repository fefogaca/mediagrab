
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';

export async function GET() {
  try {
    const db = await openDb();
    const apiKeyUsage = await db.all("SELECT a.key, COUNT(d.id) as download_count FROM download_logs d JOIN api_keys a ON d.api_key_id = a.id WHERE d.api_key_id IS NOT NULL GROUP BY a.id ORDER BY download_count DESC LIMIT 5");
    return NextResponse.json(apiKeyUsage, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API key usage:', error);
    return NextResponse.json({ message: 'Failed to fetch API key usage', error: (error as Error).message }, { status: 500 });
  }
}
