/**
 * Endpoint de teste para extractors
 * GET /api/test-extractors?url=VIDEO_URL&platform=youtube|twitter
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const platform = searchParams.get('platform') || 'youtube';

  if (!url) {
    return NextResponse.json(
      {
        error: 'URL é obrigatória. Use ?url=VIDEO_URL&platform=youtube|twitter',
      },
      { status: 400 }
    );
  }

  try {
    let result;
    
    if (platform === 'youtube') {
      const { resolveYouTubeMedia } = await import('@/backend/services/youtube/youtubeOrchestrator');
      result = await resolveYouTubeMedia(url);
    } else if (platform === 'twitter') {
      const { resolveTwitterMedia } = await import('@/backend/services/twitter/twitterOrchestrator');
      result = await resolveTwitterMedia(url);
    } else if (platform === 'instagram') {
      const { resolveInstagramMedia } = await import('@/backend/services/instagram/instagramOrchestrator');
      result = await resolveInstagramMedia(url);
    } else if (platform === 'tiktok') {
      const { resolveTikTokMedia } = await import('@/backend/services/tiktok/tiktokOrchestrator');
      result = await resolveTikTokMedia(url);
    } else {
      return NextResponse.json(
        {
          error: 'Plataforma não suportada. Use youtube, twitter, instagram ou tiktok',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: result.success,
      method: result.method,
      executionTime: `${result.executionTime}ms`,
      data: result.success ? {
        title: result.data?.title,
        formatsCount: result.data?.formats.length || 0,
        formats: result.data?.formats.slice(0, 10).map(f => ({
          format_id: f.format_id,
          resolution: f.resolution,
          ext: f.ext,
          vcodec: f.vcodec,
          acodec: f.acodec,
          hasUrl: !!f.url,
          quality: f.quality,
        })),
        thumbnail: result.data?.thumbnail,
        duration: result.data?.duration,
      } : null,
      error: result.success ? null : {
        code: result.error?.code,
        message: result.error?.message,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro no teste:', error);
    return NextResponse.json(
      {
        error: 'Erro ao testar extractor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
