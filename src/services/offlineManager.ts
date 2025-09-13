// Offline Manager for handling Firebase connection issues
import { User } from '../App';

export class OfflineManager {
  private static readonly STORAGE_KEYS = {
    USER_PROFILE: 'tokenvault_user_profile_',
    PENDING_UPDATES: 'tokenvault_pending_updates_',
    PORTFOLIO_CACHE: 'tokenvault_portfolio_cache_',
    MARKETPLACE_CACHE: 'tokenvault_marketplace_cache',
    LAST_SYNC: 'tokenvault_last_sync'
  };

  // Cache user profile
  static cacheUserProfile(userId: string, profile: User): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.USER_PROFILE + userId, 
        JSON.stringify({
          ...profile,
          cachedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      console.warn('Failed to cache user profile:', error);
    }
  }

  // Get cached user profile
  static getCachedUserProfile(userId: string): User | null {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE + userId);
      if (cached) {
        const profile = JSON.parse(cached);
        
        // Check if cache is not too old (24 hours)
        const cacheAge = new Date().getTime() - new Date(profile.cachedAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          return profile;
        } else {
          // Remove old cache
          this.clearUserProfileCache(userId);
        }
      }
    } catch (error) {
      console.warn('Failed to get cached user profile:', error);
    }
    return null;
  }

  // Clear user profile cache
  static clearUserProfileCache(userId: string): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE + userId);
    } catch (error) {
      console.warn('Failed to clear user profile cache:', error);
    }
  }

  // Store pending updates for when online
  static storePendingUpdate(userId: string, update: any): void {
    try {
      const existing = this.getPendingUpdates(userId);
      existing.push({
        ...update,
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem(
        this.STORAGE_KEYS.PENDING_UPDATES + userId,
        JSON.stringify(existing)
      );
    } catch (error) {
      console.warn('Failed to store pending update:', error);
    }
  }

  // Get pending updates
  static getPendingUpdates(userId: string): any[] {
    try {
      const pending = localStorage.getItem(this.STORAGE_KEYS.PENDING_UPDATES + userId);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.warn('Failed to get pending updates:', error);
      return [];
    }
  }

  // Clear pending updates after successful sync
  static clearPendingUpdates(userId: string): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.PENDING_UPDATES + userId);
    } catch (error) {
      console.warn('Failed to clear pending updates:', error);
    }
  }

  // Generate demo portfolio for offline mode
  static getDemoPortfolio(): any[] {
    return [
      {
        id: 'demo-real-estate-1',
        symbol: 'REAL',
        name: 'Элитная недвижимость',
        amount: 50,
        value: 25000,
        priceChange24h: 2.3,
        assetType: 'real-estate',
        tokenAddress: 'DemoREAL123...',
        purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        purchasePrice: 500
      },
      {
        id: 'demo-art-1',
        symbol: 'ART',
        name: 'Коллекционное искусство',
        amount: 25,
        value: 12500,
        priceChange24h: -1.2,
        assetType: 'art',
        tokenAddress: 'DemoART456...',
        purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        purchasePrice: 500
      },
      {
        id: 'demo-music-1',
        symbol: 'MUSIC',
        name: 'Музыкальные права',
        amount: 100,
        value: 15000,
        priceChange24h: 5.7,
        assetType: 'music',
        tokenAddress: 'DemoMUSIC789...',
        purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        purchasePrice: 150
      }
    ];
  }

  // Generate demo marketplace listings
  static getDemoMarketplace(): any[] {
    return [
      {
        id: 'demo-listing-1',
        name: 'Премиум квартира в центре Москвы',
        description: 'Элитная 3-комнатная квартира с видом на Кремль',
        assetType: 'real-estate',
        totalValue: 500000,
        totalTokens: 1000,
        availableTokens: 750,
        pricePerToken: 500,
        expectedROI: 8.5,
        minInvestment: 1000,
        location: 'Москва, Центральный округ',
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'],
        verification: 'verified',
        createdAt: new Date(),
        sellerId: 'demo-seller-1'
      },
      {
        id: 'demo-listing-2',
        name: 'Картина известного художника',
        description: 'Оригинальная работа современного художника',
        assetType: 'art',
        totalValue: 200000,
        totalTokens: 400,
        availableTokens: 300,
        pricePerToken: 500,
        expectedROI: 12.0,
        minInvestment: 500,
        location: 'Санкт-Петербург',
        images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop'],
        verification: 'verified',
        createdAt: new Date(),
        sellerId: 'demo-seller-2'
      },
      {
        id: 'demo-listing-3',
        name: 'Права на музыкальный альбом',
        description: 'Роялти от популярного музыкального альбома',
        assetType: 'music',
        totalValue: 150000,
        totalTokens: 1000,
        availableTokens: 800,
        pricePerToken: 150,
        expectedROI: 15.2,
        minInvestment: 300,
        location: 'Глобально',
        images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop'],
        verification: 'verified',
        createdAt: new Date(),
        sellerId: 'demo-seller-3'
      }
    ];
  }

  // Check if we're in offline mode
  static isOffline(): boolean {
    return !navigator.onLine;
  }

  // Show offline notification
  static showOfflineNotification(): void {
    if (this.isOffline()) {
      console.warn('Application is running in offline mode. Some features may be limited.');
    }
  }

  // Update last sync timestamp
  static updateLastSync(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to update last sync:', error);
    }
  }

  // Get last sync time
  static getLastSync(): Date | null {
    try {
      const lastSync = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.warn('Failed to get last sync:', error);
      return null;
    }
  }

  // Clean old cache data
  static cleanOldCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const tokenvaultKeys = keys.filter(key => key.startsWith('tokenvault_'));
      
      tokenvaultKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.cachedAt) {
            const age = new Date().getTime() - new Date(data.cachedAt).getTime();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (age > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove invalid data
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clean old cache:', error);
    }
  }
}