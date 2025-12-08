import { NextResponse } from 'next/server';
import connectDB from '@backend/lib/mongodb';
import DownloadLog from '@models/DownloadLog';

export async function GET() {
  try {
    await connectDB();
    
    const downloads = await DownloadLog.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedDownloads = downloads.map(d => ({
      id: d._id.toString(),
      url: d.url,
      platform: d.provider, // Usar provider do modelo
      userId: d.userId?._id?.toString(),
      username: (d.userId as { name?: string })?.name || 'Anônimo',
      createdAt: d.createdAt,
      downloaded_at: d.createdAt, // compatibilidade
    }));

    return NextResponse.json({ downloads: formattedDownloads }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch recent downloads:', error);
    return NextResponse.json({ message: 'Erro ao buscar downloads', error: (error as Error).message }, { status: 500 });
  }
}
