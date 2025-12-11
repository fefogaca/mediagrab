import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

/**
 * Obtém a URL base da aplicação a partir de uma requisição Next.js
 * Prioriza variáveis de ambiente e evita usar 0.0.0.0 ou localhost em produção
 */
export function getBaseUrlFromRequest(request: { 
  nextUrl: { origin: string; searchParams?: any };
  headers: { get: (key: string) => string | null };
  url: string;
}): string {
  // Prioridade 1: Variáveis de ambiente
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Prioridade 2: Usar o host da requisição (mais confiável que origin)
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.url.startsWith('https') ? 'https' : 'http');
  
  if (host && !host.includes('0.0.0.0') && !host.includes('localhost')) {
    return `${protocol}://${host}`;
  }
  
  // Prioridade 3: Usar origin se não for 0.0.0.0
  const origin = request.nextUrl.origin;
  if (origin && !origin.includes('0.0.0.0')) {
    return origin;
  }
  
  // Fallback: usar configuração padrão
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}