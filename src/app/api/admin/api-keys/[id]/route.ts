import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import ApiKey from '@backend/models/ApiKey';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
          }
        }
      }
    });

    if (!apiKey) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ apiKey }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API key:', error);
    return NextResponse.json({ message: 'Failed to fetch API key', error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await request.json();

  try {
    await connectDB();
    
    const apiKey = await ApiKey.findByIdAndUpdate(id, updates);

    if (!apiKey) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key updated successfully', apiKey }, { status: 200 });
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json({ message: 'Failed to update API key', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();
    const result = await prisma.apiKey.delete({ where: { id } });

    if (!result) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ message: 'Failed to delete API key', error: (error as Error).message }, { status: 500 });
  }
}
