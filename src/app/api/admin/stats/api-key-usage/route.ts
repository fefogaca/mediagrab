import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    // Usar Prisma diretamente com include para trazer os dados do usuário
    const apiKeyUsage = await prisma.apiKey.findMany({
      select: {
        key: true,
        name: true,
        usageCount: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        usageCount: 'desc',
      },
      take: 5,
    });
    
    const formattedUsage = apiKeyUsage.map(key => ({
      key: key.key.substring(0, 8) + '...',
      name: key.name,
      download_count: key.usageCount,
      user: key.user ? {
        name: key.user.name,
        email: key.user.email,
      } : null,
    }));
    
    return NextResponse.json(formattedUsage, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API key usage:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch API key usage', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
