import fs from 'fs';
import path from 'path';
import os from 'os';
import Settings from '../models/Settings';

interface CookiesData {
  instagram: string;
  youtube: string;
  twitter?: string;
}

/**
 * Configuração de cookies do navegador
 * Permite usar --cookies-from-browser do yt-dlp
 */
export interface BrowserCookieConfig {
  enabled: boolean;
  browser: 'chrome' | 'firefox' | 'edge' | 'safari' | 'opera' | 'brave';
  profile?: string; // Perfil específico do navegador (opcional)
}

/**
 * Obtém configuração de cookies do navegador das settings
 * Suporta configuração por plataforma ou global
 */
export async function getBrowserCookieConfig(
  platform?: 'instagram' | 'youtube' | 'twitter'
): Promise<BrowserCookieConfig | null> {
  try {
    const settings = await Settings.getSettings();
    const cookiesConfig = typeof settings.cookies === 'string'
      ? JSON.parse(settings.cookies)
      : settings.cookies || {};
    
    // Verificar se há configuração de cookies do navegador
    // Formato esperado: { browserCookieConfig: { enabled: true, browser: 'chrome' } }
    // Ou por plataforma: { browserCookieConfig: { instagram: { enabled: true, browser: 'chrome' } } }
    const browserConfig = (cookiesConfig as any).browserCookieConfig;
    if (!browserConfig) {
      return null;
    }

    // Se for configuração por plataforma
    if (platform && browserConfig[platform]) {
      const platformConfig = browserConfig[platform];
      if (platformConfig.enabled && platformConfig.browser) {
        return {
          enabled: true,
          browser: platformConfig.browser,
          profile: platformConfig.profile,
        };
      }
    }

    // Configuração global
    if (browserConfig.enabled && browserConfig.browser) {
      return {
        enabled: true,
        browser: browserConfig.browser,
        profile: browserConfig.profile,
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao obter configuração de cookies do navegador:', error);
    return null;
  }
}

/**
 * Verifica se deve usar cookies do navegador
 */
export async function shouldUseBrowserCookies(platform: 'instagram' | 'youtube' | 'twitter'): Promise<BrowserCookieConfig | null> {
  const config = await getBrowserCookieConfig(platform);
  if (!config || !config.enabled) {
    return null;
  }
  return config;
}

// Cache simples para cookies (evita múltiplas queries ao banco)
let cookiesCache: CookiesData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Obtém os cookies do banco de dados (com cache para evitar problemas de pool)
 * Agora com validação automática
 */
export async function getCookies(): Promise<CookiesData> {
  // Retornar cache se ainda válido
  if (cookiesCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cookiesCache;
  }

  try {
    // Usar cookieManager para obter com validação
    const { cookieManager } = await import('../services/cookies/cookieManager');
    
    const youtube = await cookieManager.getCookies('youtube', false) || "";
    const instagram = await cookieManager.getCookies('instagram', false) || "";
    const twitter = await cookieManager.getCookies('twitter', false) || "";
    
    // Atualizar cache
    cookiesCache = { instagram, youtube, twitter };
    cacheTimestamp = Date.now();
    
    return cookiesCache;
  } catch (error) {
    console.error('Erro ao obter cookies:', error);
    // Fallback para método antigo se cookieManager falhar
    try {
      const settings = await Settings.getSettings();
      const cookies = typeof settings.cookies === 'string'
        ? JSON.parse(settings.cookies)
        : settings.cookies || { instagram: "", youtube: "", twitter: "" };
      
      cookiesCache = cookies as CookiesData;
      cacheTimestamp = Date.now();
      
      return cookiesCache;
    } catch (fallbackError) {
      console.error('Erro no fallback de cookies:', fallbackError);
      return cookiesCache || { instagram: "", youtube: "", twitter: "" };
    }
  }
}

/**
 * Escreve cookies em arquivo temporário e retorna o caminho
 * @param cookieContent Conteúdo do arquivo de cookies
 * @param platform Plataforma (instagram, youtube ou twitter)
 * @returns Caminho do arquivo temporário ou null se não houver conteúdo
 */
export function writeCookiesToTemp(cookieContent: string, platform: 'instagram' | 'youtube' | 'twitter'): string | null {
  if (!cookieContent || cookieContent.trim() === '') {
    return null;
  }

  try {
    const tempDir = os.tmpdir();
    const fileName = `cookies_${platform}_${Date.now()}.txt`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, cookieContent, 'utf-8');
    
    // Limpar arquivo após 5 minutos (300000ms)
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        // Ignorar erros ao limpar
      }
    }, 300000);

    return filePath;
  } catch (error) {
    console.error(`Erro ao escrever cookies temporários para ${platform}:`, error);
    return null;
  }
}

/**
 * Obtém o caminho do arquivo de cookies para uma plataforma específica
 * OU retorna configuração para usar cookies do navegador
 * @param platform Plataforma (instagram, youtube ou twitter)
 * @returns Objeto com tipo de cookie: { type: 'file', path: string } | { type: 'browser', browser: string, profile?: string } | null
 */
export async function getCookiesConfig(
  platform: 'instagram' | 'youtube' | 'twitter'
): Promise<{ type: 'file'; path: string } | { type: 'browser'; browser: string; profile?: string } | null> {
  // Primeiro, verificar se deve usar cookies do navegador
  const browserConfig = await shouldUseBrowserCookies(platform);
  if (browserConfig) {
    return {
      type: 'browser',
      browser: browserConfig.browser,
      profile: browserConfig.profile,
    };
  }

  // Senão, usar arquivo de cookies (comportamento padrão)
  const cookies = await getCookies();
  const cookieContent = 
    platform === 'instagram' ? cookies.instagram :
    platform === 'youtube' ? cookies.youtube :
    cookies.twitter || '';
  
  if (!cookieContent || cookieContent.trim() === '') {
    return null;
  }

  const filePath = writeCookiesToTemp(cookieContent, platform);
  if (!filePath) {
    return null;
  }

  return {
    type: 'file',
    path: filePath,
  };
}

/**
 * Obtém o caminho do arquivo de cookies para uma plataforma específica (compatibilidade)
 * @param platform Plataforma (instagram, youtube ou twitter)
 * @returns Caminho do arquivo temporário ou null se não houver cookies ou se usar cookies do navegador
 * @deprecated Use getCookiesConfig() para suporte a cookies do navegador
 */
export async function getCookiesFilePath(platform: 'instagram' | 'youtube' | 'twitter'): Promise<string | null> {
  const config = await getCookiesConfig(platform);
  if (config?.type === 'file') {
    return config.path;
  }
  return null;
}

/**
 * Limpa arquivos de cookies temporários antigos
 */
export function cleanupTempCookies(): void {
  try {
    const tempDir = os.tmpdir();
    const files = fs.readdirSync(tempDir);
    
    files.forEach(file => {
      if (file.startsWith('cookies_') && file.endsWith('.txt')) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          // Remover arquivos mais antigos que 10 minutos
          if (Date.now() - stats.mtimeMs > 600000) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          // Ignorar erros
        }
      }
    });
  } catch (error) {
    // Ignorar erros na limpeza
  }
}

