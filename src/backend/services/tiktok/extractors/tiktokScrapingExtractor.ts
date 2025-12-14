/**
 * TikTok Extractor usando scraping HTML
 * Extrai JSON embutido no HTML da página
 */

import * as cheerio from 'cheerio';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

interface TikTokEmbeddedData {
  [key: string]: any;
}

export class TikTokScrapingExtractor implements IExtractor {
  readonly name = 'tiktok-scraping';

  supports(url: string): boolean {
    return /tiktok\.com/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Sempre disponível
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Headers para parecer um navegador
      const headers: Record<string, string> = {
        'User-Agent': options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.tiktok.com/',
        ...options?.headers,
      };

      // Fazer requisição HTTP
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Procurar dados embutidos no HTML
      let videoUrl: string | null = null;
      let videoData: any = null;

      // Método 1: Procurar em scripts com dados JSON
      const scripts = $('script').toArray();
      for (const script of scripts) {
        const scriptText = $(script).html() || '';

        // Procurar por padrões comuns do TikTok
        const patterns = [
          /"downloadAddr":"([^"]+)"/,
          /"playAddr":"([^"]+)"/,
          /"videoUrl":"([^"]+)"/,
          /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({[\s\S]+?});/,
          /"ItemModule":\s*({[\s\S]+?})/,
        ];

        for (const pattern of patterns) {
          const match = scriptText.match(pattern);
          if (match && match[1]) {
            try {
              // Tentar extrair URL diretamente
              if (match[1].startsWith('http')) {
                videoUrl = match[1];
                break;
              }
              
              // Tentar parsear como JSON
              const data = JSON.parse(match[1]);
              videoUrl = this.findVideoUrl(data);
              if (videoUrl) {
                videoData = data;
                break;
              }
            } catch (e) {
              // Continuar procurando
            }
          }
        }

        if (videoUrl) break;
      }

      // Método 2: Procurar em meta tags
      if (!videoUrl) {
        const metaTags = $('meta[property*="video"], meta[name*="video"], meta[property*="og:video"]').toArray();
        for (const meta of metaTags) {
          const content = $(meta).attr('content');
          if (content && content.includes('http') && (content.includes('.mp4') || content.includes('video'))) {
            videoUrl = content;
            break;
          }
        }
      }

      // Método 3: Procurar em atributos data-* ou video tags
      if (!videoUrl) {
        const dataElements = $('[data-video-url], [data-src*="video"], video[src], source[src]').toArray();
        for (const element of dataElements) {
          const url = $(element).attr('data-video-url') || 
                     $(element).attr('data-src') || 
                     $(element).attr('src');
          if (url && url.startsWith('http')) {
            videoUrl = url;
            break;
          }
        }
      }

      if (!videoUrl) {
        return {
          success: false,
          error: {
            code: 'NO_VIDEO_URL',
            message: 'Não foi possível encontrar URL do vídeo no HTML',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Extrair título se disponível
      const title = $('meta[property="og:title"]').attr('content') || 
                   $('title').text() || 
                   'TikTok Video';

      // Criar formato básico
      const formats: ExtractedFormat[] = [{
        format_id: 'tiktok-scraped',
        ext: 'mp4',
        resolution: 'Desconhecido',
        quality: null,
        vcodec: 'unknown',
        acodec: 'unknown',
        url: videoUrl,
      }];

      const result: ExtractedMediaInfo = {
        title,
        formats,
        thumbnail: $('meta[property="og:image"]').attr('content'),
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
          message: error instanceof Error ? error.message : 'Erro ao fazer scraping do TikTok',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private findVideoUrl(data: any): string | null {
    if (!data) return null;

    // Procurar recursivamente por URLs de vídeo
    if (typeof data === 'string' && data.startsWith('http') && (data.includes('.mp4') || data.includes('video'))) {
      return data;
    }

    if (typeof data === 'object') {
      // Procurar em propriedades comuns
      const videoKeys = ['downloadAddr', 'playAddr', 'videoUrl', 'video_url', 'video', 'url'];
      for (const key of videoKeys) {
        if (data[key] && typeof data[key] === 'string' && data[key].startsWith('http')) {
          return data[key];
        }
      }

      // Buscar recursivamente
      for (const key in data) {
        const result = this.findVideoUrl(data[key]);
        if (result) return result;
      }
    }

    return null;
  }
}
