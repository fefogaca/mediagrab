import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { validateMediaUrl } from '@/lib/media/providers';

import { detectMediaProvider, type MediaProviderId } from '@/lib/media/providers';

const DEFAULT_INSTAGRAM_COOKIES = path.resolve(process.cwd(), 'private/instagram_cookies.txt');
const DEFAULT_YOUTUBE_COOKIES = path.resolve(process.cwd(), 'private/youtube_cookies.txt');

function configureCookies(envPath: string | undefined, defaultPath: string) {
  const cookiesPath = envPath
    ? path.resolve(process.cwd(), envPath)
    : defaultPath;
  const hasCookies = fs.existsSync(cookiesPath);
  return { cookiesPath, hasCookies };
}

function getInstagramConfig() {
  const appId = process.env.INSTAGRAM_APP_ID || '936619743392459';
  const { cookiesPath, hasCookies } = configureCookies(process.env.INSTAGRAM_COOKIES_PATH, DEFAULT_INSTAGRAM_COOKIES);
  return {
    appId,
    cookiesPath,
    hasCookies,
  };
}

function getYoutubeCookiesConfig() {
  return configureCookies(process.env.YOUTUBE_COOKIES_PATH, DEFAULT_YOUTUBE_COOKIES);
}

const ytDlpWrap = new YTDlpWrap();
const DEFAULT_FORMAT = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
const PROVIDERS_REQUIRING_MERGE: MediaProviderId[] = ['instagram', 'twitter'];
const execFileAsync = promisify(execFile);

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
    case 'youtube': {
      const { cookiesPath, hasCookies } = getYoutubeCookiesConfig();
      options.push('--extractor-args', 'youtube:player_client=android,web');
      if (hasCookies) {
        console.log('YouTube: usando cookies em', cookiesPath);
        options.push('--cookies', cookiesPath);
      } else {
        console.warn('YouTube: Nenhum arquivo de cookies encontrado em', cookiesPath);
      }
      break;
    }
    case 'instagram': {
      const { appId, cookiesPath, hasCookies } = getInstagramConfig();
      options.push('--extractor-args', `instagram:app_id=${appId}`);
      options.push('--add-header', `X-IG-App-ID: ${appId}`);
      options.push('--add-header', 'Origin: https://www.instagram.com');
      options.push('--add-header', 'Referer: https://www.instagram.com/');
      options.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
      if (hasCookies) {
        console.log('Instagram: usando cookies em', cookiesPath);
        options.push('--cookies', cookiesPath);
      } else {
        console.warn('Instagram: Nenhum arquivo de cookies encontrado em', cookiesPath);
      }
      break;
    }
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

  const requiresTempDownload = PROVIDERS_REQUIRING_MERGE.includes(provider.id);

  if (requiresTempDownload) {
    const baseFormats = [
      format,
      DEFAULT_FORMAT,
      'bestvideo+bestaudio/best',
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      'best[ext=mp4]/best',
      'best',
    ];

    const twitterSpecificFormats = provider.id === 'twitter'
      ? ['bv*+ba/b', 'bv*+ba/best', 'bestvideo+bestaudio']
      : [];

    const formatsToTry = Array.from(new Set([...baseFormats, ...twitterSpecificFormats].filter(Boolean)));

    for (const candidateFormat of formatsToTry) {
      try {
        console.log(`${provider.id}: tentando baixar formato ${candidateFormat} para ${url}...`);
        const { filePath, filename, cleanup } = await downloadToTempFile(url, candidateFormat, provider.id);
        try {
          const stats = fs.statSync(filePath);
          const fileStream = fs.createReadStream(filePath);
          const responseStream = toReadableStream(fileStream);
          const response = buildStreamResponse(responseStream, filename, stats.size);

          const cleanupOnce = () => {
            if (fs.existsSync(filePath)) {
              try {
                cleanup();
              } catch (cleanupError) {
                console.warn(`${provider.id}: falha ao limpar arquivo temporário`, cleanupError);
              }
            }
          };

          fileStream.on('end', cleanupOnce);
          fileStream.on('error', cleanupOnce);

          return response;
        } catch (streamError) {
          console.error(`${provider.id}: falha ao enviar arquivo temporário:`, streamError);
          cleanup();
        }
      } catch (candidateError) {
        const errorMessage = candidateError instanceof Error ? candidateError.message : String(candidateError);
        if (errorMessage === 'AUDIO_NOT_FOUND') {
          console.log(`${provider.id}: arquivo gerado sem trilha de áudio, tentando próximo formato...`);
          continue;
        }

        if (isFormatNotAvailableError(candidateError)) {
          console.log(`${provider.id}: formato ${candidateFormat} não disponível, tentando próximo...`);
          continue;
        }
        console.error(`${provider.id}: erro ao baixar formato ${candidateFormat}:`, candidateError);
        continue;
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

  // Para outros provedores, manter fluxo existente

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
      const responseStream = toReadableStream(nodeStream);
      return buildStreamResponse(responseStream);
    } catch (streamError) {
      // Capturar e tratar todos os erros
      const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
      const errorCause = (streamError as any)?.cause;
      const errorStderr = (streamError as any)?.stderr || '';
      
      console.log(`[${provider.id}] Erro capturado no stream primário:`, {
        message: errorMessage,
        cause: errorCause ? String(errorCause) : undefined,
        stderr: errorStderr || undefined,
      });
      
      // Para YouTube, sempre tentar fallback se houver qualquer erro
      if (provider.id === 'youtube') {
        console.log(`[${provider.id}] Acionando fallback...`);
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

    // Para YouTube (incluindo Shorts), tentar múltiplos fallbacks
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
      let isClosed = false;
      
      const safeError = (error: Error) => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.error(error);
        } catch (e) {
          // Ignorar erros se o controller já estiver fechado ou com erro
        }
      };
      
      const safeClose = () => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.close();
        } catch (error) {
          // Ignorar erros se o controller já estiver fechado
        }
      };
      
      stream.on('data', (chunk) => {
        if (isClosed) return;
        try {
          hasEnqueued = true;
          controller.enqueue(chunk);
        } catch (error) {
          console.error('Erro ao enfileirar chunk:', error);
          safeError(error as Error);
        }
      });
      
      stream.on('end', () => {
        safeClose();
      });
      
      stream.on('error', (error) => {
        // Não logar aqui pois já foi logado antes do stream ser criado
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
            safeError(formatError);
          } else {
            safeError(error);
          }
        } catch (e) {
          safeError(error);
        }
      });
      
      stream.on('close', () => {
        // Se o stream fechar sem dados, pode ser um problema
        if (!hasEnqueued && !isClosed) {
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
        // Ignorar erros ao cancelar
      }
    },
  });
}

function buildStreamResponse(stream: ReadableStream<Uint8Array>, filename = 'media-download.mp4', size?: number) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
  };
  if (typeof size === 'number') {
    headers['Content-Length'] = String(size);
  }

  return new NextResponse(stream, {
    headers,
  });
}

async function fileHasAudioTrack(filePath: string): Promise<boolean> {
  const ffprobeBinary = process.env.FFPROBE_PATH || 'ffprobe';
  try {
    const { stdout } = await execFileAsync(ffprobeBinary, [
      '-v',
      'error',
      '-select_streams',
      'a',
      '-show_entries',
      'stream=codec_type',
      '-of',
      'json',
      filePath,
    ]);

    const parsed = JSON.parse(stdout || '{}');
    const streams = Array.isArray(parsed?.streams) ? parsed.streams : [];
    return streams.length > 0;
  } catch (error) {
    console.warn('ffprobe não pôde verificar as faixas de áudio; assumindo que o arquivo possui áudio.', error);
    return true;
  }
}

async function downloadToTempFile(url: string, format: string, providerId: MediaProviderId): Promise<{ filePath: string; filename: string; cleanup: () => void }> {
  const options = getYtDlpOptions(providerId);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `mediagrab-${randomUUID()}-`));
  const outputTemplate = path.join(tempDir, 'download.%(ext)s');
  const args = [
    ...options,
    url,
    '-f',
    format,
    '-o',
    outputTemplate,
    '--merge-output-format',
    'mp4',
    '--no-playlist',
  ];

  try {
    await ytDlpWrap.execPromise(args);
    const files = fs.readdirSync(tempDir).filter((file) => !file.startsWith('.'));
    if (files.length === 0) {
      throw new Error('Nenhum arquivo gerado pelo yt-dlp');
    }
    const filePath = path.join(tempDir, files[0]);
    const filename = path.basename(filePath);

    if (PROVIDERS_REQUIRING_MERGE.includes(providerId)) {
      const hasAudio = await fileHasAudioTrack(filePath);
      if (!hasAudio) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        const audioError = new Error('AUDIO_NOT_FOUND');
        (audioError as any).code = 'AUDIO_NOT_FOUND';
        throw audioError;
      }
    }
    const cleanup = () => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    };
    return { filePath, filename, cleanup };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}