import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { TokenizationPage } from './components/TokenizationPage';
import { MarketplacePage } from './components/MarketplacePage';
import { PortfolioPage } from './components/PortfolioPage';
import { ProfilePage } from './components/ProfilePage';
import { GovernancePage } from './components/GovernancePage';
import { GovServicesPage } from './components/GovServicesPage';
import { AuthPage } from './components/AuthPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectionStatus } from './components/ConnectionStatus';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toaster } from './components/ui/sonner';
import { AuthService, UserService } from './services/firebase';
import { SolanaService } from './services/solana';
import { ConnectionManager } from './services/connectionManager';
import { AppModeManager } from './services/appModeManager';
import { toast } from 'sonner@2.0.3';

export type NavigationPage = 'home' | 'tokenize' | 'marketplace' | 'portfolio' | 'profile' | 'governance' | 'govservices';

export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  isKYCVerified: boolean;
  portfolio: TokenHolding[];
  totalBalance: number;
  kycData?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    phone: string;
    idNumber: string;
    idType: string;
  };
}

export interface TokenHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
  priceChange24h: number;
  assetType: 'real-estate' | 'art' | 'music' | 'gaming';
  tokenAddress?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'transfer' | 'govservice';
  tokenId: string;
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  pricePerToken: number;
  totalValue: number;
  solAmount: number;
  solPrice: number;
  transactionHash: string;
  walletAddress: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  assetType: 'real-estate' | 'art' | 'music' | 'gaming' | 'govservice';
  serviceType?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appMode, setAppMode] = useState(AppModeManager.getCurrentMode());

  useEffect(() => {
    const connectionUnsubscribe = ConnectionManager.addConnectionListener((isConnected) => {
      if (isConnected) {
        console.log('Connection restored, data will sync automatically');
      } else {
        console.log('Connection lost, working offline');
      }
    });

    const modeUnsubscribe = AppModeManager.addModeListener((mode) => {
      setAppMode(mode);
      
      const modeMessages = {
        firebase: 'Подключен к Firebase',
        demo: 'Работаем в демо режиме',
        offline: 'Работаем в офлайн режиме'
      };
      
      if (mode.mode !== 'firebase') {
        toast.info(modeMessages[mode.mode], {
          description: mode.reason,
          duration: 3000
        });
      }
    });

    const unsubscribe = AuthService.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const fallbackUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          isKYCVerified: false,
          portfolio: [
            {
              id: 'demo-real-estate-1',
              symbol: 'REAL',
              name: 'Элитная недвижимость',
              amount: 50,
              value: 25000,
              priceChange24h: 2.3,
              assetType: 'real-estate'
            },
            {
              id: 'demo-art-1',
              symbol: 'ART',
              name: 'Коллекционное искусство',
              amount: 25,
              value: 12500,
              priceChange24h: -1.2,
              assetType: 'art'
            },
            {
              id: 'demo-music-1',
              symbol: 'MUSIC',
              name: 'Музыкальные права',
              amount: 100,
              value: 15000,
              priceChange24h: 5.7,
              assetType: 'music'
            }
          ],
          totalBalance: 52500
        };

        setUser(fallbackUser);
        setIsAuthenticated(true);

        try {
          let userProfile = await UserService.getUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
            UserService.createUserProfile(firebaseUser).catch(() => {
              console.log('Profile creation will be retried when online');
            });
          } else {
            setUser(userProfile);
            
            if (userProfile.kycData?.firstName) {
              toast.success(`Добро пожаловать, ${userProfile.kycData.firstName}!`, {
                duration: 2000
              });
            } else {
              toast.success('Данные синхронизированы!', {
                duration: 2000
              });
            }
            return;
          }
        } catch (error: any) {
          console.log('Working with cached/offline data');
        }

        const connectionStatus = ConnectionManager.getConnectionStatus();
        if (!connectionStatus.isFirebaseConnected) {
          toast.success('Добро пожаловать! Работаем в офлайн режиме');
        } else {
          toast.success('Добро пожаловать в TokenVault!');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      connectionUnsubscribe();
      modeUnsubscribe();
    };
  }, []);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentPage('home');
      toast.success('Вы вышли из аккаунта');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Ошибка при выходе из аккаунта');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      UserService.updateUserProfile(user.id, updates).catch((error) => {
        console.warn('Failed to sync user update:', error);
      });
    }
  };

  const renderCurrentPage = () => {
    if (!isAuthenticated || !user) {
      return <AuthPage onAuthSuccess={handleAuthSuccess} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage user={user} onNavigate={setCurrentPage} />;
      case 'tokenize':
        return <TokenizationPage user={user} onNavigate={setCurrentPage} />;
      case 'marketplace':
        return <MarketplacePage user={user} onNavigate={setCurrentPage} />;
      case 'portfolio':
        return <PortfolioPage user={user} onNavigate={setCurrentPage} />;
      case 'profile':
        return (
          <ProfilePage 
            user={user} 
            onNavigate={setCurrentPage}
            onSignOut={handleSignOut}
            onUpdateUser={updateUser}
          />
        );
      case 'governance':
        return <GovernancePage user={user} onNavigate={setCurrentPage} />;
      case 'govservices':
        return <GovServicesPage user={user} onNavigate={setCurrentPage} />;
      default:
        return <HomePage user={user} onNavigate={setCurrentPage} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full opacity-30"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">TokenVault</h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto">
              <div className="h-full bg-white rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-gray-600">Загрузка приложения...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
        <ConnectionStatus />
        <OfflineIndicator />
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
          {renderCurrentPage()}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'white',
                color: 'black',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
              warning: {
                iconTheme: {
                  primary: '#f59e0b',
                  secondary: 'white',
                },
              },
            }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}