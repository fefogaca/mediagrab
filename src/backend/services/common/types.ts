/**
 * Tipos compartilhados para todos os extractors
 */

export interface ExtractedFormat {
  format_id: string;
  ext: string;
  resolution: string;
  quality?: string | null;
  vcodec: string;
  acodec: string;
  filesize_approx?: number;
  url?: string; // URL direta do stream (quando disponível)
}

export interface ExtractedMediaInfo {
  title: string;
  formats: ExtractedFormat[];
  thumbnail?: string;
  duration?: number;
  description?: string;
}

export interface ExtractorOptions {
  cookies?: string;
  userAgent?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ExtractorResult {
  success: boolean;
  data?: ExtractedMediaInfo;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  method: string; // Nome do método que foi usado
  executionTime: number; // Tempo de execução em ms
}
