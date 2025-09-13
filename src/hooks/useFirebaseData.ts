import { useState, useEffect, useCallback } from 'react';
import { 
  UserService,
  AssetService, 
  MarketplaceService,
  GovernanceService,
  TransactionService,
  NotificationService
} from '../services/firebase';
import { User } from '../App';
import { toast } from 'sonner@2.0.3';

// Custom hook for user portfolio management
export function usePortfolio(userId: string) {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPortfolio = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await UserService.getUserProfile(userId);
      if (userProfile) {
        setPortfolio(userProfile.portfolio || []);
      }
    } catch (err: any) {
      console.error('Error loading portfolio:', err);
      setError(err.message || 'Ошибка загрузки портфеля');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  return { portfolio, loading, error, refreshPortfolio };
}

// Custom hook for marketplace data
export function useMarketplace(filters?: any) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const marketplaceListings = await MarketplaceService.getMarketplaceListings(filters);
      setListings(marketplaceListings);
    } catch (err: any) {
      console.error('Error loading marketplace:', err);
      setError(err.message || 'Ошибка загрузки маркетплейса');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  const purchaseAsset = async (listingId: string, amount: number, totalPrice: number) => {
    try {
      // This would be implemented with actual purchase logic
      toast.success('Покупка выполнена успешно!');
      await refreshListings();
    } catch (error) {
      toast.error('Ошибка при покупке актива');
      throw error;
    }
  };

  return { listings, loading, error, refreshListings, purchaseAsset };
}

// Custom hook for governance data
export function useGovernance(userId?: string) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProposals = useCallback(async () => {
    try {
      setLoading(true);
      const [activeProposals, votes] = await Promise.all([
        GovernanceService.getActiveProposals(),
        userId ? GovernanceService.getUserVotes(userId) : Promise.resolve([])
      ]);
      
      setProposals(activeProposals);
      setUserVotes(votes);
      setError(null);
    } catch (err) {
      console.error('Error loading governance:', err);
      setError('Ошибка загрузки голосования');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshProposals();
  }, [refreshProposals]);

  const vote = async (proposalId: string, voteChoice: 'for' | 'against', votingPower: number) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await GovernanceService.vote(proposalId, userId, voteChoice, votingPower);
      toast.success('Голос записан!');
      await refreshProposals();
    } catch (error: any) {
      if (error.message.includes('already voted')) {
        toast.error('Вы уже голосовали по этому предложению');
      } else {
        toast.error('Ошибка при голосовании');
      }
      throw error;
    }
  };

  const createProposal = async (proposalData: any) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await GovernanceService.createProposal(userId, proposalData);
      toast.success('Предложение создано!');
      await refreshProposals();
    } catch (error) {
      toast.error('Ошибка создания предложения');
      throw error;
    }
  };

  return { 
    proposals, 
    userVotes, 
    loading, 
    error, 
    refreshProposals, 
    vote, 
    createProposal 
  };
}

// Custom hook for user transactions
export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const userTransactions = await TransactionService.getUserTransactions(userId);
      setTransactions(userTransactions);
      setError(null);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Ошибка загрузки транзакций');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return { transactions, loading, error, refreshTransactions };
}

// Custom hook for tokenized assets
export function useAssets(userId?: string) {
  const [assets, setAssets] = useState<any[]>([]);
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAssets = useCallback(async () => {
    try {
      setLoading(true);
      const [verifiedAssets, userCreatedAssets] = await Promise.all([
        AssetService.getVerifiedAssets(),
        userId ? AssetService.getAssetsByType('all') : Promise.resolve([]) // This would need to be implemented
      ]);
      
      setAssets(verifiedAssets);
      setUserAssets(userCreatedAssets.filter((asset: any) => asset.creatorId === userId));
      setError(null);
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Ошибка загрузки активов');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  const createAsset = async (assetData: any) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const assetId = await AssetService.createTokenizedAsset({
        ...assetData,
        creatorId: userId,
        verificationStatus: 'pending' as const
      });
      toast.success('Актив создан и отправлен на модерацию!');
      await refreshAssets();
      return assetId;
    } catch (error) {
      toast.error('Ошибка создания актива');
      throw error;
    }
  };

  return { assets, userAssets, loading, error, refreshAssets, createAsset };
}

// Custom hook for notifications
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [allNotifications, unreadNotifications] = await Promise.all([
        NotificationService.getUserNotifications(userId, false),
        NotificationService.getUserNotifications(userId, true)
      ]);
      
      setNotifications(allNotifications);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshNotifications();
    
    // Set up periodic refresh for notifications
    const interval = setInterval(refreshNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(userId);
      await refreshNotifications();
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      toast.error('Ошибка при обновлении уведомлений');
    }
  };

  return { 
    notifications, 
    unreadCount, 
    loading, 
    refreshNotifications, 
    markAsRead, 
    markAllAsRead 
  };
}

// Custom hook for analytics
export function useAnalytics(userId: string) {
  const [userStats, setUserStats] = useState<any>({});
  const [marketStats, setMarketStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const refreshAnalytics = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Mock analytics data for demo
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUserStats({
        totalTransactions: 15,
        totalProposals: 2,
        totalVotes: 8,
        portfolioValue: 52500
      });
      
      setMarketStats({
        totalAssets: 156,
        activeListings: 89,
        totalTransactions: 2341,
        totalVolume: 15670000
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return { userStats, marketStats, loading, refreshAnalytics };
}