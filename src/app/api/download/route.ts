import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@backend/lib/database';
import ApiKey from '@backend/models/ApiKey';
import { validateMediaUrl } from '@/lib/media/providers';
import { resolveMediaInfo, type ResolvedMediaFormat } from '@/lib/server/mediaResolver';
import { MediaResolverError } from '@/lib/server/mediaResolverError';
import { getBaseUrlFromRequest } from '@/lib/utils';

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
  try {
    await connectDB();
    const apiKeyData = await ApiKey.findOne({ key: apiKey, isActive: true });

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

    // Verificar se expirou
    if (apiKeyData.expiresAt && new Date() > apiKeyData.expiresAt) {
      return NextResponse.json<ApiErrorBody>(
        {
          error: {
            code: 'API_KEY_EXPIRED',
            message: 'Esta chave de API expirou.',
          },
        },
        { status: 401 },
      );
    }

    if (apiKeyData.usageCount >= apiKeyData.usageLimit) {
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

    // Increment usage count before processing the request
    await ApiKey.findByIdAndUpdate(apiKeyData.id, {
      usageCount: apiKeyData.usageCount + 1,
      lastUsedAt: new Date(),
    });

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
  const baseUrl = getBaseUrlFromRequest(request);
  
  // Se tem URL direta (ex: Twitter scraping), passar como parâmetro
  let directDownloadUrl: URL;
  if (format.url) {
    // Para URLs diretas, ainda usar download-direct mas passar a URL direta
    directDownloadUrl = new URL('/api/download-direct', baseUrl);
    directDownloadUrl.searchParams.set('url', url);
    directDownloadUrl.searchParams.set('format', format.format_id);
    directDownloadUrl.searchParams.set('source', format.source);
    directDownloadUrl.searchParams.set('direct_url', format.url); // Passar URL direta
  } else {
    directDownloadUrl = new URL('/api/download-direct', baseUrl);
    directDownloadUrl.searchParams.set('url', url);
    directDownloadUrl.searchParams.set('format', format.format_id);
    directDownloadUrl.searchParams.set('source', format.source);
  }

  return {
    format_id: format.format_id,
    ext: format.ext,
    resolution: format.resolution,
    quality: format.quality,
    vcodec: format.vcodec,
    acodec: format.acodec,
    filesize_approx: format.filesize_approx,
    source: format.source,
    url: format.url, // Preservar URL direta
    download_url: directDownloadUrl.toString(),
  };
}
