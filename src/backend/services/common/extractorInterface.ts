import type { ExtractedMediaInfo, ExtractorOptions, ExtractorResult } from './types';

/**
 * Interface comum que todos os extractors devem implementar
 */
export interface IExtractor {
  /**
   * Nome identificador do extractor (ex: "yt-dlp", "youtube-api", etc)
   */
  readonly name: string;

  /**
   * Extrai informações do vídeo a partir da URL
   * @param url URL do vídeo
   * @param options Opções adicionais (cookies, headers, etc)
   * @returns Resultado da extração com informações do vídeo ou erro
   */
  extract(url: string, options?: ExtractorOptions): Promise<ExtractorResult>;

  /**
   * Verifica se este extractor suporta a URL fornecida
   * @param url URL a ser verificada
   * @returns true se suporta, false caso contrário
   */
  supports(url: string): boolean;

  /**
   * Verifica se o extractor está disponível/saudável
   * @returns true se está disponível, false caso contrário
   */
  isAvailable(): Promise<boolean>;
}
