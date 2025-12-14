/**
 * TikTok Extractor usando yt-dlp como fallback
 * Este é o método mais confiável quando outros falham
 */

import YTDlpWrap from 'yt-dlp-wrap';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

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

export class TikTokYtDlpExtractor implements IExtractor {
  readonly name = 'tiktok-yt-dlp';

  supports(url: string): boolean {
    return /tiktok\.com/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    return true; // yt-dlp sempre disponível
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Preparar argumentos
      const args: string[] = [url];

      // Obter informações do vídeo
      const videoInfo = await ytDlpWrap.getVideoInfo(args);
      const { title, formats } = videoInfo;

      if (!formats || formats.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_FORMATS',
            message: 'Nenhum formato disponível',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Processar formatos
      const processedFormats = this.processFormats(formats as YtDlpFormat[]);

      const result: ExtractedMediaInfo = {
        title: title || 'TikTok Video',
        formats: processedFormats,
        thumbnail: (videoInfo as any).thumbnail,
        description: (videoInfo as any).description,
        duration: (videoInfo as any).duration,
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
          message: error instanceof Error ? error.message : 'Erro ao extrair informações do TikTok',
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

    // Priorizar formatos com vídeo+áudio
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
