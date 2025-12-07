import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import ApiKey from '@backend/models/ApiKey';

export async function GET() {
  try {
    await connectDB();
    
    // Buscar API keys com informações do usuário
    const apiKeys = await ApiKey.find()
      .populate('userId', 'name email plan role')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, name, usageLimit } = await request.json();

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    await connectDB();
    
    const key = `mg_${require('crypto').randomBytes(32).toString('hex')}`;
    const finalUsageLimit = usageLimit || 100;

    const apiKey = await ApiKey.create({
      key,
      name: name || 'API Key',
      userId,
      usageLimit: finalUsageLimit,
      isActive: true,
      usageCount: 0,
    });

    return NextResponse.json({ 
      message: 'API key created successfully', 
      apiKey 
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ message: 'Failed to create API key', error: (error as Error).message }, { status: 500 });
  }
}
