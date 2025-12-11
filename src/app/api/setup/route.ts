import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ message: 'Database setup successful' }, { status: 200 });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json({ message: 'Database setup failed', error: (error as Error).message }, { status: 500 });
  }
}
