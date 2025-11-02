
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const db = await openDb();

    // Find the guest user to associate the key with
    const guestUser = await db.get("SELECT * FROM users WHERE username = ?", "guest");
    if (!guestUser) {
      throw new Error("Guest user not found. Please run the setup script.");
    }

    // Generate a new UUID for the API key
    const apiKey = uuidv4();
    // Set an expiration date for 2 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    // Insert the new API key into the database
    await db.run(
      'INSERT INTO api_keys (key, user_id, expires_at) VALUES (?, ?, ?)',
      apiKey,
      guestUser.id,
      expiresAt.toISOString()
    );

    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate free API key:', error);
    return NextResponse.json({ message: 'Failed to generate free API key', error: (error as Error).message }, { status: 500 });
  }
}
