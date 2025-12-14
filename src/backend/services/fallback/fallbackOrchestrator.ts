/**
 * Orquestrador de fallback
 * Executa múltiplos extractors em paralelo e retorna o primeiro resultado válido
 */

import type { IExtractor } from '../common/extractorInterface';
import type { ExtractorOptions, ExtractorResult } from '../common/types';
import { methodHealthChecker } from './methodHealthChecker';

interface OrchestratorOptions extends ExtractorOptions {
  /**
   * Se true, executa métodos em paralelo (mais rápido, mas pode usar mais recursos)
   * Se false, executa em sequência até encontrar um que funcione
   * @default true
   */
  parallel?: boolean;

  /**
   * Timeout máximo para cada método (em ms)
   * @default 30000 (30 segundos)
   */
  timeout?: number;

  /**
   * Se true, ignora health checker e tenta todos os métodos
   * @default false
   */
  ignoreHealthCheck?: boolean;
}

/**
 * Executa múltiplos extractors e retorna o primeiro resultado válido
 */
export async function executeFallback(
  extractors: IExtractor[],
  url: string,
  options: OrchestratorOptions = {}
): Promise<ExtractorResult> {
  const {
    parallel = true,
    timeout = 30000,
    ignoreHealthCheck = false,
    ...extractorOptions
  } = options;

  // Filtrar extractors disponíveis
  const availableExtractors = extractors.filter((extractor) => {
    if (!extractor.supports(url)) {
      return false;
    }
    
    if (!ignoreHealthCheck && !methodHealthChecker.isMethodAvailable(extractor.name)) {
      console.log(`[FallbackOrchestrator] Método ${extractor.name} está desabilitado (health check)`);
      return false;
    }

    return true;
  });

  if (availableExtractors.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_EXTRACTORS_AVAILABLE',
        message: 'Nenhum extractor disponível para esta URL',
      },
      method: 'none',
      executionTime: 0,
    };
  }

  if (parallel) {
    return executeParallel(availableExtractors, url, extractorOptions, timeout);
  } else {
    return executeSequential(availableExtractors, url, extractorOptions, timeout);
  }
}

/**
 * Executa extractors em paralelo usando Promise.allSettled
 */
async function executeParallel(
  extractors: IExtractor[],
  url: string,
  options: ExtractorOptions,
  timeout: number
): Promise<ExtractorResult> {
  const startTime = Date.now();

  console.log(`[FallbackOrchestrator] Tentando ${extractors.length} métodos em paralelo...`);

  // Criar promises com timeout individual
  const promises = extractors.map(async (extractor) => {
    const methodStartTime = Date.now();

    try {
      // Criar promise com timeout
      const timeoutPromise = new Promise<ExtractorResult>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      const extractPromise = extractor.extract(url, options);

      const result = await Promise.race([extractPromise, timeoutPromise]);
      
      const executionTime = Date.now() - methodStartTime;

      // Registrar sucesso ou falha no health checker
      if (result.success) {
        // Para Instagram: verificar se retornou apenas áudio
        const hasVideoFormat = result.data?.formats?.some(f => f.vcodec !== 'none' && f.vcodec !== 'unknown');
        const hasAudioOnly = result.data?.formats?.every(f => 
          (f.vcodec === 'none' || f.vcodec === 'unknown') && f.acodec !== 'none' && f.acodec !== 'unknown'
        );
        
        // Se tem vídeo ou não é apenas áudio, considerar sucesso
        if (hasVideoFormat || !hasAudioOnly) {
          methodHealthChecker.recordAttempt(extractor.name, true);
          console.log(`[FallbackOrchestrator] ✅ ${extractor.name} sucedeu em ${executionTime}ms`);
        } else {
          // Se é apenas áudio, não considerar sucesso ainda (continuar tentando)
          console.warn(`[FallbackOrchestrator] ${extractor.name} retornou apenas áudio, não considerando sucesso completo`);
        }
      } else {
        methodHealthChecker.recordAttempt(extractor.name, false);
        console.log(`[FallbackOrchestrator] ❌ ${extractor.name} falhou: ${result.error?.message}`);
      }

      return { extractor: extractor.name, result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - methodStartTime;
      methodHealthChecker.recordAttempt(extractor.name, false);
      
      console.error(`[FallbackOrchestrator] ❌ ${extractor.name} erro:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );

      return {
        extractor: extractor.name,
        result: {
          success: false,
          error: {
            code: 'EXTRACTION_ERROR',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            details: error,
          },
          method: extractor.name,
          executionTime,
        },
        executionTime,
      };
    }
  });

  // Aguardar todos os resultados
  const results = await Promise.allSettled(promises);

  // Encontrar primeiro resultado bem-sucedido com vídeo (ou qualquer resultado válido)
  for (const settledResult of results) {
    if (settledResult.status === 'fulfilled') {
      const { result } = settledResult.value;
      if (result.success && result.data) {
        // Verificar se tem vídeo (priorizar)
        const hasVideoFormat = result.data.formats?.some(f => f.vcodec !== 'none' && f.vcodec !== 'unknown');
        const hasAudioOnly = result.data.formats?.every(f => 
          (f.vcodec === 'none' || f.vcodec === 'unknown') && f.acodec !== 'none' && f.acodec !== 'unknown'
        );
        
        // Se tem vídeo, retornar imediatamente
        if (hasVideoFormat) {
          const totalTime = Date.now() - startTime;
          console.log(`[FallbackOrchestrator] ✅ Retornando resultado de ${settledResult.value.extractor} com vídeo (total: ${totalTime}ms)`);
          return {
            ...result,
            executionTime: totalTime,
          };
        }
      }
    }
  }
  
  // Se nenhum retornou vídeo, retornar o primeiro resultado válido (mesmo que seja apenas áudio)
  for (const settledResult of results) {
    if (settledResult.status === 'fulfilled') {
      const { result } = settledResult.value;
      if (result.success) {
        const totalTime = Date.now() - startTime;
        console.log(`[FallbackOrchestrator] ⚠️ Retornando resultado de ${settledResult.value.extractor} (apenas áudio ou sem vídeo) (total: ${totalTime}ms)`);
        return {
          ...result,
          executionTime: totalTime,
        };
      }
    }
  }

  // Se nenhum funcionou, retornar o primeiro erro detalhado
  const firstError = results.find(r => r.status === 'fulfilled');
  if (firstError && firstError.status === 'fulfilled') {
    const totalTime = Date.now() - startTime;
    return {
      ...firstError.value.result,
      executionTime: totalTime,
    };
  }

  const totalTime = Date.now() - startTime;
  return {
    success: false,
    error: {
      code: 'ALL_METHODS_FAILED',
      message: 'Todos os métodos de extração falharam',
    },
    method: 'all',
    executionTime: totalTime,
  };
}

/**
 * Executa extractors em sequência até encontrar um que funcione
 */
async function executeSequential(
  extractors: IExtractor[],
  url: string,
  options: ExtractorOptions,
  timeout: number
): Promise<ExtractorResult> {
  const startTime = Date.now();

  console.log(`[FallbackOrchestrator] Tentando ${extractors.length} métodos em sequência...`);

  let audioOnlyFallback: ExtractorResult | null = null;

  for (const extractor of extractors) {
    const methodStartTime = Date.now();

    try {
      const timeoutPromise = new Promise<ExtractorResult>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      const extractPromise = extractor.extract(url, options);
      const result = await Promise.race([extractPromise, timeoutPromise]);
      const executionTime = Date.now() - methodStartTime;

      if (result.success && result.data) {
        // Para Instagram: verificar se retornou apenas áudio (problema comum)
        // Se retornou apenas áudio, continuar tentando outros métodos que possam ter vídeo
        const hasVideoFormat = result.data.formats?.some(f => f.vcodec !== 'none' && f.vcodec !== 'unknown');
        const hasAudioOnly = result.data.formats?.length > 0 && result.data.formats?.every(f => 
          (f.vcodec === 'none' || f.vcodec === 'unknown') && f.acodec !== 'none' && f.acodec !== 'unknown'
        );
        const videoFormatsCount = result.data.formats?.filter(f => f.vcodec !== 'none' && f.vcodec !== 'unknown').length || 0;
        
        console.log(`[FallbackOrchestrator] ${extractor.name} resultado:`, {
          success: true,
          formatsTotal: result.data.formats?.length || 0,
          videoFormats: videoFormatsCount,
          audioOnly: hasAudioOnly,
        });
        
        // Se tem vídeo, retornar imediatamente (sucesso)
        if (hasVideoFormat) {
          methodHealthChecker.recordAttempt(extractor.name, true);
          const totalTime = Date.now() - startTime;
          console.log(`[FallbackOrchestrator] ✅ ${extractor.name} sucedeu com vídeo (${videoFormatsCount} formatos) em ${executionTime}ms (total: ${totalTime}ms)`);
          return {
            ...result,
            executionTime: totalTime,
          };
        }
        
        // Se é apenas áudio, continuar tentando outros métodos
        // Mas manter este resultado como fallback caso todos falhem
        if (hasAudioOnly) {
          console.warn(`[FallbackOrchestrator] ⚠️ ${extractor.name} retornou apenas áudio (${result.data.formats?.length} formatos), continuando para outros métodos...`);
          // Guardar como fallback caso nenhum outro método retorne vídeo
          if (!audioOnlyFallback) {
            audioOnlyFallback = result;
          }
          // Continuar para próximo método
          continue;
        } else {
          // Tem formatos mas não identificamos como vídeo ou áudio apenas - assumir sucesso
          methodHealthChecker.recordAttempt(extractor.name, true);
          const totalTime = Date.now() - startTime;
          console.log(`[FallbackOrchestrator] ✅ ${extractor.name} sucedeu em ${executionTime}ms (total: ${totalTime}ms)`);
          return {
            ...result,
            executionTime: totalTime,
          };
        }
      } else if (result.success) {
        // Sucesso mas sem data - retornar mesmo assim
        methodHealthChecker.recordAttempt(extractor.name, true);
        const totalTime = Date.now() - startTime;
        return {
          ...result,
          executionTime: totalTime,
        };
      } else {
        methodHealthChecker.recordAttempt(extractor.name, false);
        console.log(`[FallbackOrchestrator] ❌ ${extractor.name} falhou: ${result.error?.message}`);
      }
    } catch (error) {
      const executionTime = Date.now() - methodStartTime;
      methodHealthChecker.recordAttempt(extractor.name, false);
      console.error(`[FallbackOrchestrator] ❌ ${extractor.name} erro:`, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      // Continuar para o próximo método
    }
  }

  // Se nenhum retornou vídeo, mas temos um fallback com áudio, retornar ele
  if (audioOnlyFallback) {
    const totalTime = Date.now() - startTime;
    console.warn(`[FallbackOrchestrator] Nenhum método retornou vídeo, retornando resultado com apenas áudio como fallback`);
    return {
      ...audioOnlyFallback,
      executionTime: totalTime,
    };
  }

  // Se nenhum funcionou
  const totalTime = Date.now() - startTime;
  return {
    success: false,
    error: {
      code: 'ALL_METHODS_FAILED',
      message: 'Todos os métodos de extração falharam',
    },
    method: 'sequential',
    executionTime: totalTime,
  };
}
