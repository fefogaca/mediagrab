import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';
import ytdl from 'ytdl-core';

import { validateMediaUrl } from '@/lib/media/providers';

import { detectMediaProvider, type MediaProviderId } from '@/lib/media/providers';

const ytDlpWrap = new YTDlpWrap();
const DEFAULT_FORMAT = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

// User agents modernos para evitar detecção
const USER_AGENTS = {
  default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  tiktok: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  twitter: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function getYtDlpOptions(providerId: MediaProviderId): string[] {
  const options: string[] = [];
  
  // User agent específico por plataforma
  const userAgent = USER_AGENTS[providerId as keyof typeof USER_AGENTS] || USER_AGENTS.default;
  options.push('--user-agent', userAgent);
  
  // Configurações gerais (removendo opções que podem causar problemas)
  options.push('--no-warnings');
  options.push('--quiet');
  // --no-call-home foi removido pois está deprecated no yt-dlp
  
  // Configurações específicas por plataforma (apenas as essenciais)
  switch (providerId) {
    case 'youtube':
      options.push('--extractor-args', 'youtube:player_client=android,web');
      break;
    case 'instagram':
      // Instagram funciona melhor sem opções extras
      break;
    case 'tiktok':
      // TikTok funciona melhor sem opções extras
      break;
    case 'twitter':
      // Twitter funciona melhor sem opções extras
      break;
  }
  
  return options;
}

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
  const format = formatParam;

  // Função auxiliar para verificar se o erro é de formato não disponível
  const isFormatNotAvailableError = (error: unknown): boolean => {
    const errorStr = String(error);
    const errorCause = (error as any)?.cause;
    const errorCauseStr = errorCause ? String(errorCause) : '';
    const errorStderr = (error as any)?.stderr || '';
    
    return (
      errorStr.includes('not available') || 
      errorStr.includes('Requested format is not available') ||
      errorCauseStr.includes('not available') ||
      errorCauseStr.includes('Requested format is not available') ||
      errorStderr.includes('not available') ||
      errorStderr.includes('Requested format is not available')
    );
  };

  try {
    if (source === 'ytdl-core' && provider.id === 'youtube') {
      const nodeStream = ytdl(url, { quality: format });
      const responseStream = toReadableStream(nodeStream);
      return buildStreamResponse(responseStream);
    }

    const options = getYtDlpOptions(provider.id);
    
    // Tentar o formato solicitado primeiro
    try {
      const nodeStream = ytDlpWrap.execStream([...options, url, '-f', format, '-o', '-']);
      
      // Para Instagram e YouTube, verificar se o stream falha imediatamente
      // Aguardar o primeiro chunk ou erro antes de retornar a resposta
      if (provider.id === 'instagram' || provider.id === 'youtube') {
        const streamCheck = await new Promise<{ success: boolean; error?: Error }>((resolve) => {
          let hasData = false;
          let streamError: Error | null = null;
          let timeout: NodeJS.Timeout;
          let resolved = false;
          
          const cleanup = () => {
            if (resolved) return;
            resolved = true;
            try {
              nodeStream.removeListener('data', onData);
              nodeStream.removeListener('error', onError);
              nodeStream.removeListener('close', onClose);
              clearTimeout(timeout);
            } catch (e) {
              // Ignorar erros de cleanup
            }
          };
          
          const onData = (chunk: any) => {
            if (resolved) return;
            hasData = true;
            cleanup();
            resolve({ success: true });
          };
          
          const onError = (error: Error) => {
            if (resolved) return;
            streamError = error;
            cleanup();
            resolve({ success: false, error });
          };
          
          const onClose = () => {
            if (resolved) return;
            if (!hasData && !streamError) {
              // Stream fechou sem dados nem erro - pode ser um problema
              cleanup();
              resolve({ success: false, error: new Error('Stream closed without data') });
            }
          };
          
          nodeStream.once('data', onData);
          nodeStream.once('error', onError);
          nodeStream.once('close', onClose);
          
          // Timeout aumentado para 2000ms para detectar erros do yt-dlp
          timeout = setTimeout(() => {
            if (!resolved) {
              if (!hasData && !streamError) {
                cleanup();
                // Se não recebeu dados nem erro em 2s, pode ser um problema, mas tentar continuar
                resolve({ success: true });
              }
            }
          }, 2000);
        });
        
        if (!streamCheck.success && streamCheck.error) {
          const errorMsg = streamCheck.error.message || String(streamCheck.error);
          console.log(`[${provider.id}] Erro detectado no stream, acionando fallback:`, errorMsg);
          throw streamCheck.error;
        }
      }
      
      const responseStream = toReadableStream(nodeStream);
      return buildStreamResponse(responseStream);
    } catch (streamError) {
      // Para Instagram e YouTube, sempre tentar fallback se houver qualquer erro
      if (provider.id === 'instagram' || provider.id === 'youtube') {
        console.log(`[${provider.id}] Erro no stream primário, acionando fallback:`, streamError);
        throw new Error('FORMAT_NOT_AVAILABLE');
      }
      // Se for erro de formato não disponível, lançar para o catch externo tratar
      if (isFormatNotAvailableError(streamError)) {
        throw new Error('FORMAT_NOT_AVAILABLE');
      }
      // Se for outro erro, relançar
      throw streamError;
    }
  } catch (primaryError) {
    console.error('Falha no stream primário:', primaryError);
    
    // Verificar se o erro indica que o formato não está disponível
    const isFormatNotAvailable = isFormatNotAvailableError(primaryError) || 
                                 String(primaryError).includes('FORMAT_NOT_AVAILABLE');

    // Se o formato específico não está disponível, tentar formato padrão
    if (format !== DEFAULT_FORMAT && isFormatNotAvailable) {
      try {
        console.log(`Formato ${format} não disponível, tentando formato padrão...`);
        const options = getYtDlpOptions(provider.id);
        const nodeStream = ytDlpWrap.execStream([...options, url, '-f', DEFAULT_FORMAT, '-o', '-']);
        const responseStream = toReadableStream(nodeStream);
        return buildStreamResponse(responseStream);
      } catch (fallbackError) {
        console.error('Falha no fallback com formato padrão:', fallbackError);
      }
    }

    // Para Instagram, sempre tentar múltiplos fallbacks quando houver erro
    if (provider.id === 'instagram') {
      try {
        console.log('Tentando formatos alternativos para Instagram...');
        const options = getYtDlpOptions(provider.id);
        // Lista extensa de formatos para tentar
        const fallbackFormats = [
          'best',
          'bestvideo+bestaudio/best',
          'bestvideo/best',
          'bestaudio/best',
          'worst',
          'worstvideo+worstaudio/worst',
          'best[ext=mp4]',
          'best[ext=webm]',
          'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
          'bestvideo[height<=1080]',
          'bestvideo[height<=720]',
          'bestvideo[height<=480]',
          'bestvideo[height<=360]',
        ];
        
        for (const fallbackFormat of fallbackFormats) {
          try {
            console.log(`Instagram: Tentando formato ${fallbackFormat}...`);
            const nodeStream = ytDlpWrap.execStream([...options, url, '-f', fallbackFormat, '-o', '-']);
            
            // Verificar se o stream falha imediatamente
            const streamCheck = await new Promise<{ success: boolean; error?: Error }>((resolve) => {
              let hasData = false;
              let streamError: Error | null = null;
              let timeout: NodeJS.Timeout;
              let resolved = false;
              
              const cleanup = () => {
                if (resolved) return;
                resolved = true;
                try {
                  nodeStream.removeListener('data', onData);
                  nodeStream.removeListener('error', onError);
                  clearTimeout(timeout);
                } catch (e) {
                  // Ignorar erros de cleanup
                }
              };
              
              const onData = () => {
                if (resolved) return;
                hasData = true;
                cleanup();
                resolve({ success: true });
              };
              
              const onError = (error: Error) => {
                if (resolved) return;
                streamError = error;
                cleanup();
                resolve({ success: false, error });
              };
              
              nodeStream.once('data', onData);
              nodeStream.once('error', onError);
              
              timeout = setTimeout(() => {
                if (!resolved) {
                  if (!hasData && !streamError) {
                    cleanup();
                    resolve({ success: true });
                  }
                }
              }, 2000);
            });
            
            if (!streamCheck.success && streamCheck.error) {
              console.log(`Instagram: Formato ${fallbackFormat} falhou:`, streamCheck.error.message);
              continue;
            }
            
            const responseStream = toReadableStream(nodeStream);
            return buildStreamResponse(responseStream);
          } catch (formatError) {
            // Verificar se é erro de formato não disponível
            if (isFormatNotAvailableError(formatError)) {
              console.log(`Instagram: Formato ${fallbackFormat} não disponível, tentando próximo...`);
              continue;
            }
            // Se for outro erro, pode ser um problema temporário, tentar próximo formato
            console.log(`Instagram: Formato ${fallbackFormat} falhou com erro diferente, tentando próximo...`);
            continue;
          }
        }
      } catch (instagramFallbackError) {
        console.error('Falha no fallback do Instagram:', instagramFallbackError);
      }
    }

    // Para YouTube (incluindo Shorts), sempre tentar múltiplos fallbacks quando houver erro
    if (provider.id === 'youtube') {
      try {
        // Primeiro tentar ytdl-core se ainda não tentou
        if (source !== 'ytdl-core') {
          try {
            console.log('YouTube: Tentando ytdl-core como fallback...');
            const fallbackStream = ytdl(url, { quality: 'highest' });
            const responseStream = toReadableStream(fallbackStream);
            return buildStreamResponse(responseStream);
          } catch (fallbackError) {
            console.log('YouTube: ytdl-core falhou, tentando formatos alternativos do yt-dlp...');
          }
        }

        // Sempre tentar formatos alternativos do yt-dlp para YouTube
        console.log('YouTube: Tentando formatos alternativos do yt-dlp...');
        const options = getYtDlpOptions(provider.id);
        const fallbackFormats = [
          'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          'bestvideo+bestaudio/best',
          'best[height<=1080]',
          'best[height<=720]',
          'best[height<=480]',
          'best',
          'worst'
        ];
        
        for (const fallbackFormat of fallbackFormats) {
          try {
            console.log(`YouTube: Tentando formato ${fallbackFormat}...`);
            const nodeStream = ytDlpWrap.execStream([...options, url, '-f', fallbackFormat, '-o', '-']);
            
            // Verificar se o stream falha imediatamente
            const streamCheck = await new Promise<{ success: boolean; error?: Error }>((resolve) => {
              let hasData = false;
              let streamError: Error | null = null;
              let timeout: NodeJS.Timeout;
              let resolved = false;
              
              const cleanup = () => {
                if (resolved) return;
                resolved = true;
                try {
                  nodeStream.removeListener('data', onData);
                  nodeStream.removeListener('error', onError);
                  clearTimeout(timeout);
                } catch (e) {
                  // Ignorar erros de cleanup
                }
              };
              
              const onData = () => {
                if (resolved) return;
                hasData = true;
                cleanup();
                resolve({ success: true });
              };
              
              const onError = (error: Error) => {
                if (resolved) return;
                streamError = error;
                cleanup();
                resolve({ success: false, error });
              };
              
              nodeStream.once('data', onData);
              nodeStream.once('error', onError);
              
              timeout = setTimeout(() => {
                if (!resolved) {
                  if (!hasData && !streamError) {
                    cleanup();
                    resolve({ success: true });
                  }
                }
              }, 2000);
            });
            
            if (!streamCheck.success && streamCheck.error) {
              console.log(`YouTube: Formato ${fallbackFormat} falhou:`, streamCheck.error.message);
              continue;
            }
            
            const responseStream = toReadableStream(nodeStream);
            return buildStreamResponse(responseStream);
          } catch (formatError) {
            // Verificar se é erro de formato não disponível
            if (isFormatNotAvailableError(formatError)) {
              console.log(`YouTube: Formato ${fallbackFormat} não disponível, tentando próximo...`);
              continue;
            }
            // Se for outro erro, pode ser um problema temporário, tentar próximo formato
            console.log(`YouTube: Formato ${fallbackFormat} falhou com erro diferente, tentando próximo...`);
            continue;
          }
        }
      } catch (youtubeFallbackError) {
        console.error('YouTube: Falha no fallback completo:', youtubeFallbackError);
      }
    }

    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: 'STREAM_FAILURE',
          message: 'Não foi possível iniciar o download agora. O formato solicitado pode não estar disponível. Tente novamente mais tarde.',
        },
      },
      { status: 502 },
    );
  }
}

function toReadableStream(stream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let hasEnqueued = false;
      
      stream.on('data', (chunk) => {
        try {
          hasEnqueued = true;
          controller.enqueue(chunk);
        } catch (error) {
          console.error('Erro ao enfileirar chunk:', error);
          controller.error(error);
        }
      });
      
      stream.on('end', () => {
        try {
          controller.close();
        } catch (error) {
          console.error('Erro ao fechar stream:', error);
        }
      });
      
      stream.on('error', (error) => {
        console.error('Erro no stream:', error);
        try {
          // Verificar se é erro de formato não disponível
          const errorStr = String(error);
          const errorCause = (error as any)?.cause;
          const errorCauseStr = errorCause ? String(errorCause) : '';
          const errorStderr = (error as any)?.stderr || '';
          
          const isFormatError = 
            errorStr.includes('not available') || 
            errorStr.includes('Requested format is not available') ||
            errorCauseStr.includes('not available') ||
            errorCauseStr.includes('Requested format is not available') ||
            errorStderr.includes('not available') ||
            errorStderr.includes('Requested format is not available');
          
          if (isFormatError) {
            // Criar um erro mais específico para ser capturado pelo fallback
            const formatError = new Error('FORMAT_NOT_AVAILABLE');
            (formatError as any).cause = error;
            (formatError as any).stderr = errorStderr;
            controller.error(formatError);
          } else {
            controller.error(error);
          }
        } catch (e) {
          controller.error(error);
        }
      });
      
      stream.on('close', () => {
        // Se o stream fechar sem dados, pode ser um problema
        if (!hasEnqueued) {
          console.warn('Stream fechou sem enviar dados');
        }
      });
    },
    cancel() {
      try {
        if ('destroy' in stream && typeof stream.destroy === 'function') {
          stream.destroy();
        }
      } catch (error) {
        console.error('Erro ao cancelar stream:', error);
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
    },
  });
}