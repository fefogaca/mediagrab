/**
 * Instagram Extractor usando instagram-private-api
 * Requer credenciais configuradas
 * Método mais confiável mas requer login
 */

import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';
import Settings from '../../../models/Settings';

export class InstagramPrivateApiExtractor implements IExtractor {
  readonly name = 'instagram-private-api';

  supports(url: string): boolean {
    return /(instagram\.com\/p\/|instagram\.com\/reel\/|instagram\.com\/tv\/)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar se temos credenciais configuradas
      const settings = await Settings.getSettings();
      const customSettings = settings as any;
      const credentials = customSettings.instagramCredentials || {};
      
      return !!(credentials.username && credentials.password);
    } catch {
      return false;
    }
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Verificar se a biblioteca está disponível
      let InstagramPrivateAPI: any;
      try {
        InstagramPrivateAPI = require('instagram-private-api');
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'LIBRARY_NOT_AVAILABLE',
            message: 'instagram-private-api não está instalada',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Obter credenciais
      const settings = await Settings.getSettings();
      const customSettings = settings as any;
      const credentials = customSettings.instagramCredentials || {};

      if (!credentials.username || !credentials.password) {
        return {
          success: false,
          error: {
            code: 'CREDENTIALS_REQUIRED',
            message: 'Credenciais do Instagram não configuradas',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Extrair shortcode
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

      // Criar cliente
      const { IgApiClient } = InstagramPrivateAPI;
      const ig = new IgApiClient();

      // Login
      ig.state.generateDevice(credentials.username);
      await ig.account.login(credentials.username, credentials.password);

      // Obter mídia pelo shortcode
      const mediaInfo = await ig.media.info(shortcode);
      const media = mediaInfo.items[0];

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
      const username = media.user?.username || 'instagram';
      const caption = media.caption?.text || '';

      // Post simples ou Reel
      if (media.video_versions && media.video_versions.length > 0) {
        // Vídeo
        for (const video of media.video_versions) {
          formats.push({
            format_id: `instagram-private-${video.width}x${video.height}`,
            ext: 'mp4',
            resolution: `${video.width}x${video.height}`,
            quality: null,
            vcodec: 'unknown',
            acodec: 'unknown',
            url: video.url,
          });
        }
      } else if (media.image_versions2?.candidates) {
        // Imagem
        const image = media.image_versions2.candidates[0];
        formats.push({
          format_id: 'instagram-private-image',
          ext: 'jpg',
          resolution: `${image.width}x${image.height}`,
          quality: null,
          vcodec: 'none',
          acodec: 'none',
          url: image.url,
        });
      }

      // Carousel
      if (media.carousel_media) {
        for (const item of media.carousel_media) {
          if (item.video_versions && item.video_versions.length > 0) {
            const video = item.video_versions[0];
            formats.push({
              format_id: `instagram-carousel-${formats.length}`,
              ext: 'mp4',
              resolution: `${video.width}x${video.height}`,
              quality: null,
              vcodec: 'unknown',
              acodec: 'unknown',
              url: video.url,
            });
          } else if (item.image_versions2?.candidates) {
            const image = item.image_versions2.candidates[0];
            formats.push({
              format_id: `instagram-carousel-${formats.length}`,
              ext: 'jpg',
              resolution: `${image.width}x${image.height}`,
              quality: null,
              vcodec: 'none',
              acodec: 'none',
              url: image.url,
            });
          }
        }
      }

      if (formats.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_MEDIA',
            message: 'Nenhuma mídia encontrada',
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
        thumbnail: media.image_versions2?.candidates?.[0]?.url || formats[0]?.url,
      };

      return {
        success: true,
        data: result,
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      // Tratar erros específicos
      if (error.message?.includes('challenge_required')) {
        return {
          success: false,
          error: {
            code: 'CHALLENGE_REQUIRED',
            message: 'Instagram requer verificação de segurança',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      if (error.message?.includes('invalid_user') || error.message?.includes('bad_password')) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciais inválidas',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error.message || 'Erro ao extrair via Private API',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractShortcode(url: string): string | null {
    const postMatch = url.match(/instagram\.com\/p\/([^\/\?]+)/);
    if (postMatch) return postMatch[1];

    const reelMatch = url.match(/instagram\.com\/reel\/([^\/\?]+)/);
    if (reelMatch) return reelMatch[1];

    const tvMatch = url.match(/instagram\.com\/tv\/([^\/\?]+)/);
    if (tvMatch) return tvMatch[1];

    return null;
  }
}
