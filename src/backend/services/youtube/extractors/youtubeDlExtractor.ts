/**
 * YouTube Extractor usando ytdl-core
 * Fallback adicional para YouTube
 */

import * as ytdlCore from 'ytdl-core';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

export class YoutubeDlExtractor implements IExtractor {
  readonly name = 'ytdl-core';

  supports(url: string): boolean {
    return (ytdlCore as any).validateURL(url);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar se ytdl-core está disponível
      return true;
    } catch {
      return false;
    }
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Obter informações do vídeo
      const info = await (ytdlCore as any).getInfo(url);

      const title = info.videoDetails.title || 'Título não disponível';
      const thumbnail = info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url;
      const description = info.videoDetails.description;
      const duration = parseInt(info.videoDetails.lengthSeconds, 10);

      // Processar formatos
      const formats: ExtractedFormat[] = info.formats
        .filter((format: any) => format.hasVideo || format.hasAudio)
        .map((format: any): ExtractedFormat => {
          const codecs = this.splitCodecs(format.codecs);
          const resolution = format.qualityLabel
            ? format.qualityLabel
            : format.hasAudio && !format.hasVideo
              ? 'Áudio'
              : format.hasVideo && !format.hasAudio
                ? 'Vídeo'
                : 'Desconhecido';

          return {
            format_id: format.itag ? String(format.itag) : format.mimeType ?? 'fallback',
            ext: format.container ?? this.inferExtensionFromMime(format.mimeType),
            resolution,
            quality: format.audioQuality || format.qualityLabel || null,
            vcodec: codecs.video,
            acodec: codecs.audio,
            filesize_approx: format.contentLength ? Number(format.contentLength) : undefined,
            url: format.url,
          };
        });

      if (formats.length === 0) {
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

      const result: ExtractedMediaInfo = {
        title,
        formats,
        thumbnail,
        description,
        duration,
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
          message: error instanceof Error ? error.message : 'Erro ao extrair informações via ytdl-core',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private splitCodecs(codecString?: string | null): { video: string; audio: string } {
    if (!codecString) {
      return { video: 'unknown', audio: 'unknown' };
    }

    const parts = codecString.split(',').map((part) => part?.trim() || 'unknown');
    const [video, audio] = parts.length >= 2 
      ? [parts[0], parts[1]]
      : parts.length === 1
        ? [parts[0], 'unknown']
        : ['unknown', 'unknown'];

    return {
      video: video ?? 'unknown',
      audio: audio ?? 'unknown',
    };
  }

  private inferExtensionFromMime(mime?: string | null): string {
    if (!mime) return 'mp4';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('mpeg')) return 'mp3';
    if (mime.includes('ogg')) return 'ogg';
    return 'mp4';
  }
}
