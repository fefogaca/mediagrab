/**
 * Twitter/X Extractor usando GraphQL API
 * Método principal para extrair vídeos do Twitter
 */

import axios, { AxiosInstance } from 'axios';
import type { IExtractor } from '../../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult, ExtractedMediaInfo, ExtractedFormat } from '../../common/types';
import { getCookies } from '../../../lib/cookies';

interface TwitterGraphQLResponse {
  data?: {
    threaded_conversation_with_injections_v2?: {
      instructions?: Array<{
        entries?: Array<{
          content?: {
            entryType?: string;
            itemContent?: {
              tweet_results?: {
                result?: {
                  legacy?: {
                    extended_entities?: {
                      media?: Array<{
                        type?: string;
                        video_info?: {
                          variants?: Array<{
                            url?: string;
                            content_type?: string;
                            bitrate?: number;
                          }>;
                        };
                        media_url_https?: string;
                      }>;
                    };
                    full_text?: string;
                  };
                };
              };
            };
          };
        }>;
      }>;
    };
  };
}

export class TwitterGraphQLExtractor implements IExtractor {
  readonly name = 'twitter-graphql';
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://twitter.com',
        'Referer': 'https://twitter.com/',
        'x-twitter-active-user': 'yes',
        'x-twitter-auth-type': 'OAuth2Session',
      },
    });
  }

  supports(url: string): boolean {
    return /(twitter\.com|x\.com)/i.test(url);
  }

  async isAvailable(): Promise<boolean> {
    // Verificar se temos cookies do Twitter
    try {
      const cookies = await getCookies();
      const twitterCookies = (cookies as any).twitter || '';
      return twitterCookies.length > 0;
    } catch {
      return false;
    }
  }

  async extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult> {
    const startTime = Date.now();

    try {
      // Extrair tweet ID da URL
      const tweetId = this.extractTweetId(url);
      if (!tweetId) {
        return {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Não foi possível extrair o ID do tweet da URL',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Obter cookies do Twitter
      const cookies = await getCookies();
      const twitterCookies = (cookies as any).twitter || '';
      
      if (!twitterCookies) {
        return {
          success: false,
          error: {
            code: 'COOKIES_REQUIRED',
            message: 'Cookies do Twitter são necessários para este método',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      // Preparar headers com cookies
      const headers: Record<string, string> = {
        ...this.axiosInstance.defaults.headers,
        'Cookie': twitterCookies,
        ...options?.headers,
      };

      // GraphQL Query para obter detalhes do tweet
      const queryId = 'VWTGQUVrTLM5Ll-K4ZGbJA'; // TweetDetail query ID (pode precisar ser atualizado)
      const variables = {
        focalTweetId: tweetId,
        with_rux_injections: false,
        includePromotedContent: true,
        withCommunity: true,
        withQuickPromoteEligibilityTweetFields: true,
        withBirdwatchNotes: true,
        withSuperFollowsUserFields: true,
        withDownvotePerspective: false,
        withReactionsMetadata: false,
        withReactionsPerspective: false,
        withSuperFollowsTweetFields: true,
        withVoice: true,
        withV2Timeline: true,
      };

      const params = {
        variables: JSON.stringify(variables),
        features: JSON.stringify({
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          articles_preview_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          responsive_web_enhance_cards_enabled: false,
        }),
      };

      const response = await this.axiosInstance.get<TwitterGraphQLResponse>(
        `https://twitter.com/i/api/graphql/${queryId}/TweetDetail`,
        {
          headers,
          params,
        }
      );

      // Parsear resposta e extrair URLs de vídeo
      const formats = this.extractVideoUrls(response.data);

      if (formats.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_VIDEOS',
            message: 'Nenhum vídeo encontrado neste tweet',
          },
          method: this.name,
          executionTime: Date.now() - startTime,
        };
      }

      const result: ExtractedMediaInfo = {
        title: `Tweet ${tweetId}`,
        formats,
      };

      return {
        success: true,
        data: result,
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error.message || 'Erro ao extrair vídeo via GraphQL',
          details: error.response?.data || error,
        },
        method: this.name,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private extractTweetId(url: string): string | null {
    // twitter.com/username/status/TWEET_ID
    const statusMatch = url.match(/\/(?:status|statuses)\/(\d+)/);
    if (statusMatch) return statusMatch[1];

    // x.com/username/status/TWEET_ID
    const xStatusMatch = url.match(/x\.com\/[^\/]+\/status\/(\d+)/);
    if (xStatusMatch) return xStatusMatch[1];

    return null;
  }

  private extractVideoUrls(data: TwitterGraphQLResponse): ExtractedFormat[] {
    const formats: ExtractedFormat[] = [];

    try {
      const instructions = data.data?.threaded_conversation_with_injections_v2?.instructions || [];
      
      for (const instruction of instructions) {
        const entries = instruction.entries || [];
        
        for (const entry of entries) {
          const tweetResult = entry.content?.itemContent?.tweet_results?.result;
          const legacy = tweetResult?.legacy;
          const media = legacy?.extended_entities?.media || [];

          for (const mediaItem of media) {
            if (mediaItem.type === 'video' && mediaItem.video_info?.variants) {
              // Ordenar por bitrate (maior primeiro)
              const variants = [...mediaItem.video_info.variants]
                .filter(v => v.content_type?.startsWith('video/'))
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

              for (const variant of variants) {
                if (!variant.url) continue;

                const quality = this.inferQuality(variant.bitrate);
                const ext = this.inferExtension(variant.content_type || '');

                formats.push({
                  format_id: `twitter-${variant.bitrate || 'unknown'}`,
                  ext,
                  resolution: quality,
                  quality: quality,
                  vcodec: this.inferVideoCodec(variant.content_type || ''),
                  acodec: 'none', // Vídeos do Twitter geralmente têm áudio embutido ou separado
                  url: variant.url,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[TwitterGraphQL] Erro ao extrair URLs:', error);
    }

    return formats;
  }

  private inferQuality(bitrate?: number): string {
    if (!bitrate) return 'Desconhecido';
    if (bitrate >= 5000000) return '1080p';
    if (bitrate >= 2500000) return '720p';
    if (bitrate >= 1000000) return '480p';
    return '360p';
  }

  private inferExtension(contentType: string): string {
    if (contentType.includes('mp4')) return 'mp4';
    if (contentType.includes('webm')) return 'webm';
    return 'mp4';
  }

  private inferVideoCodec(contentType: string): string {
    if (contentType.includes('h264') || contentType.includes('avc1')) return 'avc1';
    if (contentType.includes('vp9')) return 'vp9';
    return 'unknown';
  }
}
