/**
 * Twitter/X Extractor usando scraping HTML
 * Extrai JSON embutido no HTML da página
 */

import * as cheerio from 'cheerio';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';

interface TwitterEmbeddedData {
  [key: string]: any;
}

export class TwitterScrapingExtractor implements IExtractor {
  readonly name = 'twitter-scraping';

  supports(url: string): boolean {
    return /(twitter\.com|x\.com)/i.test(url);
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

      // Tentar encontrar dados embutidos no HTML
      let videoUrl: string | null = null;
      let tweetId: string | null = null;

      // Extrair tweet ID da URL primeiro (para filtrar URLs incorretas depois)
      tweetId = this.extractTweetId(url);
      console.log(`[TwitterScrapingExtractor] Procurando vídeo para tweet ID: ${tweetId}`);

      // Método 1: Procurar em scripts com dados JSON estruturados
      const scripts = $('script').toArray();
      for (const script of scripts) {
        const scriptText = $(script).html() || '';

        // Procurar por padrões JSON estruturados
        // Twitter/X agora usa diferentes estruturas de dados
        const patterns = [
          // Estrutura mais recente: dados dentro de script type="application/json"
          /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]+?)<\/script>/,
          // Estrutura antiga: __INITIAL_STATE__
          /window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/,
          // Dados embutidos no HTML
          /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]+?)<\/script>/,
        ];

        for (const pattern of patterns) {
          const match = scriptText.match(pattern);
          if (match && match[1]) {
            try {
              // Tentar parsear como JSON
              const data = JSON.parse(match[1]);
              const foundUrls = this.findAllVideoUrlsInStructuredData(data, tweetId);
              
              // Filtrar e priorizar URLs válidas
              const validUrls = foundUrls.filter(url => this.isValidVideoUrl(url));
              
              if (validUrls.length > 0) {
                // Priorizar video.twimg.com/ext_tw_video (vídeos reais de tweets)
                const priorityUrl = validUrls.find(url => url.includes('video.twimg.com/ext_tw_video')) ||
                                   validUrls.find(url => url.includes('video.twimg.com')) ||
                                   validUrls[0];
                
                videoUrl = priorityUrl;
                console.log(`[TwitterScrapingExtractor] ✅ Vídeo encontrado via dados estruturados: ${videoUrl.substring(0, 100)}...`);
                break;
              }
            } catch (e) {
              // Continuar procurando
            }
          }
        }

        if (videoUrl) break;
      }

      // Método 2: Procurar em meta tags (filtrar URLs promocionais/fixas)
      // IMPORTANTE: Meta tags geralmente têm vídeos promocionais, então vamos pular
      // e procurar diretamente nos dados estruturados primeiro
      
      // Método 3: Procurar em elementos de vídeo (filtrar URLs promocionais)
      // Coletar todos os elementos de vídeo primeiro, depois filtrar
      const videoElements = $('video[src], video source[src]').toArray();
      const candidateUrls: string[] = [];
      
      for (const element of videoElements) {
        const url = $(element).attr('src');
        if (url && url.startsWith('http')) {
          candidateUrls.push(url);
        }
      }
      
      // Priorizar URLs de video.twimg.com (vídeos reais de tweets)
      const validUrls = candidateUrls.filter(url => this.isValidVideoUrl(url));
      if (validUrls.length > 0) {
        // Priorizar video.twimg.com
        const videoTwimgUrls = validUrls.filter(url => url.includes('video.twimg.com'));
        if (videoTwimgUrls.length > 0) {
          videoUrl = videoTwimgUrls[0];
          console.log(`[TwitterScrapingExtractor] ✅ Vídeo encontrado via elemento <video> (video.twimg.com): ${videoUrl.substring(0, 100)}...`);
        } else {
          videoUrl = validUrls[0];
          console.log(`[TwitterScrapingExtractor] ✅ Vídeo encontrado via elemento <video>: ${videoUrl.substring(0, 100)}...`);
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

      // Criar formato básico
      // Twitter geralmente tem vídeo+áudio em MP4, então assumir que tem ambos
      // Se for URL de vídeo do Twitter, provavelmente tem vídeo e áudio combinados
      const formats: ExtractedFormat[] = [{
        format_id: 'twitter-scraped',
        ext: 'mp4',
        resolution: 'Desconhecido',
        quality: null,
        vcodec: 'h264', // Assumir H.264 (padrão do Twitter)
        acodec: 'aac', // Assumir AAC (padrão do Twitter)
        url: videoUrl,
      }];

      const result: ExtractedMediaInfo = {
        title: `Tweet ${tweetId || 'Video'}`,
        formats,
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
          message: error instanceof Error ? error.message : 'Erro ao fazer scraping do Twitter',
          details: error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractTweetId(url: string): string | null {
    const statusMatch = url.match(/\/(?:status|statuses)\/(\d+)/);
    if (statusMatch) return statusMatch[1];

    const xStatusMatch = url.match(/x\.com\/[^\/]+\/status\/(\d+)/);
    if (xStatusMatch) return xStatusMatch[1];

    return null;
  }

  /**
   * Busca TODAS as URLs de vídeo em dados estruturados do Twitter/X
   * Retorna múltiplas URLs para filtrar depois
   */
  private findAllVideoUrlsInStructuredData(data: any, tweetId: string | null): string[] {
    const urls: string[] = [];
    if (!data) return urls;

    // Estrutura comum do Twitter/X: tentar navegar até o tweet específico
    const pathsToTry = [
      // Estrutura __NEXT_DATA__
      ['props', 'pageProps', 'tweetDetails', 'legacy', 'extended_entities', 'media'],
      // Estrutura alternativa
      ['entry', 'entries', '0', 'content', 'itemContent', 'tweet_results', 'result', 'legacy', 'extended_entities', 'media'],
      // Estrutura mais recente
      ['tweet', 'video', 'variants'],
      // Estrutura GraphQL
      ['data', 'threaded_conversation_with_injections_v2', 'instructions', '0', 'entries', '0', 'content', 'itemContent', 'tweet_results', 'result'],
    ];

    for (const path of pathsToTry) {
      let current = data;
      for (const key of path) {
        if (current && typeof current === 'object') {
          if (Array.isArray(current) && key.match(/^\d+$/)) {
            // Se for array, tentar todas as entradas
            for (const item of current) {
              const itemUrls = this.extractAllVideoUrlsFromMedia(item, tweetId);
              urls.push(...itemUrls);
            }
            current = null;
            break;
          } else {
            current = current[key];
          }
        } else {
          current = null;
          break;
        }
      }

      if (current) {
        const itemUrls = this.extractAllVideoUrlsFromMedia(current, tweetId);
        urls.push(...itemUrls);
      }
    }

    // Fallback: busca recursiva geral
    const fallbackUrl = this.findVideoUrl(data, tweetId);
    if (fallbackUrl) {
      urls.push(fallbackUrl);
    }

    // Remover duplicatas
    return [...new Set(urls)];
  }

  /**
   * Busca URL de vídeo em dados estruturados do Twitter/X (método antigo para compatibilidade)
   */
  private findVideoUrlInStructuredData(data: any, tweetId: string | null): string | null {
    const urls = this.findAllVideoUrlsInStructuredData(data, tweetId);
    if (urls.length === 0) return null;
    
    // Priorizar video.twimg.com/ext_tw_video
    const priorityUrl = urls.find(url => url.includes('video.twimg.com/ext_tw_video')) ||
                       urls.find(url => url.includes('video.twimg.com')) ||
                       urls[0];
    
    return priorityUrl || null;
  }

  /**
   * Extrai TODAS as URLs de vídeo de um objeto media do Twitter
   */
  private extractAllVideoUrlsFromMedia(media: any, tweetId: string | null): string[] {
    const urls: string[] = [];
    
    if (Array.isArray(media)) {
      for (const item of media) {
        const itemUrls = this.extractAllVideoUrlsFromMedia(item, tweetId);
        urls.push(...itemUrls);
      }
    } else if (media && typeof media === 'object') {
      // Procurar em variants (formato preferido do Twitter)
      if (media.video_info?.variants) {
        const variants = media.video_info.variants;
        // Coletar todos os MP4 (priorizar bitrate mais alto depois)
        const videoVariants = variants
          .filter((v: any) => v.content_type === 'video/mp4' && v.url)
          .map((v: any) => v.url);
        
        urls.push(...videoVariants);
      }

      // Procurar diretamente por video_url
      if (media.video_url && typeof media.video_url === 'string') {
        urls.push(media.video_url);
      }

      // Buscar recursivamente em chaves comuns
      const keysToCheck = ['video', 'media', 'variants', 'video_info', 'media_url_https'];
      for (const key of keysToCheck) {
        if (media[key]) {
          const itemUrls = this.extractAllVideoUrlsFromMedia(media[key], tweetId);
          urls.push(...itemUrls);
        }
      }
    }

    return urls;
  }

  /**
   * Extrai URL de vídeo de um objeto media do Twitter (método antigo para compatibilidade)
   */
  private extractVideoUrlFromMedia(media: any, tweetId: string | null): string | null {
    const urls = this.extractAllVideoUrlsFromMedia(media, tweetId);
    if (urls.length === 0) return null;
    
    // Filtrar e priorizar URLs válidas
    const validUrls = urls.filter(url => this.isValidVideoUrl(url));
    if (validUrls.length === 0) return null;
    
    // Priorizar video.twimg.com/ext_tw_video
    return validUrls.find(url => url.includes('video.twimg.com/ext_tw_video')) ||
           validUrls.find(url => url.includes('video.twimg.com')) ||
           validUrls[0] ||
           null;
  }

  /**
   * Busca recursiva geral de URLs de vídeo (com filtros)
   */
  private findVideoUrl(data: any, tweetId: string | null = null): string | null {
    if (!data) return null;

    // Procurar recursivamente por URLs de vídeo
    if (typeof data === 'string' && data.startsWith('http')) {
      // Validar que é uma URL de vídeo válida (não promocional/fixa)
      if (this.isValidVideoUrl(data)) {
        return data;
      }
      return null;
    }

    if (typeof data === 'object') {
      for (const key in data) {
        if (key.toLowerCase().includes('video') || key.toLowerCase().includes('url')) {
          const value = data[key];
          if (typeof value === 'string' && value.startsWith('http')) {
            if (this.isValidVideoUrl(value)) {
              return value;
            }
          }
        }

        const result = this.findVideoUrl(data[key], tweetId);
        if (result) return result;
      }
    }

    return null;
  }

  /**
   * Valida se uma URL é uma URL de vídeo válida do tweet (não promocional/fixa)
   */
  private isValidVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // REJEITAR TODOS os vídeos de abs.twimg.com - são sempre promocionais/estáticos
    if (url.includes('abs.twimg.com')) {
      console.log(`[TwitterScrapingExtractor] ❌ URL rejeitada (abs.twimg.com é sempre promocional): ${url.substring(0, 100)}...`);
      return false;
    }

    // Filtrar URLs conhecidas como promocionais/fixas
    const blacklist = [
      'grok',
      'promo',
      'advertisement',
      'ad',
      'key-visual',
      'hero-video',
      'sticky', // Vídeos "sticky" são geralmente promocionais
      'inapp',  // Vídeos "inapp" são geralmente promocionais
    ];

    const urlLower = url.toLowerCase();
    for (const blacklisted of blacklist) {
      if (urlLower.includes(blacklisted.toLowerCase())) {
        console.log(`[TwitterScrapingExtractor] ❌ URL rejeitada (blacklist): ${url.substring(0, 100)}...`);
        return false;
      }
    }

    // Twitter usa principalmente video.twimg.com para vídeos de tweets reais
    // URLs de vídeos de tweets têm padrões específicos:
    // - video.twimg.com/ext_tw_video/... (formato mais comum)
    // - video.twimg.com/video/... (formato alternativo)
    // - video.pscp.tv/... (Periscope)
    const validPatterns = [
      'video.twimg.com/ext_tw_video',
      'video.twimg.com/video',
      'video.pscp.tv',
    ];

    const hasValidPattern = validPatterns.some(pattern => url.includes(pattern));
    
    const isValid = hasValidPattern &&
      !url.includes('thumbnail') &&
      !url.includes('preview') &&
      !url.includes('thumb');

    if (!isValid) {
      console.log(`[TwitterScrapingExtractor] ⚠️ URL não corresponde aos padrões de vídeo de tweet: ${url.substring(0, 100)}...`);
    } else {
      console.log(`[TwitterScrapingExtractor] ✅ URL válida de vídeo de tweet: ${url.substring(0, 100)}...`);
    }

    return isValid;
  }
}
