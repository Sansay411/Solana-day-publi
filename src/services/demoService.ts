// Demo Service - Mock Firebase functionality for demo mode
import { User, TokenHolding } from '../App';

// Demo mode flag - set to true to avoid Firebase connection errors
// Auto-enabled when Firebase is unavailable
export let DEMO_MODE = false;

// Function to enable demo mode dynamically
export const enableDemoMode = () => {
  console.log('🔧 Switching to demo mode due to Firebase connectivity issues');
  DEMO_MODE = true;
};

// Function to disable demo mode
export const disableDemoMode = () => {
  console.log('🔧 Switching back to Firebase mode');
  DEMO_MODE = false;
};

// Demo data storage
class DemoStorage {
  private static storage = new Map<string, any>();
  
  static set(key: string, value: any): void {
    this.storage.set(key, JSON.stringify(value));
  }
  
  static get(key: string): any {
    const data = this.storage.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  static delete(key: string): void {
    this.storage.delete(key);
  }
  
  static has(key: string): boolean {
    return this.storage.has(key);
  }
}

// Demo user database
export class DemoUserService {
  static async createUserProfile(userId: string, email: string, walletAddress?: string): Promise<User> {
    const userProfile: User = {
      id: userId,
      email,
      walletAddress: walletAddress || `Demo${Math.random().toString(36).substring(2, 15)}`,
      isKYCVerified: false,
      portfolio: this.getDemoPortfolio(),
      totalBalance: 52500
    };

    DemoStorage.set(`user-${userId}`, userProfile);
    return userProfile;
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    const cached = DemoStorage.get(`user-${userId}`);
    if (cached) {
      return cached;
    }

    // Create demo user if doesn't exist
    if (userId.includes('demo') || userId.includes('Demo')) {
      return this.createUserProfile(userId, 'demo@tokenvault.com');
    }

    return null;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (user) {
      const updatedUser = { ...user, ...updates };
      DemoStorage.set(`user-${userId}`, updatedUser);
    }
  }

  static getDemoPortfolio(): TokenHolding[] {
    return [
      {
        id: 'demo-real-estate-1',
        symbol: 'REAL',
        name: 'Элитная недвижимость',
        amount: 50,
        value: 25000,
        priceChange24h: 2.3,
        assetType: 'real-estate',
        tokenAddress: 'DemoREAL123...'
      },
      {
        id: 'demo-art-1',
        symbol: 'ART',
        name: 'Коллекционное искусство',
        amount: 25,
        value: 12500,
        priceChange24h: -1.2,
        assetType: 'art',
        tokenAddress: 'DemoART456...'
      },
      {
        id: 'demo-music-1',
        symbol: 'MUSIC',
        name: 'Музыкальные права',
        amount: 100,
        value: 15000,
        priceChange24h: 5.7,
        assetType: 'music',
        tokenAddress: 'DemoMUSIC789...'
      }
    ];
  }
}

// Demo marketplace service
export class DemoMarketplaceService {
  static async getMarketplaceListings(filters?: any): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let listings = [
      {
        id: 'demo-listing-1',
        name: 'Премиум квартира в центре Москвы',
        description: 'Элитная 3-комнатная квартира с видом на Кремль. Расположена в историческом центре города с развитой инфраструктурой.',
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
        status: 'active',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        sellerId: 'demo-seller-1',
        tags: ['Премиум', 'Центр', 'Инвестиции']
      },
      {
        id: 'demo-listing-2',
        name: 'Картина известного художника',
        description: 'Оригинальная работа современного российского художника. Картина участвовала в международных выставках.',
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
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        sellerId: 'demo-seller-2',
        tags: ['Искусство', 'Коллекция', 'Рост']
      },
      {
        id: 'demo-listing-3',
        name: 'Права на музыкальный альбом',
        description: 'Роялти от популярного музыкального альбома с миллионами прослушиваний на стриминговых платформах.',
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
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        sellerId: 'demo-seller-3',
        tags: ['Музыка', 'Роялти', 'Пассивный доход']
      },
      {
        id: 'demo-listing-4',
        name: 'Редкий игровой предмет',
        description: 'Уникальный NFT меч из популярной игры с ограниченным тиражом. Дает владельцу особые преимущества в игре.',
        assetType: 'gaming',
        totalValue: 75000,
        totalTokens: 500,
        availableTokens: 400,
        pricePerToken: 150,
        expectedROI: 20.0,
        minInvestment: 150,
        location: 'Виртуальный мир',
        images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop'],
        verification: 'verified',
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sellerId: 'demo-seller-4',
        tags: ['Gaming', 'NFT', 'Редкость']
      }
    ];

    // Apply filters
    if (filters?.assetType) {
      listings = listings.filter(listing => listing.assetType === filters.assetType);
    }

    if (filters?.minPrice) {
      listings = listings.filter(listing => listing.pricePerToken >= filters.minPrice);
    }

    if (filters?.maxPrice) {
      listings = listings.filter(listing => listing.pricePerToken <= filters.maxPrice);
    }

    return listings;
  }

  static async purchaseAsset(listingId: string, amount: number, totalPrice: number): Promise<void> {
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In demo mode, just simulate success
    console.log(`Demo purchase: ${amount} tokens of ${listingId} for $${totalPrice}`);
  }

  static async createListing(sellerId: string, listingData: any): Promise<string> {
    // Simulate creation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const listingId = `demo-listing-${Date.now()}`;
    const listing = {
      ...listingData,
      id: listingId,
      sellerId,
      status: 'active',
      createdAt: new Date()
    };
    
    DemoStorage.set(`listing-${listingId}`, listing);
    return listingId;
  }
}

// Demo governance service
export class DemoGovernanceService {
  static async getActiveProposals(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        id: 'demo-proposal-1',
        title: 'Расширение списка поддерживаемых активов',
        description: 'Предложение добавить поддержку токенизации спортивных карточек и предметов коллекционирования.',
        type: 'expansion',
        status: 'active',
        votesFor: 1250,
        votesAgainst: 340,
        totalVotes: 1590,
        totalVoters: 1590,
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        creatorId: 'demo-creator-1',
        voters: []
      },
      {
        id: 'demo-proposal-2',
        title: 'Снижение комиссии за транзакции',
        description: 'Предложение снизить комиссию платформы с 2.5% до 2.0% для повышения конкурентоспособности.',
        type: 'fee-change',
        status: 'active',
        votesFor: 890,
        votesAgainst: 450,
        totalVotes: 1340,
        totalVoters: 1340,
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        creatorId: 'demo-creator-2',
        voters: []
      }
    ];
  }

  static async vote(proposalId: string, userId: string, vote: 'for' | 'against', votingPower: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Store vote in demo storage
    const voteKey = `vote-${proposalId}-${userId}`;
    DemoStorage.set(voteKey, { proposalId, userId, vote, votingPower, timestamp: new Date() });
  }

  static async createProposal(creatorId: string, proposalData: any): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const proposalId = `demo-proposal-${Date.now()}`;
    const proposal = {
      ...proposalData,
      id: proposalId,
      creatorId,
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      totalVoters: 0,
      createdAt: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    DemoStorage.set(`proposal-${proposalId}`, proposal);
    return proposalId;
  }
}

// Demo transaction service
export class DemoTransactionService {
  static async getUserTransactions(userId: string): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return [
      {
        id: 'demo-tx-1',
        userId,
        type: 'buy',
        assetSymbol: 'REAL',
        amount: 10,
        price: 500,
        total: 5000,
        status: 'completed',
        txHash: 'DemoHash123...',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'demo-tx-2',
        userId,
        type: 'buy',
        assetSymbol: 'ART',
        amount: 5,
        price: 500,
        total: 2500,
        status: 'completed',
        txHash: 'DemoHash456...',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'demo-tx-3',
        userId,
        type: 'dividend',
        assetSymbol: 'MUSIC',
        amount: 0,
        price: 0,
        total: 150,
        status: 'completed',
        txHash: 'DemoHash789...',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  static async createTransaction(transactionData: any): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const txId = `demo-tx-${Date.now()}`;
    const transaction = {
      ...transactionData,
      id: txId,
      status: 'pending',
      createdAt: new Date()
    };
    
    DemoStorage.set(`transaction-${txId}`, transaction);
    
    // Simulate processing
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.txHash = `DemoHash${Math.random().toString(36).substring(2, 15)}`;
      DemoStorage.set(`transaction-${txId}`, transaction);
    }, 2000);
    
    return txId;
  }
}

// Demo asset service
export class DemoAssetService {
  static async createTokenizedAsset(assetData: any): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const assetId = `demo-asset-${Date.now()}`;
    const asset = {
      ...assetData,
      id: assetId,
      verificationStatus: 'pending',
      contractAddress: `DemoContract${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    DemoStorage.set(`asset-${assetId}`, asset);
    
    // Simulate verification process
    setTimeout(() => {
      asset.verificationStatus = 'verified';
      asset.updatedAt = new Date();
      DemoStorage.set(`asset-${assetId}`, asset);
    }, 5000);
    
    return assetId;
  }

  static async getVerifiedAssets(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        id: 'demo-verified-1',
        name: 'Коммерческая недвижимость',
        symbol: 'COMM',
        assetType: 'real-estate',
        totalValue: 1000000,
        totalSupply: 2000,
        currentPrice: 500,
        verificationStatus: 'verified',
        expectedROI: 9.5
      },
      {
        id: 'demo-verified-2',
        name: 'Винтажная коллекция',
        symbol: 'VINT',
        assetType: 'art',
        totalValue: 300000,
        totalSupply: 600,
        currentPrice: 500,
        verificationStatus: 'verified',
        expectedROI: 14.2
      }
    ];
  }
}

// Demo notification service
export class DemoNotificationService {
  static async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const notifications = [
      {
        id: 'demo-notif-1',
        userId,
        type: 'transaction',
        title: 'Транзакция завершена',
        message: 'Ваша покупка 10 токенов REAL успешно завершена',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'demo-notif-2',
        userId,
        type: 'dividend',
        title: 'Получены дивиденды',
        message: 'Вы получили $150 дивидендов от токенов MUSIC',
        isRead: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'demo-notif-3',
        userId,
        type: 'governance',
        title: 'Новое предложение для голосования',
        message: 'Доступно новое предложение "Расширение списка активов"',
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    return unreadOnly ? notifications.filter(n => !n.isRead) : notifications;
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    // In demo mode, just simulate success
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    // In demo mode, just simulate success
  }
}

// Export demo flag and services
export const isDemoMode = () => DEMO_MODE;

export const DemoServices = {
  UserService: DemoUserService,
  MarketplaceService: DemoMarketplaceService,
  GovernanceService: DemoGovernanceService,
  TransactionService: DemoTransactionService,
  AssetService: DemoAssetService,
  NotificationService: DemoNotificationService
};