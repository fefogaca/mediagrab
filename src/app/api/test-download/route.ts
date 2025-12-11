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

  // --- API Key Validation (sem contar uso) ---
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
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
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

    // NOTA: Não incrementamos o usageCount aqui - este é um endpoint de teste
  } catch (error) {
    console.error('Erro ao validar API Key:', error);
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao validar chave de API.',
        },
      },
      { status: 500 },
    );
  }

  // --- URL Validation ---
  if (!url) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'MISSING_URL',
          message: 'Informe uma URL válida.',
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

  // --- Media Resolution (sem contar uso) ---
  try {
    const resolvedInfo = await resolveMediaInfo(normalizedUrl);
    
    // Formatar resposta similar ao endpoint normal
    const baseUrl = getBaseUrlFromRequest(request);
    const processedFormats = resolvedInfo.formats
      .filter((format) => format.format_id)
      .map((format) => {
        const directDownloadUrl = new URL('/api/download-direct', baseUrl);
        directDownloadUrl.searchParams.set('url', normalizedUrl);
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
      });

    const provider = {
      id: resolvedInfo.provider.id,
      label: resolvedInfo.provider.label,
    };

    return NextResponse.json({
      success: true,
      title: resolvedInfo.title,
      provider,
      requested_url: normalizedUrl,
      library: resolvedInfo.library,
      formats: processedFormats,
    });
  } catch (error) {
    if (error instanceof MediaResolverError) {
      return NextResponse.json<ApiErrorBody>(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.code === 'UNSUPPORTED_PROVIDER' ? 415 : 502 },
      );
    }

    console.error('Erro ao resolver mídia:', error);
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'RESOLUTION_ERROR',
          message: 'Erro ao processar a URL fornecida.',
        },
      },
      { status: 500 },
    );
  }
}

