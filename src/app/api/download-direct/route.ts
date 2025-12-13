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

  let url = validation.normalizedUrl;
  const provider = validation.provider;
  let format = formatParam;

  // Converter YouTube Shorts para formato normal do YouTube (yt-dlp funciona melhor assim)
  if (url.includes('youtube.com/shorts/')) {
    const videoId = url.match(/\/shorts\/([^/?]+)/)?.[1];
    if (videoId) {
      url = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`[YouTube Shorts] Convertido para: ${url}`);
    }
  }

  // Garantir que vídeos sempre tenham áudio fazendo merge quando necessário
  // Para Twitter/X: formatos HLS geralmente são apenas vídeo, precisam de merge com áudio
  const isTwitter = url.includes('twitter.com') || url.includes('x.com');
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  if (source === 'yt-dlp') {
    // Para Twitter/X: usar formato otimizado
    if (isTwitter) {
      // Twitter: se for formato HLS específico, fazer merge com bestaudio
      // Se não for HLS, tentar best que já tem vídeo+áudio primeiro
      if (format.startsWith('hls-')) {
        // Formato HLS específico - fazer merge com bestaudio
        format = `${format}+bestaudio/bestvideo+bestaudio/best`;
      } else {
        // Tentar best que já tem vídeo+áudio primeiro, depois fallback para merge
        format = 'best[vcodec!=none][acodec!=none]/bestvideo+bestaudio/best';
      }
    }
    // Para Instagram: priorizar formatos com vídeo+áudio já combinados (mais rápido, sem re-encoding)
    else if (isInstagram) {
      // Instagram: usar best que já tem vídeo+áudio primeiro (evita merge e re-encoding lento)
      // Priorizar formatos que já têm tudo combinado para máxima velocidade
      format = 'best[height<=1080][vcodec!=none][acodec!=none]/best[height<=1080]/best';
    }
    // Para YouTube: garantir merge apenas quando necessário
    else if (isYouTube) {
      // YouTube: formato 18 já tem vídeo+áudio, usar direto (não fazer merge desnecessário)
      if (format === '18') {
        format = '18'; // Manter formato 18 como está (já tem vídeo+áudio)
      }
      // Outros formatos numéricos podem não ter áudio, fazer merge
      else if (/^\d+$/.test(format) && !format.includes('+')) {
        format = `${format}+bestaudio/bestvideo+bestaudio/best`;
      }
      // Se for formato específico sem merge, fazer merge automático
      else if (!format.includes('+') && !format.includes('best') && !format.startsWith('hls-') && !format.startsWith('dash-')) {
        format = `${format}+bestaudio/bestvideo+bestaudio/best`;
      }
      // Se já tem best, garantir que tem vídeo+áudio
      else if (format.includes('best') && !format.includes('+')) {
        format = 'bestvideo+bestaudio/best';
      }
      // Se não se encaixa em nenhum caso, usar best com merge
      else if (!format.includes('+')) {
        format = 'bestvideo+bestaudio/best';
      }
    }
    // Para formatos numéricos (como 18 do YouTube), fazer merge se não tiver áudio
    else if (/^\d+$/.test(format) && !format.includes('+')) {
      // Formato numérico específico - fazer merge com bestaudio
      format = `${format}+bestaudio/bestvideo+bestaudio/best`;
    }
    // Para outros formatos sem merge, fazer merge automático
    else if (!format.includes('+') && !format.includes('best') && !format.startsWith('hls-') && !format.startsWith('dash-')) {
      // Se for um formato específico (ID numérico ou string), fazer merge com bestaudio
      // yt-dlp vai fazer merge automaticamente: formato_video+bestaudio
      format = `${format}+bestaudio/bestvideo+bestaudio/best`;
    }
  }

  try {
    if (source === 'ytdl-core' && provider.id === 'youtube') {
      const nodeStream = ytdl(url, { quality: format });
      const responseStream = toReadableStream(nodeStream);

      return buildStreamResponse(responseStream);
    }

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

    // Opções otimizadas para yt-dlp - melhorar performance e reduzir latência
    // Configurações para suportar múltiplos usuários simultâneos
    const ytDlpOptions = [
      url,
      '-f', format,
      '-o', '-', // Output para stdout (streaming)
      '--no-playlist', // Não baixar playlists
      '--no-warnings', // Reduzir logs
      '--quiet', // Modo silencioso
      '--no-progress', // Não mostrar progresso (melhora performance)
      '--buffer-size', isInstagram ? '512K' : (isTwitter ? '256K' : '128K'), // Buffer maior para Instagram/Twitter
      '--http-chunk-size', isInstagram ? '32M' : (isTwitter ? '24M' : '16M'), // Chunks maiores para Instagram/Twitter
      '--concurrent-fragments', isInstagram ? '10' : (isTwitter ? '8' : '6'), // Mais fragmentos para Instagram/Twitter
      '--retries', '3', // Reduzir tentativas para começar mais rápido (era 5)
      '--fragment-retries', '3', // Reduzir tentativas de fragmentos (era 5)
      '--extractor-retries', '2', // Reduzir tentativas do extrator (era 3)
      '--ignore-errors', // Continuar mesmo com erros menores
      '--no-check-certificate', // Não verificar certificados
      '--socket-timeout', isTwitter ? '60' : '30', // Timeout maior para Twitter (60s) devido a lentidão da API
      // Removido --limit-rate '0' pois causa erro "rate limit must be positive"
      '--no-part', // Não salvar arquivos parciais (melhora performance)
      '--no-mtime', // Não atualizar mtime (melhora performance)
    ];
    
    // Para Twitter, Instagram e YouTube, garantir que o merge funcione corretamente
    if (isTwitter || isInstagram || isYouTube) {
      // Sempre adicionar merge-output-format para garantir MP4
      ytDlpOptions.push(
        '--merge-output-format', 'mp4', // Forçar formato MP4 para merge
      );
      
      // Para Instagram: não usar postprocessor se o formato já tem vídeo+áudio (evita processamento desnecessário)
      if (isInstagram) {
        // Não adicionar postprocessor-args se o formato já tem vídeo+áudio combinado
        // Isso evita processamento desnecessário e preserva o vídeo original
        // O yt-dlp vai copiar automaticamente se não precisar de merge
      } else if (isTwitter) {
        // Para Twitter: tentar copiar codec primeiro, re-encodar se necessário
        ytDlpOptions.push(
          '--postprocessor-args', 'ffmpeg:-c:v copy -c:a aac -b:a 192k -movflags +faststart -threads 2' // Copiar vídeo, re-encodar áudio se necessário
        );
      } else if (isYouTube) {
        // Para YouTube: se for formato 18, não precisa de postprocessor (já tem vídeo+áudio)
        // Para outros formatos, copiar codecs quando possível
        if (format !== '18') {
          ytDlpOptions.push(
            '--postprocessor-args', 'ffmpeg:-c:v copy -c:a copy -movflags +faststart' // Copiar ambos codecs quando possível
          );
        }
      }
    } else {
      // Para outras plataformas, usar ffmpeg como downloader externo se disponível
      ytDlpOptions.push(
        '--external-downloader', 'ffmpeg',
        '--external-downloader-args', 'ffmpeg:-loglevel error -nostats'
      );
    }

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
      // Iniciar stream imediatamente para reduzir latência
      nodeStream = ytDlpWrap.execStream(ytDlpOptions);
    } catch (streamError: any) {
      console.error('Erro ao criar stream do yt-dlp:', streamError);
      
      // Se o erro for sobre formato não disponível ou qualquer erro de formato, tentar com best
      const isFormatError = streamError?.message?.includes('Requested format is not available') || 
          streamError?.cause?.message?.includes('Requested format is not available') ||
          streamError?.message?.includes('format is not available') ||
          streamError?.message?.includes('Unable to download') ||
          streamError?.message?.includes('format selection') ||
          streamError?.message?.includes('ERROR') ||
          streamError?.cause?.message?.includes('ERROR');
      
      if (isFormatError) {
        console.log('Formato não disponível ou erro de formato, tentando com best...');
        try {
          // Fallback otimizado por plataforma - usar formatos mais simples e confiáveis
          let fallbackFormat: string;
          if (isTwitter) {
            // Twitter: SEMPRE usar bestvideo+bestaudio para garantir merge
            fallbackFormat = 'bestvideo+bestaudio/best';
          } else if (isInstagram) {
            // Instagram: usar best que já tem vídeo+áudio (mais rápido, sem merge)
            fallbackFormat = 'best[height<=1080][vcodec!=none][acodec!=none]/best[height<=1080]/best';
          } else if (isYouTube) {
            // YouTube: usar best com merge garantido
            fallbackFormat = 'bestvideo+bestaudio/best';
          } else {
            // Outras plataformas: fallback universal (formato simples)
            fallbackFormat = 'bestvideo+bestaudio/best';
          }
          
          const fallbackOptions = [
            url,
            '-f', fallbackFormat,
            '-o', '-',
            '--no-playlist',
            '--quiet',
            '--no-progress',
            '--buffer-size', isInstagram ? '512K' : (isTwitter ? '256K' : '128K'),
            '--http-chunk-size', isInstagram ? '32M' : (isTwitter ? '24M' : '16M'),
            '--concurrent-fragments', isInstagram ? '10' : (isTwitter ? '8' : '6'),
            '--retries', '3',
            '--fragment-retries', '3',
            '--extractor-retries', '2',
            '--ignore-errors',
            '--merge-output-format', 'mp4',
            '--socket-timeout', isTwitter ? '60' : '30',
            '--no-part',
            '--no-mtime',
            // Removido --limit-rate '0' pois causa erro "rate limit must be positive"
          ];
          
          // Adicionar opções de merge específicas por plataforma
          if (isInstagram) {
            // Instagram: não adicionar postprocessor se não precisar de merge (mais rápido)
            // O yt-dlp vai copiar automaticamente quando possível
          } else if (isTwitter) {
            fallbackOptions.push(
              '--postprocessor-args', 'ffmpeg:-c:v copy -c:a aac -b:a 192k -movflags +faststart -threads 2'
            );
          } else if (isYouTube) {
            // YouTube: copiar codecs quando possível
            fallbackOptions.push(
              '--postprocessor-args', 'ffmpeg:-c:v copy -c:a copy -movflags +faststart'
            );
          }
          
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
    let streamHasError = false;
    let streamError: Error | null = null;
    
    nodeStream.on('error', (error) => {
      console.error('Erro no stream do yt-dlp:', error);
      streamHasError = true;
      streamError = error instanceof Error ? error : new Error(String(error));
    });
    
    // Verificar se o stream está realmente funcionando
    const responseStream = toReadableStream(nodeStream, (error) => {
      // Callback de erro do stream
      streamHasError = true;
      streamError = error;
    });
    
    return buildStreamResponse(responseStream);
  } catch (primaryError) {
    console.error('Falha no stream primário:', primaryError);

    // Para YouTube, tentar fallback com ytdl-core se yt-dlp falhar
    if (provider.id === 'youtube' && source !== 'ytdl-core') {
      try {
        console.log('Tentando fallback ytdl-core para YouTube...');
        // ytdl-core funciona melhor com formatos numéricos simples
        const ytdlFormat = format.includes('+') ? 'highest' : format;
        const fallbackStream = ytdl(url, { quality: ytdlFormat });
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

function toReadableStream(stream: NodeJS.ReadableStream, onError?: (error: Error) => void): ReadableStream<Uint8Array> {
  let isCancelled = false;
  let hasReceivedData = false;
  let dataTimeout: NodeJS.Timeout | null = null;
  
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Timeout para detectar se o stream não está enviando dados (30 segundos)
      dataTimeout = setTimeout(() => {
        if (!hasReceivedData && !isCancelled) {
          console.error('Stream timeout: nenhum dado recebido em 30 segundos');
          const timeoutError = new Error('Stream timeout: nenhum dado recebido');
          if (onError) onError(timeoutError);
          if (!isCancelled) {
            try {
              controller.error(timeoutError);
            } catch (error) {
              console.error('Erro ao reportar timeout:', error);
            }
          }
        }
      }, 30000);
      
      stream.on('data', (chunk: Buffer) => {
        hasReceivedData = true;
        if (dataTimeout) {
          clearTimeout(dataTimeout);
          dataTimeout = null;
        }
        
        if (!isCancelled) {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch (error) {
            console.error('Erro ao enfileirar chunk:', error);
            if (onError && error instanceof Error) onError(error);
            if (!isCancelled) {
              controller.error(error);
            }
          }
        }
      });
      
      stream.on('end', () => {
        if (dataTimeout) {
          clearTimeout(dataTimeout);
          dataTimeout = null;
        }
        if (!isCancelled) {
          try {
            controller.close();
          } catch (error) {
            console.error('Erro ao fechar stream:', error);
          }
        }
      });
      
      stream.on('error', (error) => {
        if (dataTimeout) {
          clearTimeout(dataTimeout);
          dataTimeout = null;
        }
        if (!isCancelled) {
          console.error('Erro no stream:', error);
          const streamError = error instanceof Error ? error : new Error(String(error));
          if (onError) onError(streamError);
          try {
            controller.error(streamError);
          } catch (closeError) {
            console.error('Erro ao reportar erro do stream:', closeError);
          }
        }
      });
    },
    cancel() {
      isCancelled = true;
      if (dataTimeout) {
        clearTimeout(dataTimeout);
        dataTimeout = null;
      }
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
  // Gerar nome de arquivo único para evitar conflitos em downloads simultâneos
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `media-download-${timestamp}-${random}.mp4`;
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'video/mp4', // Usar video/mp4 para melhor compatibilidade
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      // Headers para melhorar performance de streaming e reduzir latência
      'Accept-Ranges': 'bytes',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
      // Headers adicionais para garantir que o download funcione e otimizar para múltiplos usuários
      'X-Accel-Buffering': 'no', // Desabilitar buffering do nginx (se aplicável)
      'X-Content-Duration': '0', // Indicar que é um stream
      'X-Accel-Limit-Rate': '0', // Sem limite de taxa no nginx (se aplicável)
      // Headers para reduzir latência e melhorar início do download
      'X-Accel-Read-Time': '0', // Sem timeout de leitura no nginx
      'X-Accel-Send-Time': '0', // Sem timeout de envio no nginx
    },
  });
}
