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
  // Para Twitter/X: formatos HLS geralmente são apenas vídeo, precisam de merge com áudio
  const isTwitter = url.includes('twitter.com') || url.includes('x.com');
  
  if (source === 'yt-dlp') {
    // Se for formato HLS do Twitter sem áudio, fazer merge automático
    if (isTwitter && format.startsWith('hls-') && !format.includes('+')) {
      // Para Twitter, fazer merge: formato_video+bestaudio
      // O yt-dlp vai fazer merge automaticamente quando encontrar o formato com '+'
      format = `${format}+bestaudio/best[ext=mp4]/best`;
    }
    // Se for formato DASH do Instagram, pode precisar de merge também
    else if (format.startsWith('dash-') && !format.includes('+')) {
      // Para DASH, tentar merge se não tiver áudio
      format = `${format}+bestaudio/best[ext=mp4]/best`;
    }
    // Para formatos numéricos (como 18 do YouTube), fazer merge se não tiver áudio
    else if (/^\d+$/.test(format) && !format.includes('+')) {
      // Formato numérico específico - fazer merge com bestaudio
      format = `${format}+bestaudio/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
    }
    // Para outros formatos sem merge, fazer merge automático
    else if (!format.includes('+') && !format.includes('best') && !format.startsWith('hls-') && !format.startsWith('dash-')) {
      // Se for um formato específico (ID numérico ou string), fazer merge com bestaudio
      // yt-dlp vai fazer merge automaticamente: formato_video+bestaudio
      format = `${format}+bestaudio/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
    }
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
      '--buffer-size', '64K', // Buffer maior para melhor estabilidade
      '--http-chunk-size', '10M', // Chunks maiores para melhor throughput
      '--concurrent-fragments', '4', // Download paralelo de fragmentos
      '--retries', '5', // Mais tentativas para melhor confiabilidade
      '--fragment-retries', '5', // Mais tentativas de fragmentos
      '--extractor-retries', '3', // Tentativas do extrator
      '--ignore-errors', // Continuar mesmo com erros menores
      '--no-check-certificate', // Não verificar certificados (pode ajudar em alguns casos)
    ];

    // Adicionar cookies se disponíveis
    if (cookiesPath) {
      ytDlpOptions.push('--cookies', cookiesPath);
    }

    // Adicionar argumentos específicos do YouTube apenas se for YouTube
    if (isYouTube) {
      ytDlpOptions.push('--extractor-args', 'youtube:player_client=android');
    }

    let nodeStream: NodeJS.ReadableStream;
    try {
      nodeStream = ytDlpWrap.execStream(ytDlpOptions);
    } catch (streamError: any) {
      console.error('Erro ao criar stream do yt-dlp:', streamError);
      
      // Se o erro for sobre formato não disponível, tentar com best
      if (streamError?.message?.includes('Requested format is not available') || 
          streamError?.cause?.message?.includes('Requested format is not available') ||
          streamError?.message?.includes('format is not available')) {
        console.log('Formato não disponível, tentando com best...');
        try {
          // Para Twitter, garantir merge de áudio
          const fallbackFormat = isTwitter 
            ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
          
          const fallbackOptions = [
            url,
            '-f', fallbackFormat,
            '-o', '-',
            '--no-playlist',
            '--quiet',
            '--no-progress',
            '--buffer-size', '64K',
            '--http-chunk-size', '10M',
            '--concurrent-fragments', '4',
            '--retries', '5',
            '--fragment-retries', '5',
            '--extractor-retries', '3',
            '--ignore-errors',
          ];
          
          if (cookiesPath) {
            fallbackOptions.push('--cookies', cookiesPath);
          }
          
          if (isYouTube) {
            fallbackOptions.push('--extractor-args', 'youtube:player_client=android');
          }
          
          nodeStream = ytDlpWrap.execStream(fallbackOptions);
        } catch (fallbackError) {
          console.error('Falha no fallback best:', fallbackError);
          throw streamError; // Re-throw o erro original
        }
      } else {
        throw streamError;
      }
    }
    
    // Adicionar listener de erro antes de converter
    nodeStream.on('error', (error) => {
      console.error('Erro no stream do yt-dlp:', error);
    });
    
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
  let isCancelled = false;
  
  return new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on('data', (chunk: Buffer) => {
        if (!isCancelled) {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch (error) {
            console.error('Erro ao enfileirar chunk:', error);
            if (!isCancelled) {
              controller.error(error);
            }
          }
        }
      });
      
      stream.on('end', () => {
        if (!isCancelled) {
          try {
            controller.close();
          } catch (error) {
            console.error('Erro ao fechar stream:', error);
          }
        }
      });
      
      stream.on('error', (error) => {
        if (!isCancelled) {
          console.error('Erro no stream:', error);
          try {
            controller.error(error);
          } catch (closeError) {
            console.error('Erro ao reportar erro do stream:', closeError);
          }
        }
      });
    },
    cancel() {
      isCancelled = true;
      if ('destroy' in stream && typeof stream.destroy === 'function') {
        try {
          stream.destroy();
        } catch (error) {
          console.error('Erro ao destruir stream:', error);
        }
      }
    },
  });
}

function buildStreamResponse(stream: ReadableStream<Uint8Array>) {
  const filename = 'media-download.mp4';
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream', // Voltar para octet-stream para compatibilidade
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      // Headers para melhorar performance de streaming
      'Accept-Ranges': 'bytes',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
      // Headers adicionais para garantir que o download funcione
      'X-Accel-Buffering': 'no', // Desabilitar buffering do nginx (se aplicável)
    },
  });
}