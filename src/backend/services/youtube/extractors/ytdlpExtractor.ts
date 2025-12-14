/**
 * YouTube Extractor usando yt-dlp
 * Este é o método principal e mais confiável
 */

import YTDlpWrap from 'yt-dlp-wrap';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';
import { getCookiesFilePath } from '../../../lib/cookies';

const ytDlpWrap = new YTDlpWrap();

interface YtDlpFormat {
  format_id?: string | number;
  format?: string;
  ext?: string;
  resolution?: string;
  quality?: string;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
}

export class YtDlpExtractor implements IExtractor {
  readonly name = 'yt-dlp';

  supports(url: string): boolean {
    return /(youtube\.com|youtu\.be)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar se yt-dlp está disponível fazendo uma requisição simples
      return true; // yt-dlp-wrap já verifica isso
    } catch {
      return false;
    }
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Normalizar URL (converter shorts para formato normal)
      let normalizedUrl = url;
      if (url.includes('youtube.com/shorts/')) {
        const videoId = url.match(/\/shorts\/([^/?]+)/)?.[1];
        if (videoId) {
          normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      }

      // Obter configuração de cookies (arquivo ou navegador)
      const { getCookiesConfig } = await import('../../../lib/cookies');
      let cookiesConfig: { type: 'file'; path: string } | { type: 'browser'; browser: string; profile?: string } | null = null;
      try {
        cookiesConfig = await getCookiesConfig('youtube');
      } catch (error) {
        console.warn('[YtDlpExtractor] Erro ao obter cookies:', error);
      }

      // Preparar argumentos
      const args: string[] = [normalizedUrl];
      
      // Adicionar cookies (arquivo ou navegador)
      if (cookiesConfig) {
        if (cookiesConfig.type === 'file') {
          args.push('--cookies', cookiesConfig.path);
        } else if (cookiesConfig.type === 'browser') {
          // Usar cookies do navegador
          const browserArg = cookiesConfig.profile 
            ? `${cookiesConfig.browser}:${cookiesConfig.profile}`
            : cookiesConfig.browser;
          args.push('--cookies-from-browser', browserArg);
          console.log(`[YtDlpExtractor] Usando cookies do navegador: ${browserArg}`);
        }
      }

      // Obter informações do vídeo
      const videoInfo = await ytDlpWrap.getVideoInfo(args);
      const { title, formats } = videoInfo;

      if (!formats || formats.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_FORMATS',
            message: 'Nenhum formato disponível para este vídeo',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Processar formatos
      const processedFormats = this.processFormats(formats as YtDlpFormat[]);

      const result: ExtractedMediaInfo = {
        title: title || 'Título não disponível',
        formats: processedFormats,
        thumbnail: (videoInfo as any).thumbnail,
        duration: (videoInfo as any).duration,
        description: (videoInfo as any).description,
      };

      return {
        success: true,
        data: result,
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao extrair informações do YouTube',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private processFormats(formats: YtDlpFormat[]): ExtractedFormat[] {
    // Separar formatos em categorias
    const videoWithAudio: YtDlpFormat[] = [];
    const videoOnly: YtDlpFormat[] = [];
    const audioOnly: YtDlpFormat[] = [];

    formats.forEach((format) => {
      const hasVideo = format.vcodec && format.vcodec !== 'none';
      const hasAudio = format.acodec && format.acodec !== 'none';

      if (hasVideo && hasAudio) {
        videoWithAudio.push(format);
      } else if (hasVideo) {
        videoOnly.push(format);
      } else if (hasAudio) {
        audioOnly.push(format);
      }
    });

    // Priorizar: vídeo+áudio > vídeo-only > áudio-only
    const formatsToUse = videoWithAudio.length > 0
      ? [...videoWithAudio, ...audioOnly]
      : [...videoOnly, ...audioOnly];

    return formatsToUse
      .filter((format) => format.format_id || format.format)
      .map((format): ExtractedFormat => ({
        format_id: String(format.format_id ?? format.format ?? ''),
        ext: format.ext ?? 'mp4',
        resolution:
          format.resolution ||
          (format.acodec !== 'none' && format.vcodec === 'none'
            ? 'Áudio'
            : format.vcodec !== 'none' && format.acodec === 'none'
              ? 'Vídeo'
              : 'Desconhecido'),
        quality: format.quality || format.format_note || null,
        vcodec: format.vcodec || 'none',
        acodec: format.acodec || 'none',
        filesize_approx: format.filesize || format.filesize_approx,
      }));
  }
}
