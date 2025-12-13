import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';
import ytdl from 'ytdl-core';

import { validateMediaUrl } from '@/lib/media/providers';
import { getCookiesFilePath } from '@/backend/lib/cookies';

const ytDlpWrap = new YTDlpWrap();
const DEFAULT_FORMAT = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

type StreamSource = 'yt-dlp' | 'ytdl-core';

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const urlParam = searchParams.get('url');
  const formatParam = searchParams.get('format') || DEFAULT_FORMAT;
  const source = (searchParams.get('source') as StreamSource | null) ?? 'yt-dlp';

  if (!urlParam) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'MISSING_URL',
          message: 'Inclua a URL do vídeo para iniciar o download.',
        },
      },
      { status: 400 },
    );
  }

  const validation = validateMediaUrl(urlParam);
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

  const url = validation.normalizedUrl;
  const provider = validation.provider;
  let format = formatParam;

  // Garantir que vídeos sempre tenham áudio fazendo merge quando necessário
  // Se o formato não especificar merge (não contém '+'), fazer merge automático
  if (source === 'yt-dlp' && !format.includes('+') && !format.includes('best')) {
    // Se for um formato específico (ID numérico ou string), fazer merge com bestaudio
    // yt-dlp vai fazer merge automaticamente: formato_video+bestaudio
    // Usar fallback para garantir que sempre funcione
    format = `${format}+bestaudio/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
  }

  try {
    if (source === 'ytdl-core' && provider.id === 'youtube') {
      const nodeStream = ytdl(url, { quality: format });
      const responseStream = toReadableStream(nodeStream);

      return buildStreamResponse(responseStream);
    }

    // Detectar plataforma para usar cookies apropriados
    const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    
    // Obter cookies se disponíveis
    let cookiesPath: string | null = null;
    if (isInstagram || isYouTube) {
      try {
        const platform = isInstagram ? 'instagram' : 'youtube';
        cookiesPath = await getCookiesFilePath(platform);
      } catch (error) {
        console.warn('Erro ao obter cookies:', error);
      }
    }

    // Opções otimizadas para yt-dlp - melhorar performance de download
    const ytDlpOptions = [
      url,
      '-f', format,
      '-o', '-', // Output para stdout (streaming)
      '--no-playlist', // Não baixar playlists
      '--no-warnings', // Reduzir logs
      '--quiet', // Modo silencioso
      '--no-progress', // Não mostrar progresso (melhora performance)
      '--buffer-size', '16K', // Buffer menor para começar mais rápido
      '--http-chunk-size', '10M', // Chunks maiores para melhor throughput
      '--concurrent-fragments', '4', // Download paralelo de fragmentos
      '--retries', '3', // Menos tentativas (mais rápido em caso de erro)
      '--fragment-retries', '3', // Menos tentativas de fragmentos
    ];

    // Adicionar cookies se disponíveis
    if (cookiesPath) {
      ytDlpOptions.push('--cookies', cookiesPath);
    }

    // Adicionar argumentos específicos do YouTube apenas se for YouTube
    if (isYouTube) {
      ytDlpOptions.push('--extractor-args', 'youtube:player_client=android');
    }

    const nodeStream = ytDlpWrap.execStream(ytDlpOptions);
    const responseStream = toReadableStream(nodeStream);
    return buildStreamResponse(responseStream);
  } catch (primaryError) {
    console.error('Falha no stream primário:', primaryError);

    if (provider.id === 'youtube' && source !== 'ytdl-core') {
      try {
        const fallbackStream = ytdl(url, { quality: format });
        const responseStream = toReadableStream(fallbackStream);
        return buildStreamResponse(responseStream);
      } catch (fallbackError) {
        console.error('Falha no fallback ytdl-core:', fallbackError);
      }
    }

    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'STREAM_FAILURE',
          message: 'Não foi possível iniciar o download agora. Tente novamente mais tarde.',
        },
      },
      { status: 502 },
    );
  }
}

function toReadableStream(stream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on('end', () => {
        controller.close();
      });
      stream.on('error', (error) => {
        controller.error(error);
      });
    },
    cancel() {
      if ('destroy' in stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    },
  });
}

function buildStreamResponse(stream: ReadableStream<Uint8Array>) {
  const filename = 'media-download.mp4';
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache', // Não cachear para garantir dados atualizados
      'X-Content-Type-Options': 'nosniff',
      // Headers para melhorar performance de streaming
      'Accept-Ranges': 'bytes',
    },
  });
}