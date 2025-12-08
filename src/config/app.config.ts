/**
 * Configurações da Aplicação
 * 
 * Este arquivo contém todas as configurações da aplicação que podem ser
 * facilmente modificadas sem alterar o código.
 */

export const appConfig = {
  /**
   * URL base da API para downloads
   * Quando o usuário clica em download, será redirecionado para esta URL
   * 
   * Exemplo: 'https://api.felipefogaca.net'
   * Para desenvolvimento local: 'http://localhost:3000'
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.felipefogaca.net',

  /**
   * URL base da aplicação web
   * Usado para gerar links completos quando necessário
   */
  webBaseUrl: process.env.NEXT_PUBLIC_WEB_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',

  /**
   * Configurações de UI
   */
  ui: {
    /**
     * Título da aplicação
     */
    appName: 'MediaGrab',
    
    /**
     * Descrição curta da aplicação
     */
    appDescription: 'API poderosa e confiável para download de mídia de diversas plataformas online',
    
    /**
     * Email de contato
     */
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contato@felipefogaca.net',
    
    /**
     * Link do desenvolvedor
     */
    developerUrl: 'https://felipefogaca.net',
  },

  /**
   * Configurações de API
   */
  api: {
    /**
     * Timeout padrão para requisições (em milissegundos)
     */
    timeout: 30000, // 30 segundos
    
    /**
     * Número máximo de tentativas em caso de falha
     */
    maxRetries: 3,
  },

  /**
   * Configurações de features
   */
  features: {
    /**
     * Habilitar modo de desenvolvimento (mostra mais logs, etc)
     */
    developmentMode: process.env.NODE_ENV === 'development',
    
    /**
     * Habilitar analytics (se implementado no futuro)
     */
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
} as const;

/**
 * Helper para construir URLs completas da API
 */
export function buildApiUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, appConfig.apiBaseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

/**
 * Helper para construir URLs de download direto
 */
export function buildDownloadUrl(videoUrl: string, formatId: string, source: string = 'yt-dlp'): string {
  return buildApiUrl('/api/download-direct', {
    url: videoUrl,
    format: formatId,
    source,
  });
}

