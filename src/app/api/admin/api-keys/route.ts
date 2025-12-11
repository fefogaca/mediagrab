import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';
import ApiKey from '@backend/models/ApiKey';
import User from '@models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Buscar API keys com informações do usuário
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json({ message: 'Failed to fetch API keys', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name, usageLimit } = await request.json();

    // Validações
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Key name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Gerar a key
    const key = `mg_${require('crypto').randomBytes(32).toString('hex')}`;
    const finalUsageLimit = usageLimit && usageLimit > 0 ? usageLimit : 1000;

    // Criar a API Key
    const apiKey = await ApiKey.create({
      key,
      name: name.trim(),
      user: {
        connect: { id: userId }
      },
      usageLimit: finalUsageLimit,
      isActive: true,
      usageCount: 0,
    });

    // Buscar dados completos com user
    const apiKeyWithUser = await prisma.apiKey.findUnique({
      where: { id: apiKey.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'API key created successfully', 
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        userId: apiKey.userId,
        usageLimit: apiKey.usageLimit,
        usageCount: apiKey.usageCount,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        user: apiKeyWithUser?.user,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ 
      message: 'Failed to create API key', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
