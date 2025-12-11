import { NextResponse } from 'next/server';
import { connectDB } from '@backend/lib/database';
import prisma from '@backend/lib/database';

export async function GET() {
  try {
    await connectDB();
    
    const downloads = await prisma.downloadLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedDownloads = downloads.map(d => ({
      id: d.id,
      url: d.url,
      platform: d.provider,
      userId: d.userId,
      username: d.user?.name || 'Anônimo',
      createdAt: d.createdAt,
      downloaded_at: d.createdAt,
    }));

    return NextResponse.json({ downloads: formattedDownloads }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch recent downloads:', error);
    return NextResponse.json({ message: 'Erro ao buscar downloads', error: (error as Error).message }, { status: 500 });
  }
}
