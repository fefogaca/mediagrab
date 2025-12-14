/**
 * Instagram Extractor usando GraphQL API
 * Requer cookies válidos do Instagram
 * Suporta: Posts, Reels, Stories, IGTV, Carousel
 */

import axios, { AxiosInstance } from 'axios';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';
import { getCookies } from '../../../lib/cookies';

interface InstagramGraphQLResponse {
  data?: {
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
}

export class InstagramGraphQLExtractor implements IExtractor {
  readonly name = 'instagram-graphql';
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'x-ig-app-id': '936619743392459',
        'x-ig-www-claim': '0',
        'x-requested-with': 'XMLHttpRequest',
      },
    });
  }

  supports(url: string): boolean {
    return /(instagram\.com\/p\/|instagram\.com\/reel\/|instagram\.com\/tv\/|instagram\.com\/stories\/)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const cookies = await getCookies();
      const instagramCookies = cookies.instagram || '';
      return instagramCookies.length > 0;
    } catch {
      return false;
    }
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Extrair shortcode da URL
      const shortcode = this.extractShortcode(url);
      if (!shortcode) {
        return {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Não foi possível extrair o shortcode da URL',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Obter cookies do Instagram
      const cookies = await getCookies();
      const instagramCookies = cookies.instagram || '';
      
      if (!instagramCookies) {
        return {
          success: false,
          error: {
            code: 'COOKIES_REQUIRED',
            message: 'Cookies do Instagram são necessários para este método',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Preparar headers com cookies
      const headers: Record<string, string> = {
        ...this.axiosInstance.defaults.headers,
        'Cookie': instagramCookies,
        ...options?.headers,
      };

      // GraphQL Query Hash para PostPageQuery
      const queryHash = 'b3055c01b4b222b8a47dc12b090e4e64'; // PostPageQuery hash
      const variables = {
        shortcode,
        child_comment_count: 3,
        fetch_comment_count: 40,
        parent_comment_count: 24,
        has_threaded_comments: true,
      };

      const response = await this.axiosInstance.get<InstagramGraphQLResponse>(
        'https://www.instagram.com/graphql/query/',
        {
          headers,
          params: {
            query_hash: queryHash,
            variables: JSON.stringify(variables),
          },
        }
      );

      const media = response.data?.data?.shortcode_media;

      if (!media) {
        return {
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Mídia não encontrada',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const formats: ExtractedFormat[] = [];
      const username = media.owner?.username || 'instagram';
      const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || '';

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
    } catch (error: any) {
      // Tratar erros específicos
      if (error.response?.status === 404) {
        return {
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Mídia não encontrada ou privada',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Cookies inválidos ou expirados',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error.message || 'Erro ao extrair via GraphQL',
          details: error.response?.data || error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractShortcode(url: string): string | null {
    // instagram.com/p/SHORTCODE/
    const postMatch = url.match(/instagram\.com\/p\/([^\/\?]+)/);
    if (postMatch) return postMatch[1];

    // instagram.com/reel/SHORTCODE/
    const reelMatch = url.match(/instagram\.com\/reel\/([^\/\?]+)/);
    if (reelMatch) return reelMatch[1];

    // instagram.com/tv/SHORTCODE/
    const tvMatch = url.match(/instagram\.com\/tv\/([^\/\?]+)/);
    if (tvMatch) return tvMatch[1];

    return null;
  }
}
