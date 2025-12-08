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
    
    // Função auxiliar para tentar um formato específico (sem validação prévia)
    // Retorna NextResponse se funcionar, null se não funcionar
    const tryFormat = async (formatToTry: string, timeoutMs: number = 10000): Promise<NextResponse | null> => {
      try {
        const nodeStream = ytDlpWrap.execStream([...options, url, '-f', formatToTry, '-o', '-']);
        
        // Aguardar para detectar erros iniciais
        const streamReady = new Promise<boolean>((resolve, reject) => {
          let hasData = false;
          let streamError: Error | null = null;
          let timeoutId: NodeJS.Timeout;
          let resolved = false;
          
          const dataHandler = (chunk: any) => {
            if (!resolved && chunk && chunk.length > 0) {
              hasData = true;
              resolved = true;
              cleanup();
              resolve(true);
            }
          };
          
          const errorHandler = (error: Error) => {
            if (!resolved) {
              streamError = error;
              resolved = true;
              cleanup();
              if (isFormatNotAvailableError(error)) {
                reject(new Error('FORMAT_NOT_AVAILABLE'));
              } else {
                reject(error);
              }
            }
          };
          
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            try {
              nodeStream.removeListener('data', dataHandler);
              nodeStream.removeListener('error', errorHandler);
            } catch (e) {
              // Ignorar erros ao remover listeners
            }
          };
          
          nodeStream.on('data', dataHandler);
          nodeStream.on('error', errorHandler);
          
          // Timeout configurável (padrão 10 segundos, mais para formatos de alta qualidade)
          // Para formatos que combinam vídeo+áudio, pode demorar mais para iniciar
          timeoutId = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              cleanup();
              // Se já recebeu dados, considerar sucesso mesmo que o timeout tenha ocorrido
              if (hasData) {
                resolve(true);
              } else if (streamError) {
                // Se houve erro, rejeitar
                if (isFormatNotAvailableError(streamError)) {
                  reject(new Error('FORMAT_NOT_AVAILABLE'));
                } else {
                  reject(streamError);
                }
              } else {
                // Sem dados e sem erro explícito - pode ser que ainda esteja iniciando
                // Para formatos combinados, dar mais uma chance
                reject(new Error('STREAM_TIMEOUT_NO_DATA'));
              }
            }
          }, timeoutMs);
        });
        
        await streamReady;
        // Se chegou aqui, o stream está funcionando
        console.log(`✅ Formato ${formatToTry} funcionando, retornando stream...`);
        const responseStream = toReadableStream(nodeStream);
        return buildStreamResponse(responseStream);
      } catch (streamError) {
        const errorStr = String(streamError);
        if (errorStr.includes('FORMAT_NOT_AVAILABLE') || 
            errorStr.includes('STREAM_TIMEOUT_NO_DATA') || 
            errorStr.includes('STREAM_TIMEOUT') ||
            isFormatNotAvailableError(streamError)) {
          return null; // Formato não disponível, retornar null para tentar próximo
        }
        throw streamError; // Outro erro, relançar
      }
    };
    
    // Se o formato solicitado não for o padrão, tentar usar exatamente o formato solicitado
    // Se não estiver disponível, buscar a resolução do formato e tentar outros formatos da mesma resolução
    if (format !== DEFAULT_FORMAT) {
      console.log(`🎯 Tentando formato solicitado: ${format}`);
      
      // Buscar informações do vídeo ANTES de tentar o formato para saber se tem áudio
      let targetResolution: string | null = null;
      let targetHeight: number | null = null;
      let hasAudio = false;
      let allFormatsOfSameResolution: string[] = [];
      let videoInfo: any = null;
      
      try {
        videoInfo = await ytDlpWrap.getVideoInfo(url);
        const requestedFormat = videoInfo.formats.find((f: any) => String(f.format_id) === format);
        
        if (requestedFormat) {
          targetResolution = requestedFormat.resolution || null;
          hasAudio = requestedFormat.acodec && requestedFormat.acodec !== 'none';
          console.log(`📐 Formato ${format} tem resolução: ${targetResolution}, tem áudio: ${hasAudio}`);
          
          // Extrair altura da resolução (ex: "1920x1080" -> 1080, "1080p" -> 1080)
          if (targetResolution) {
            const heightMatch = targetResolution.match(/(\d+)p?$/i) || targetResolution.match(/x(\d+)/);
            if (heightMatch) {
              targetHeight = parseInt(heightMatch[1]);
              console.log(`📏 Altura extraída: ${targetHeight}p`);
              
              // Buscar TODOS os formatos que têm a mesma resolução
              allFormatsOfSameResolution = videoInfo.formats
                .filter((f: any) => {
                  const fResolution = f.resolution || '';
                  const fHeightMatch = fResolution.match(/(\d+)p?$/i) || fResolution.match(/x(\d+)/);
                  if (fHeightMatch) {
                    const fHeight = parseInt(fHeightMatch[1]);
                    return fHeight === targetHeight && String(f.format_id) !== format;
                  }
                  return false;
                })
                .map((f: any) => String(f.format_id))
                .filter((id: string) => id && id !== format);
              
              console.log(`🔍 Encontrados ${allFormatsOfSameResolution.length} outros formatos com ${targetHeight}p:`, allFormatsOfSameResolution.slice(0, 5));
            }
          }
        }
      } catch (infoError) {
        console.log('Não foi possível buscar informações do vídeo:', infoError);
      }
      
      // Se o formato não tem áudio, tentar combinar com áudio primeiro (com timeout maior para alta qualidade)
      if (!hasAudio && targetHeight !== null) {
        console.log(`🎵 Formato ${format} não tem áudio, tentando combinar com áudio...`);
        const videoAudioFormats = [
          `${format}+bestaudio/best`, // Formato solicitado + melhor áudio
          `${format}+bestaudio[ext=m4a]/best`, // Formato solicitado + áudio M4A
          `bestvideo[height=${targetHeight}]+bestaudio/best[height=${targetHeight}]`, // Melhor vídeo dessa altura + áudio
          `bestvideo[height=${targetHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height=${targetHeight}][ext=mp4]`, // MP4 dessa altura + áudio
        ];
        
        // Usar timeout maior para formatos de alta qualidade (1080p+)
        const timeout = targetHeight >= 1080 ? 20000 : 10000;
        
        for (const comboFormat of videoAudioFormats) {
          console.log(`🔄 Tentando combinação vídeo+áudio: ${comboFormat}...`);
          const comboResult = await tryFormat(comboFormat, timeout);
          if (comboResult) {
            console.log(`✅ SUCESSO! Combinação ${comboFormat} funcionou! Retornando vídeo em ${targetHeight}p com áudio...`);
            return comboResult;
          }
        }
      }
      
      // Tentar o formato exato solicitado (pode ter áudio ou não)
      const result = await tryFormat(format);
      if (result) {
        console.log(`✅ Formato solicitado ${format} funcionou!`);
        return result;
      }
      
      console.log(`❌ Formato ${format} não disponível, tentando outros formatos da mesma resolução...`);
      
      // Se encontrou a resolução, tentar formatos específicos dessa resolução
      if (targetHeight !== null) {
        // Primeiro tentar outros format_ids da mesma resolução que TÊM áudio
        const formatsWithAudio = allFormatsOfSameResolution.filter((id: string) => {
          const f = videoInfo?.formats?.find((fmt: any) => String(fmt.format_id) === id);
          return f && f.acodec && f.acodec !== 'none';
        });
        
        if (formatsWithAudio.length > 0) {
          console.log(`🎵 Tentando ${formatsWithAudio.length} formatos com áudio da mesma resolução...`);
          for (const altFormatId of formatsWithAudio) {
            console.log(`🔄 Tentando format_id com áudio (${altFormatId}) da mesma resolução (${targetHeight}p)...`);
            const altResult = await tryFormat(altFormatId);
            if (altResult) {
              console.log(`✅ SUCESSO! Formato ${altFormatId} funcionou! Retornando vídeo em ${targetHeight}p...`);
              return altResult;
            }
          }
        }
        
        // Tentar outros format_ids da mesma resolução (mesmo sem áudio, pode combinar depois)
        for (const altFormatId of allFormatsOfSameResolution) {
          if (formatsWithAudio.includes(altFormatId)) continue; // Já tentamos
          console.log(`🔄 Tentando outro format_id (${altFormatId}) da mesma resolução (${targetHeight}p)...`);
          const altResult = await tryFormat(altFormatId);
          if (altResult) {
            console.log(`✅ SUCESSO! Formato ${altFormatId} funcionou! Retornando vídeo em ${targetHeight}p...`);
            return altResult;
          }
        }
        
        // Se nenhum format_id específico funcionou, tentar seletores do yt-dlp para essa resolução
        console.log(`🎯 Tentando seletores do yt-dlp para ${targetHeight}p...`);
        const resolutionFormats = [
          `bestvideo[height=${targetHeight}]+bestaudio/best[height=${targetHeight}]`, // Vídeo + áudio dessa altura
          `bestvideo[height=${targetHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height=${targetHeight}][ext=mp4]`, // MP4 dessa altura + áudio
          `bestvideo[height=${targetHeight}][ext=webm]+bestaudio[ext=webm]/best[height=${targetHeight}][ext=webm]`, // WebM dessa altura + áudio
          `best[height=${targetHeight}]`, // Exatamente essa altura (pode ter áudio)
        ];
        
        for (const resFormat of resolutionFormats) {
          console.log(`🔄 Tentando seletor de resolução: ${resFormat}...`);
          const resResult = await tryFormat(resFormat);
          if (resResult) {
            console.log(`✅ SUCESSO! Seletor ${resFormat} funcionou! Retornando vídeo em ${targetHeight}p...`);
            return resResult;
          }
        }
      }
      
      // Se não encontrou resolução ou nenhum formato da mesma resolução funcionou, retornar erro
      console.error(`❌ ERRO: Não foi possível encontrar nenhum formato funcional para a resolução solicitada (${targetResolution || 'desconhecida'})`);
      return NextResponse.json<ApiErrorBody>(
        {
          error: {
            code: 'FORMAT_NOT_AVAILABLE',
            message: `O formato solicitado (${format}) não está disponível para este vídeo. ${targetHeight ? `Tentamos encontrar outros formatos de ${targetHeight}p, mas nenhum funcionou.` : 'Não foi possível determinar a resolução solicitada.'} Por favor, selecione outro formato da lista.`,
          },
        },
        { status: 400 },
      );
    }
    
    // Tentar o formato solicitado primeiro (para outros provedores ou formato padrão)
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

    // Se o formato específico não está disponível, retornar erro claro
    if (format !== DEFAULT_FORMAT && isFormatNotAvailable) {
      return NextResponse.json<ApiErrorBody>(
        {
          error: {
            code: 'FORMAT_NOT_AVAILABLE',
            message: `O formato solicitado (${format}) não está disponível para este vídeo. Por favor, selecione outro formato.`,
          },
        },
        { status: 400 },
      );
    }

    // Se for formato padrão ou outro erro, retornar erro genérico
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