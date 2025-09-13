import { db } from './firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { FirebaseOfflineManager } from './firebaseOffline';

export class ConnectionManager {
  private static isOnline = navigator.onLine;
  private static listeners: Set<(isOnline: boolean) => void> = new Set();
  private static firebaseConnected = true;
  
  static {
    // Слушаем изменения сетевого статуса
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Проверяем подключение к Firebase периодически
    this.startConnectionMonitoring();
  }

  private static async handleOnline() {
    this.isOnline = true;
    console.log('Network connection restored');
    
    // Попытка восстановить Firebase соединение
    try {
      await FirebaseOfflineManager.forceOfflineMode(false);
      this.firebaseConnected = true;
      console.log('Firebase connection restored');
    } catch (error) {
      console.warn('Failed to restore Firebase connection:', error);
      this.firebaseConnected = false;
    }
    
    this.notifyListeners();
  }

  private static async handleOffline() {
    this.isOnline = false;
    console.log('Network connection lost');
    
    // Уведомляем Firebase Offline Manager
    await FirebaseOfflineManager.forceOfflineMode(true);
    
    this.firebaseConnected = false;
    this.notifyListeners();
  }

  private static startConnectionMonitoring() {
    // Проверяем Firebase подключение каждые 30 секунд
    setInterval(async () => {
      if (this.isOnline && db) {
        try {
          // Простая проверка подключения
          const testPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
            
            // Пытаемся получить статус подключения
            enableNetwork(db!)
              .then(() => {
                clearTimeout(timeout);
                resolve(true);
              })
              .catch((error) => {
                clearTimeout(timeout);
                reject(error);
              });
          });

          await testPromise;
          
          if (!this.firebaseConnected) {
            this.firebaseConnected = true;
            console.log('Firebase connection restored');
            this.notifyListeners();
          }
        } catch (error) {
          if (this.firebaseConnected) {
            this.firebaseConnected = false;
            console.warn('Firebase connection lost:', error);
            this.notifyListeners();
          }
        }
      }
    }, 30000);
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isConnected());
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  static isConnected(): boolean {
    return this.isOnline && this.firebaseConnected;
  }

  static isNetworkOnline(): boolean {
    return this.isOnline;
  }

  static isFirebaseConnected(): boolean {
    return this.firebaseConnected;
  }

  static addConnectionListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Возвращаем функцию для отписки
    return () => {
      this.listeners.delete(listener);
    };
  }

  static getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      isFirebaseConnected: this.firebaseConnected,
      isFullyConnected: this.isConnected()
    };
  }

  // Принудительная проверка подключения
  static async checkConnection(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    if (!db) {
      return false;
    }

    try {
      await enableNetwork(db);
      this.firebaseConnected = true;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('Firebase connection check failed:', error);
      this.firebaseConnected = false;
      this.notifyListeners();
      return false;
    }
  }
}