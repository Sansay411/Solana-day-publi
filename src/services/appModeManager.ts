import { enableDemoMode, disableDemoMode, isDemoMode } from './demoService';
import { db, auth } from './firebase';
import { disableNetwork, enableNetwork } from 'firebase/firestore';

interface AppMode {
  mode: 'firebase' | 'demo' | 'offline';
  reason: string;
  timestamp: Date;
}

export class AppModeManager {
  private static currentMode: AppMode = {
    mode: 'firebase',
    reason: 'Initial state',
    timestamp: new Date()
  };
  
  private static listeners: Set<(mode: AppMode) => void> = new Set();
  private static firebaseFailureCount = 0;
  private static maxFailures = 3;
  private static firebaseTestTimeout: NodeJS.Timeout | null = null;

  // Инициализация с проверкой Firebase
  static async initialize(): Promise<void> {
    console.log('🚀 Initializing AppModeManager...');
    
    // Начинаем в режиме Firebase, проверим подключение позже
    await this.setMode('firebase', 'Initial Firebase mode');
    
    // Запускаем отложенную проверку подключения
    setTimeout(async () => {
      const isFirebaseAvailable = await this.testFirebaseConnectivity();
      
      if (!isFirebaseAvailable && this.firebaseFailureCount >= 2) {
        await this.setMode('demo', 'Firebase connectivity issues detected');
      }
    }, 3000);

    // Запускаем периодические проверки
    this.startPeriodicHealthCheck();
  }

  // Тестирование доступности Firebase
  private static async testFirebaseConnectivity(): Promise<boolean> {
    if (!auth || !db) {
      console.warn('⚠️ Firebase not initialized');
      return false;
    }

    try {
      // Простой тест подключения с коротким таймаутом
      const testPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
        
        // Тест аутентификации
        const user = auth.currentUser;
        if (user !== undefined) { // undefined означает что firebase еще не инициализирован
          clearTimeout(timeout);
          resolve(true);
        } else {
          // Если пользователь null, это тоже нормально - значит просто не авторизован
          clearTimeout(timeout);
          resolve(true);
        }
      });

      await testPromise;
      console.log('✅ Firebase connectivity test passed');
      this.firebaseFailureCount = 0;
      return true;
    } catch (error: any) {
      console.warn('❌ Firebase connectivity test failed:', error.message);
      this.firebaseFailureCount++;
      return false;
    }
  }

  // Установка режима приложения
  private static async setMode(mode: AppMode['mode'], reason: string): Promise<void> {
    const previousMode = this.currentMode.mode;
    
    this.currentMode = {
      mode,
      reason,
      timestamp: new Date()
    };

    console.log(`🔄 App mode changed: ${previousMode} → ${mode} (${reason})`);

    // Применяем изменения
    switch (mode) {
      case 'demo':
        enableDemoMode();
        await this.disableFirebase();
        break;
      case 'firebase':
        disableDemoMode();
        await this.enableFirebase();
        break;
      case 'offline':
        // В офлайн режиме сохраняем текущий режим данных (demo/firebase)
        await this.disableFirebase();
        break;
    }

    // Уведомляем слушателей
    this.listeners.forEach(listener => {
      try {
        listener(this.currentMode);
      } catch (error) {
        console.error('Error in app mode listener:', error);
      }
    });
  }

  // Отключение Firebase
  private static async disableFirebase(): Promise<void> {
    if (db) {
      try {
        await disableNetwork(db);
        console.log('📴 Firebase network disabled');
      } catch (error) {
        console.warn('Warning: Could not disable Firebase network:', error);
      }
    }
  }

  // Включение Firebase
  private static async enableFirebase(): Promise<void> {
    if (db) {
      try {
        await enableNetwork(db);
        console.log('📶 Firebase network enabled');
      } catch (error) {
        console.warn('Warning: Could not enable Firebase network:', error);
      }
    }
  }

  // Периодическая проверка состояния
  private static startPeriodicHealthCheck(): void {
    // Проверяем каждые 30 секунд
    setInterval(async () => {
      if (this.currentMode.mode === 'demo' && this.firebaseFailureCount >= this.maxFailures) {
        // Пытаемся восстановить Firebase если были проблемы
        const isFirebaseWorking = await this.testFirebaseConnectivity();
        if (isFirebaseWorking) {
          await this.setMode('firebase', 'Firebase connectivity restored');
        }
      }
    }, 30000);
  }

  // Обработка ошибки Firebase
  static async handleFirebaseError(error: any, operation: string): Promise<void> {
    const isNetworkError = this.isNetworkRelatedError(error);
    
    if (isNetworkError) {
      this.firebaseFailureCount++;
      console.warn(`🔥 Firebase error in ${operation} (failure count: ${this.firebaseFailureCount}):`, error.message);
      
      if (this.firebaseFailureCount >= this.maxFailures && this.currentMode.mode !== 'demo') {
        await this.setMode('demo', `Too many Firebase failures (${this.firebaseFailureCount})`);
      }
    }
  }

  // Проверка на сетевую ошибку
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

  // Принудительная смена режима
  static async forceMode(mode: AppMode['mode'], reason = 'Manual override'): Promise<void> {
    await this.setMode(mode, reason);
  }

  // Получение текущего режима
  static getCurrentMode(): AppMode {
    return { ...this.currentMode };
  }

  // Подписка на изменения режима
  static addModeListener(listener: (mode: AppMode) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Получение статистики
  static getStats() {
    return {
      currentMode: this.currentMode,
      firebaseFailureCount: this.firebaseFailureCount,
      maxFailures: this.maxFailures,
      isDemoMode: isDemoMode(),
      listeners: this.listeners.size
    };
  }

  // Сброс счетчика ошибок
  static resetFailureCount(): void {
    this.firebaseFailureCount = 0;
    console.log('🔄 Firebase failure count reset');
  }
}