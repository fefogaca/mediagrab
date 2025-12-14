/**
 * Health Checker para métodos de extração
 * Monitora a saúde de cada método e desabilita temporariamente métodos problemáticos
 */

interface MethodHealth {
  method: string;
  isEnabled: boolean;
  successCount: number;
  failureCount: number;
  lastSuccess?: number;
  lastFailure?: number;
  consecutiveFailures: number;
  disabledUntil?: number;
}

class MethodHealthChecker {
  private healthMap: Map<string, MethodHealth> = new Map();
  
  // Configurações
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly COOLDOWN_TIME = 5 * 60 * 1000; // 5 minutos
  private readonly RESET_SUCCESS_THRESHOLD = 10; // Resetar após 10 sucessos consecutivos

  /**
   * Registra uma tentativa de uso de um método
   */
  recordAttempt(method: string, success: boolean): void {
    const health = this.getOrCreateHealth(method);

    if (success) {
      health.successCount++;
      health.lastSuccess = Date.now();
      health.consecutiveFailures = 0;
      
      // Reativar método se estava desabilitado
      if (!health.isEnabled && health.disabledUntil && Date.now() > health.disabledUntil) {
        health.isEnabled = true;
        health.disabledUntil = undefined;
        console.log(`[HealthChecker] Método ${method} reativado após sucesso`);
      }
    } else {
      health.failureCount++;
      health.lastFailure = Date.now();
      health.consecutiveFailures++;

      // Desabilitar se exceder limite de falhas
      if (health.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        health.isEnabled = false;
        health.disabledUntil = Date.now() + this.COOLDOWN_TIME;
        console.warn(
          `[HealthChecker] Método ${method} desabilitado após ${health.consecutiveFailures} falhas consecutivas. ` +
          `Reativará em ${this.COOLDOWN_TIME / 1000}s`
        );
      }
    }
  }

  /**
   * Verifica se um método está disponível
   */
  isMethodAvailable(method: string): boolean {
    const health = this.getOrCreateHealth(method);

    // Se está desabilitado e ainda não passou o cooldown
    if (!health.isEnabled && health.disabledUntil) {
      if (Date.now() < health.disabledUntil) {
        return false;
      }
      // Cooldown expirou, reativar
      health.isEnabled = true;
      health.disabledUntil = undefined;
      console.log(`[HealthChecker] Método ${method} reativado após cooldown`);
    }

    return health.isEnabled !== false;
  }

  /**
   * Obtém estatísticas de um método
   */
  getMethodStats(method: string): {
    isEnabled: boolean;
    successCount: number;
    failureCount: number;
    successRate: number;
    consecutiveFailures: number;
    disabledUntil?: number;
  } {
    const health = this.getOrCreateHealth(method);
    const total = health.successCount + health.failureCount;
    const successRate = total > 0 ? (health.successCount / total) * 100 : 0;

    return {
      isEnabled: this.isMethodAvailable(method),
      successCount: health.successCount,
      failureCount: health.failureCount,
      successRate: Math.round(successRate * 100) / 100,
      consecutiveFailures: health.consecutiveFailures,
      disabledUntil: health.disabledUntil,
    };
  }

  /**
   * Obtém estatísticas de todos os métodos
   */
  getAllStats(): Record<string, ReturnType<typeof this.getMethodStats>> {
    const stats: Record<string, ReturnType<typeof this.getMethodStats>> = {};
    
    const methods = Array.from(this.healthMap.keys());
    for (const method of methods) {
      stats[method] = this.getMethodStats(method);
    }

    return stats;
  }

  /**
   * Reseta as estatísticas de um método
   */
  resetMethod(method: string): void {
    this.healthMap.delete(method);
    console.log(`[HealthChecker] Estatísticas de ${method} resetadas`);
  }

  /**
   * Obtém ou cria um registro de saúde para um método
   */
  private getOrCreateHealth(method: string): MethodHealth {
    if (!this.healthMap.has(method)) {
      this.healthMap.set(method, {
        method,
        isEnabled: true,
        successCount: 0,
        failureCount: 0,
        consecutiveFailures: 0,
      });
    }
    return this.healthMap.get(method)!;
  }
}

// Singleton
export const methodHealthChecker = new MethodHealthChecker();
