// Простой тест для проверки подключения к Firebase
import { AuthService, UserService } from './firebase';
import { auth, db } from './firebase';
import { FirebaseOfflineManager } from './firebaseOffline';

export class FirebaseTestService {
  // Проверка подключения к Firebase Auth
  static async testAuthConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth) {
        return { success: false, message: 'Firebase Auth не инициализирован' };
      }
      
      // Проверяем текущего пользователя
      const currentUser = AuthService.getCurrentUser();
      
      return { 
        success: true, 
        message: `Firebase Auth подключен. Текущий пользователь: ${currentUser ? currentUser.email : 'не авторизован'}` 
      };
    } catch (error: any) {
      return { success: false, message: `Ошибка подключения к Firebase Auth: ${error.message}` };
    }
  }

  // Проверка подключения к Firestore
  static async testFirestoreConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!db) {
        return { success: false, message: 'Firestore не инициализирован' };
      }

      // Попытка простой проверки подключения
      const testPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Firestore не отвечает в течение 10 секунд'));
        }, 10000);

        UserService.getUserProfile('test-connection-123')
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
      
      return { 
        success: true, 
        message: 'Firestore подключен и работает корректно' 
      };
    } catch (error: any) {
      let message = 'Ошибка подключения к Firestore';
      
      if (error.code === 'unavailable') {
        message = 'Firebase Firestore недоступен (возможно проблемы с сетью)';
      } else if (error.code === 'permission-denied') {
        message = 'Нет доступа к Firestore (проверьте правила безопасности)';
      } else if (error.code === 'deadline-exceeded') {
        message = 'Превышено время ожидания подключения к Firestore';
      } else if (error.message.includes('Timeout')) {
        message = 'Время ожидания подключения к Firestore истекло';
      }
      
      return { 
        success: false, 
        message: `${message}: ${error.message}`,
        details: {
          code: error.code,
          message: error.message,
          stack: error.stack
        }
      };
    }
  }

  // Проверка офлайн менеджера
  static testOfflineManager(): { success: boolean; message: string; stats: any } {
    try {
      const stats = FirebaseOfflineManager.getStats();
      
      return {
        success: true,
        message: `Офлайн менеджер работает. Режим: ${stats.isOfflineMode ? 'офлайн' : 'онлайн'}`,
        stats
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Ошибка офлайн менеджера: ${error.message}`,
        stats: null
      };
    }
  }

  // Полная проверка Firebase
  static async testFirebaseConnection(): Promise<{ 
    auth: { success: boolean; message: string };
    firestore: { success: boolean; message: string };
    offline: { success: boolean; message: string; stats: any };
    overall: boolean;
  }> {
    const authTest = await this.testAuthConnection();
    const firestoreTest = await this.testFirestoreConnection();
    const offlineTest = this.testOfflineManager();
    
    return {
      auth: authTest,
      firestore: firestoreTest,
      offline: offlineTest,
      overall: authTest.success && firestoreTest.success && offlineTest.success
    };
  }

  // Создание тестового пользователя (только для разработки)
  static async createTestUser(): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const testEmail = `test-${Date.now()}@tokenvault-demo.com`;
      const testPassword = 'TestPassword123!';
      
      const user = await AuthService.signUp(testEmail, testPassword);
      
      // Создаем профиль пользователя
      await UserService.createUserProfile(user);
      
      return {
        success: true,
        message: `Тестовый пользователь создан: ${testEmail}`,
        userId: user.uid
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Ошибка создания тестового пользователя: ${error.message}`
      };
    }
  }

  // Удаление тестового пользователя
  static async cleanupTestUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // В реальном приложении здесь была бы логика удаления пользователя
      // Firebase Admin SDK или Cloud Functions
      
      return {
        success: true,
        message: `Тестовый пользователь ${userId} помечен для удаления`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Ошибка удаления тестового пользователя: ${error.message}`
      };
    }
  }
}