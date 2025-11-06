import { NextRequest, NextResponse } from 'next/server';

import { openDb } from '@/lib/database';
import { validateMediaUrl } from '@/lib/media/providers';
import {
  MediaResolverError,
  resolveMediaInfo,
  type ResolvedMediaFormat,
} from '@/lib/server/mediaResolver';

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const apiKey = searchParams.get('apikey');

  if (!apiKey) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'MISSING_API_KEY',
          message: 'Informe uma chave de API válida para usar este endpoint.',
        },
      },
      { status: 401 },
    );
  }

  // --- API Key Validation & Usage Check ---
  const db = await openDb();
  const apiKeyData = await db.get('SELECT * FROM api_keys WHERE key = ?', apiKey);

  if (!apiKeyData) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'INVALID_API_KEY',
          message: 'Esta chave de API não foi encontrada ou está inativa.',
        },
      },
      { status: 401 },
    );
  }

  if (apiKeyData.usage_count >= apiKeyData.usage_limit) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'USAGE_LIMIT_EXCEEDED',
          message: 'Você atingiu o limite de requisições da sua chave de API.',
        },
      },
      { status: 429 },
    );
  }
  if (!url) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'MISSING_URL',
          message: 'Inclua a URL do vídeo nos parâmetros da requisição.',
        },
      },
      { status: 400 },
    );
  }

  const validation = validateMediaUrl(url);
  if (!validation.ok) {
    const status = validation.reason === 'INVALID_URL' ? 400 : 415;
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: validation.reason,
          message: validation.message,
        },
      },
      { status },
    );
  }

  const normalizedUrl = validation.normalizedUrl;

  try {
    // Increment usage count before processing the request
    await db.run('UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = ?', apiKeyData.id);
    const mediaInfo = await resolveMediaInfo(normalizedUrl);

    const processedFormats = mediaInfo.formats
      .filter((format) => format.format_id)
      .map((format) => buildDownloadFormat(request, normalizedUrl, format));

    const provider = {
      id: mediaInfo.provider.id,
      label: mediaInfo.provider.label,
    };

    return NextResponse.json({
      title: mediaInfo.title,
      provider,
      requested_url: normalizedUrl,
      library: mediaInfo.library,
      formats: processedFormats,
    });
  } catch (error) {
    if (error instanceof MediaResolverError) {
      const status = error.code === 'UNSUPPORTED_PROVIDER' ? 415 : 502;
      return NextResponse.json<ApiErrorBody>(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status },
      );
    }

  console.error('Falha ao preparar download:', error);
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Não foi possível concluir o download agora. Tente novamente em breve.',
        },
      },
      { status: 500 },
    );
  }
}

function buildDownloadFormat(
  request: NextRequest,
  url: string,
  format: ResolvedMediaFormat,
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin;
  const directDownloadUrl = new URL('/api/download-direct', baseUrl);
  directDownloadUrl.searchParams.set('url', url);
  directDownloadUrl.searchParams.set('format', format.format_id);
  directDownloadUrl.searchParams.set('source', format.source);

  return {
    format_id: format.format_id,
    ext: format.ext,
    resolution: format.resolution,
    quality: format.quality,
    vcodec: format.vcodec,
    acodec: format.acodec,
    filesize_approx: format.filesize_approx,
    source: format.source,
    download_url: directDownloadUrl.toString(),
  };
}
