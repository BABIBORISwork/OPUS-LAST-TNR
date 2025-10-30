import { config } from '../config';
import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryManager {
  private static defaultOptions: RetryOptions = {
    maxAttempts: config.retry.maxAttempts,
    delayMs: config.retry.delayMs,
    backoffMultiplier: config.retry.backoffMultiplier,
    retryCondition: (error: any) => {
      // Retry sur les erreurs de timeout, réseau, et éléments non trouvés
      const retryableErrors = [
        'TimeoutError',
        'NetworkError',
        'Element not found',
        'Element not visible',
        'Element not attached',
        'Navigation timeout'
      ];
      
      const errorMessage = error?.message || error?.toString() || '';
      return retryableErrors.some(retryableError => 
        errorMessage.includes(retryableError)
      );
    }
  };

  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const finalOptions = { ...RetryManager.defaultOptions, ...options };
    let lastError: any;
    let delay = finalOptions.delayMs!;

    for (let attempt = 1; attempt <= finalOptions.maxAttempts!; attempt++) {
      try {
        logger.debug(`Tentative ${attempt}/${finalOptions.maxAttempts} pour: ${operationName}`);
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`✅ Opération réussie au ${attempt}ème essai: ${operationName}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Vérifier si on doit retry
        if (attempt === finalOptions.maxAttempts || 
            !finalOptions.retryCondition!(error)) {
          logger.error(`❌ Échec définitif après ${attempt} tentatives: ${operationName}`, { error: error.message });
          throw error;
        }

        logger.logRetry(operationName, attempt, finalOptions.maxAttempts!, error.message);
        
        // Attendre avant le prochain essai
        if (attempt < finalOptions.maxAttempts!) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= finalOptions.backoffMultiplier!;
        }
      }
    }

    throw lastError;
  }

  public static async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs: number = config.timeoutMs,
    intervalMs: number = 1000,
    conditionName: string = 'condition'
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        if (await condition()) {
          logger.debug(`✅ Condition satisfaite: ${conditionName}`);
          return;
        }
      } catch (error) {
        logger.debug(`Condition en attente: ${conditionName}`, { error: error.message });
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Timeout: La condition '${conditionName}' n'a pas été satisfaite dans les ${timeoutMs}ms`);
  }

  public static async safeExecute<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      logger.warn(`⚠️ Opération échouée (mode sécurisé): ${operationName}`, { error: error.message });
      return fallbackValue;
    }
  }
}
