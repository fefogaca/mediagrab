/**
 * Instagram Extractor usando scraping HTML
 * Extrai window._sharedData do HTML da página
 * Suporta: Posts, Reels, Stories, IGTV, Carousel
 */

import * as cheerio from 'cheerio';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

interface InstagramSharedData {
  entry_data?: {
    PostPage?: Array<{
      graphql?: {
        shortcode_media?: {
          shortcode?: string;
          display_url?: string;
          video_url?: string;
          is_video?: boolean;
          video_view_count?: number;
          edge_sidecar_to_children?: {
            edges?: Array<{
              node?: {
                display_url?: string;
                video_url?: string;
                is_video?: boolean;
                shortcode?: string;
              };
            }>;
          };
          owner?: {
            username?: string;
          };
          edge_media_to_caption?: {
            edges?: Array<{
              node?: {
                text?: string;
              };
            }>;
          };
        };
      };
    }>;
    ProfilePage?: Array<{
      user?: {
        username?: string;
      };
    }>;
  };
}

export class InstagramScrapingExtractor implements IExtractor {
  readonly name = 'instagram-scraping';

  supports(url: string): boolean {
    return /(instagram\.com|instagr\.am)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Sempre disponível
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Normalizar URL
      let normalizedUrl = url;
      if (url.includes('instagr.am/')) {
        normalizedUrl = url.replace('instagr.am/', 'instagram.com/');
      }

      // Headers para parecer um navegador
      const headers: Record<string, string> = {
        'User-Agent': options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.instagram.com/',
        ...options?.headers,
      };

      // Fazer requisição HTTP
      const response = await fetch(normalizedUrl, { headers });
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

      // Procurar window._sharedData
      let sharedData: InstagramSharedData | null = null;

      const scripts = $('script').toArray();
      for (const script of scripts) {
        const scriptText = $(script).html() || '';
        
        // Procurar por window._sharedData (usando [\s\S] ao invés de . com flag s para compatibilidade ES2017)
        const match = scriptText.match(/window\._sharedData\s*=\s*({[\s\S]+?});/);
        if (match) {
          try {
            sharedData = JSON.parse(match[1]);
            break;
          } catch (e) {
            // Continuar procurando
          }
        }
      }

      if (!sharedData) {
        return {
          success: false,
          error: {
            code: 'SHARED_DATA_NOT_FOUND',
            message: 'Não foi possível extrair window._sharedData do HTML',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Extrair informações do post/reel/story
      const postPage = sharedData.entry_data?.PostPage?.[0];
      const media = postPage?.graphql?.shortcode_media;

      if (!media) {
        return {
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Não foi possível encontrar mídia nesta página',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const formats: ExtractedFormat[] = [];
      const username = media.owner?.username || 'instagram';
      const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || '';
      const shortcode = media.shortcode || '';

      // Post simples ou Reel (vídeo único)
      if (media.is_video && media.video_url) {
        formats.push({
          format_id: 'instagram-video',
          ext: 'mp4',
          resolution: 'Padrão',
          quality: null,
          vcodec: 'unknown',
          acodec: 'unknown',
          url: media.video_url,
        });
      } else if (media.display_url) {
        // Imagem
        formats.push({
          format_id: 'instagram-image',
          ext: 'jpg',
          resolution: 'Padrão',
          quality: null,
          vcodec: 'none',
          acodec: 'none',
          url: media.display_url,
        });
      }

      // Carousel (múltiplas mídias)
      if (media.edge_sidecar_to_children?.edges) {
        for (const edge of media.edge_sidecar_to_children.edges) {
          const node = edge.node;
          if (!node) continue;

          if (node.is_video && node.video_url) {
            formats.push({
              format_id: `instagram-video-${node.shortcode || formats.length}`,
              ext: 'mp4',
              resolution: 'Padrão',
              quality: null,
              vcodec: 'unknown',
              acodec: 'unknown',
              url: node.video_url,
            });
          } else if (node.display_url) {
            formats.push({
              format_id: `instagram-image-${node.shortcode || formats.length}`,
              ext: 'jpg',
              resolution: 'Padrão',
              quality: null,
              vcodec: 'none',
              acodec: 'none',
              url: node.display_url,
            });
          }
        }
      }

      if (formats.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_MEDIA',
            message: 'Nenhuma mídia encontrada neste post',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const title = caption 
        ? (caption.length > 100 ? caption.substring(0, 100) + '...' : caption)
        : `Post do Instagram de @${username}`;

      const result: ExtractedMediaInfo = {
        title,
        formats,
        description: caption,
        thumbnail: media.display_url || formats[0]?.url,
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
          message: error instanceof Error ? error.message : 'Erro ao fazer scraping do Instagram',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }
}
