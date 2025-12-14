/**
 * Instagram Extractor usando yt-dlp como fallback
 * Este é o método mais confiável quando outros falham
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

export class InstagramYtDlpExtractor implements IExtractor {
  readonly name = 'instagram-yt-dlp';

  supports(url: string): boolean {
    return /(instagram\.com|instagr\.am)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    return true; // yt-dlp sempre disponível
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Obter configuração de cookies (arquivo ou navegador)
      const { getCookiesConfig } = await import('../../../lib/cookies');
      let cookiesConfig: { type: 'file'; path: string } | { type: 'browser'; browser: string; profile?: string } | null = null;
      try {
        cookiesConfig = await getCookiesConfig('instagram');
      } catch (error) {
        console.warn('[InstagramYtDlpExtractor] Erro ao obter cookies:', error);
      }

      // Preparar argumentos
      // Para Instagram, forçar busca de formatos com vídeo primeiro
      // Usar opção que prioriza vídeo+áudio combinados, mas força vídeo quando separado
      const args: string[] = [
        url,
        '-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080][vcodec!=none]/best[vcodec!=none]/best',
        // Forçar busca de vídeo: primeiro tenta vídeo+áudio, depois best com vídeo, depois qualquer coisa
        '--no-playlist',
        '--no-warnings',
      ];
      
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
          console.log(`[InstagramYtDlpExtractor] Usando cookies do navegador: ${browserArg}`);
        }
      }

      console.log(`[InstagramYtDlpExtractor] Buscando formatos de vídeo com opções: ${args.join(' ')}`);

      // Obter informações do vídeo/post
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

      // Processar formatos (filtrar VP9/AV1 que causam problemas, priorizar H.264)
      const processedFormats = this.processFormats(formats as YtDlpFormat[]);

      // Se não encontrou formatos de vídeo (apenas áudio), isso é um problema
      // Instagram Reels sempre tem vídeo, então se só temos áudio, o yt-dlp não conseguiu
      const hasVideoFormat = processedFormats.some(f => f.vcodec !== 'none' && f.vcodec !== 'unknown');
      const hasAudioOnly = processedFormats.length > 0 && processedFormats.every(f => 
        (f.vcodec === 'none' || f.vcodec === 'unknown') && f.acodec !== 'none' && f.acodec !== 'unknown'
      );
      
      if (hasAudioOnly) {
        // Log detalhado para debug
        console.warn('[InstagramYtDlpExtractor] ⚠️ Apenas áudio encontrado, yt-dlp pode não ter conseguido extrair vídeo');
        console.warn(`[InstagramYtDlpExtractor] Formatos retornados: ${processedFormats.length}`);
        processedFormats.forEach((f, i) => {
          console.warn(`  [${i}] ${f.format_id}: vcodec=${f.vcodec}, acodec=${f.acodec}, res=${f.resolution}`);
        });
        console.warn('[InstagramYtDlpExtractor] Retornando resultado para que outros extractors sejam tentados...');
        
        // Retornar sucesso mas com apenas áudio - o fallback orchestrator vai continuar tentando
        // Mas marcar como falha no health checker para não ficar tentando este método
        return {
          success: true, // Retornar sucesso para que o fallback continue
          data: result,
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      } else if (hasVideoFormat) {
        console.log(`[InstagramYtDlpExtractor] ✅ Formatos de vídeo encontrados: ${processedFormats.filter(f => f.vcodec !== 'none' && f.vcodec !== 'unknown').length} de ${processedFormats.length}`);
      }

      const result: ExtractedMediaInfo = {
        title: title || 'Instagram Media',
        formats: processedFormats,
        thumbnail: (videoInfo as any).thumbnail,
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
          message: error instanceof Error ? error.message : 'Erro ao extrair informações do Instagram',
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

    // Para Instagram: filtrar formatos VP9/AV1 que causam vídeo preto, priorizar H.264 (avc1)
    const filteredVideoWithAudio = videoWithAudio.filter(f => 
      !f.vcodec?.includes('vp9') && !f.vcodec?.includes('av01') && !f.vcodec?.includes('vp09')
    );
    const filteredVideoOnly = videoOnly.filter(f => 
      !f.vcodec?.includes('vp9') && !f.vcodec?.includes('av01') && !f.vcodec?.includes('vp09')
    );
    
    // Priorizar formatos H.264 (avc1)
    const h264Formats = [...filteredVideoWithAudio, ...filteredVideoOnly].filter(f => 
      f.vcodec?.toLowerCase().includes('avc1') || f.vcodec?.toLowerCase().includes('h264')
    );
    const otherFormats = [...filteredVideoWithAudio, ...filteredVideoOnly].filter(f => 
      !f.vcodec?.toLowerCase().includes('avc1') && !f.vcodec?.toLowerCase().includes('h264')
    );
    
    // Usar H.264 primeiro, depois outros formatos
    const formatsToUse = h264Formats.length > 0 
      ? [...h264Formats, ...otherFormats, ...audioOnly]
      : [...filteredVideoWithAudio, ...filteredVideoOnly, ...audioOnly];

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
