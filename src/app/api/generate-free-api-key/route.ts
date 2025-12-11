import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import ApiKey from '@backend/models/ApiKey';
import crypto from 'crypto';

export async function POST() {
  try {
    await connectDB();

    // Find the guest user to associate the key with using Prisma diretamente
    let guestUser = await prisma.user.findUnique({
      where: { email: 'guest@mediagrab.com' }
    });
    
    if (!guestUser) {
      // Create guest user if not exists using Prisma diretamente
      guestUser = await prisma.user.create({
        data: {
          name: 'Guest User',
          email: 'guest@mediagrab.com',
          password: crypto.randomBytes(32).toString('hex'),
          role: 'user',
          plan: 'free',
        }
      });
    }

    // Generate a new API key
    const apiKey = `mg_guest_${crypto.randomBytes(16).toString('hex')}`;
    
    // Set an expiration date for 2 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    // Create the API key
    await ApiKey.create({
      key: apiKey,
      name: 'Free Trial Key',
      userId: guestUser.id,
      usageLimit: 5,
      expiresAt,
      isActive: true,
    });

    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate free API key:', error);
    return NextResponse.json({ message: 'Failed to generate free API key', error: (error as Error).message }, { status: 500 });
  }
}
