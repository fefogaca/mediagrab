import { NextResponse } from 'next/server';
import { setupDatabase } from '../../../lib/database';

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({ message: 'Database setup successful' }, { status: 200 });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json({ message: 'Database setup failed', error: (error as Error).message }, { status: 500 });
  }
}
