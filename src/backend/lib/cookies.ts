import fs from 'fs';
import path from 'path';
import os from 'os';
import Settings from '../models/Settings';

interface CookiesData {
  instagram: string;
  youtube: string;
}

// Cache simples para cookies (evita múltiplas queries ao banco)
let cookiesCache: CookiesData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Obtém os cookies do banco de dados (com cache para evitar problemas de pool)
 */
export async function getCookies(): Promise<CookiesData> {
  // Retornar cache se ainda válido
  if (cookiesCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cookiesCache;
  }

  try {
    const settings = await Settings.getSettings();
    const cookies = typeof settings.cookies === 'string'
      ? JSON.parse(settings.cookies)
      : settings.cookies || { instagram: "", youtube: "" };
    
    // Atualizar cache
    cookiesCache = cookies as CookiesData;
    cacheTimestamp = Date.now();
    
    return cookiesCache;
  } catch (error) {
    console.error('Erro ao obter cookies:', error);
    // Retornar cache antigo se houver, senão retornar vazio
    return cookiesCache || { instagram: "", youtube: "" };
  }
}

/**
 * Escreve cookies em arquivo temporário e retorna o caminho
 * @param cookieContent Conteúdo do arquivo de cookies
 * @param platform Plataforma (instagram ou youtube)
 * @returns Caminho do arquivo temporário ou null se não houver conteúdo
 */
export function writeCookiesToTemp(cookieContent: string, platform: 'instagram' | 'youtube'): string | null {
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
 * @param platform Plataforma (instagram ou youtube)
 * @returns Caminho do arquivo temporário ou null se não houver cookies
 */
export async function getCookiesFilePath(platform: 'instagram' | 'youtube'): Promise<string | null> {
  const cookies = await getCookies();
  const cookieContent = platform === 'instagram' ? cookies.instagram : cookies.youtube;
  
  if (!cookieContent || cookieContent.trim() === '') {
    return null;
  }

  return writeCookiesToTemp(cookieContent, platform);
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

