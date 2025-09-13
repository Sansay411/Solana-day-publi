import { db } from './firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

interface FirebaseOfflineConfig {
  retryAttempts: number;
  retryDelay: number;
  offlineTimeout: number;
}

export class FirebaseOfflineManager {
  private static isOfflineMode = false;
  private static retryTimeouts: Set<NodeJS.Timeout> = new Set();
  private static listeners: Set<(isOffline: boolean) => void> = new Set();
  
  private static config: FirebaseOfflineConfig = {
    retryAttempts: 3,
    retryDelay: 2000,
    offlineTimeout: 10000
  };

  // Обертка для Firebase операций с автоматическим fallback
  static async withOfflineFallback<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T,
    operationName = 'Firebase operation'
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        // Устанавливаем таймаут для операции
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Operation timeout after ${this.config.offlineTimeout}ms`));
          }, this.config.offlineTimeout);
          
          this.retryTimeouts.add(timeout);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        
        // Успешная операция - выходим из офлайн режима если были в нем
        if (this.isOfflineMode) {
          this.setOfflineMode(false);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        console.warn(`${operationName} attempt ${attempt + 1} failed:`, error.message);
        
        // Проверяем на ошибки, указывающие на проблемы с сетью
        const isNetworkError = this.isNetworkRelatedError(error);
        
        if (isNetworkError) {
          if (!this.isOfflineMode) {
            console.log('Detected network issues, switching to offline mode');
            this.setOfflineMode(true);
          }
          
          // Если это последняя попытка и есть fallback
          if (attempt === this.config.retryAttempts - 1 && fallback) {
            console.log(`Using fallback for ${operationName}`);
            return await fallback();
          }
          
          // Ждем перед следующей попыткой
          if (attempt < this.config.retryAttempts - 1) {
            await this.delay(this.config.retryDelay * (attempt + 1));
          }
        } else {
          // Не сетевая ошибка - выбрасываем сразу
          throw error;
        }
      }
    }

    // Если все попытки провалились
    if (fallback) {
      console.log(`All attempts failed for ${operationName}, using fallback`);
      return await fallback();
    }

    throw lastError;
  }

  // Проверяет, является ли ошибка связанной с сетью
  private static isNetworkRelatedError(error: any): boolean {
    const networkErrorCodes = [
      'unavailable',
      'deadline-exceeded',
      'timeout',
      'network-request-failed',
      'offline'
    ];

    const networkErrorMessages = [
      'offline',
      'network',
      'timeout',
      'unavailable',
      'transport errored',
      'failed to fetch'
    ];

    if (error.code && networkErrorCodes.includes(error.code)) {
      return true;
    }

    if (error.message) {
      const message = error.message.toLowerCase();
      return networkErrorMessages.some(keyword => message.includes(keyword));
    }

    return false;
  }

  // Устанавливает режим офлайн
  private static async setOfflineMode(isOffline: boolean) {
    if (this.isOfflineMode === isOffline) return;
    
    this.isOfflineMode = isOffline;
    
    if (db) {
      try {
        if (isOffline) {
          await disableNetwork(db);
          console.log('Firebase network disabled - working offline');
        } else {
          await enableNetwork(db);
          console.log('Firebase network enabled - back online');
        }
      } catch (error) {
        console.warn('Error toggling Firebase network:', error);
      }
    }

    // Уведомляем слушателей
    this.listeners.forEach(listener => {
      try {
        listener(isOffline);
      } catch (error) {
        console.error('Error in offline mode listener:', error);
      }
    });
  }

  // Задержка
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Подписка на изменения состояния офлайн режима
  static addOfflineModeListener(listener: (isOffline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Получение текущего состояния
  static isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  // Принудительное включение/выключение офлайн режима
  static async forceOfflineMode(isOffline: boolean) {
    await this.setOfflineMode(isOffline);
  }

  // Очистка всех таймаутов
  static clearAllTimeouts() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  // Обновление конфигурации
  static updateConfig(newConfig: Partial<FirebaseOfflineConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Получение статистики
  static getStats() {
    return {
      isOfflineMode: this.isOfflineMode,
      activeTimeouts: this.retryTimeouts.size,
      listeners: this.listeners.size,
      config: { ...this.config }
    };
  }
}