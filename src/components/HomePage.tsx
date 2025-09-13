import React, { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NavigationPage, User } from '../App';
import { usePortfolio, useNotifications, useAnalytics } from '../hooks/useFirebaseData';
import { UserService } from '../services/firebase';
import { SolanaService } from '../services/solana';
import { WalletConnectionModal } from './WalletConnectionModal';
import { 
  Send, 
  Download, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Search,
  PlusCircle,
  BarChart3,
  Settings,
  Loader2,
  Bell,
  Wallet,
  ShoppingCart,
  Vote,
  Building2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface HomePageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
}

export function HomePage({ user, onNavigate }: HomePageProps) {
  const { portfolio, loading: portfolioLoading, refreshPortfolio } = usePortfolio(user.id);
  const { notifications, unreadCount } = useNotifications(user.id);
  const { userStats, marketStats } = useAnalytics(user.id);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  const currentUser = useMemo(() => {
    if (portfolio.length > 0) {
      const totalBalance = portfolio.reduce((sum, item) => sum + item.value, 0);
      return {
        ...user,
        portfolio,
        totalBalance
      };
    }
    return user;
  }, [user, portfolio]);

  useEffect(() => {
    if (portfolio.length > 0 && user.id !== 'demo-user' && user.id.indexOf('Demo') === -1) {
      const totalBalance = portfolio.reduce((sum, item) => sum + item.value, 0);
      
      UserService.updateUserProfile(user.id, { 
        portfolio, 
        totalBalance 
      }).catch((error) => {
        console.error('Error updating user profile:', error);
      });
    }
  }, [portfolio, user.id]);

  useEffect(() => {
    setWalletConnected(SolanaService.isWalletConnected());
  }, []);

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnected = () => {
    setWalletConnected(true);
    toast.success('Кошелёк успешно подключен!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex justify-between items-center p-4 pt-12 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-lg opacity-80"></div>
            </div>
            <span className="text-lg font-semibold text-gray-900">TokenVault</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Solana Network</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!walletConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectWallet}
              className="text-xs"
            >
              <Wallet className="w-3 h-3 mr-1" />
              Подключить кошелёк
            </Button>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Кошелёк подключен
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => onNavigate('profile')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </Button>
        </div>
      </div>

      <div className="px-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-3xl border-0 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm">Общий баланс</p>
              <div className="flex items-center space-x-2">
                {portfolioLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <h1 className="text-3xl font-semibold">
                    {formatCurrency(currentUser.totalBalance)}
                  </h1>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+2.34%</span>
              </div>
              <p className="text-xs text-blue-100">За 24 часа</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Send className="w-4 h-4 mr-2" />
              Отправить
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Получить
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => onNavigate('marketplace')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Купить
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex-1 bg-gray-50 rounded-t-3xl px-4 pt-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Мой портфель</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigate('portfolio')}
          >
            Все активы
          </Button>
        </div>

        {portfolioLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : currentUser.portfolio.length > 0 ? (
          <div className="space-y-3 mb-6">
            {currentUser.portfolio.slice(0, 4).map((token) => (
              <Card key={token.id} className="p-4 bg-white rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{token.name}</p>
                      <p className="text-sm text-gray-600">{token.amount} {token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(token.value)}
                    </p>
                    <div className="flex items-center justify-end space-x-1">
                      {token.priceChange24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs ${
                        token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Портфель пуст</h3>
            <p className="text-gray-600 mb-4">Начните инвестировать в токенизированные активы</p>
            <Button onClick={() => onNavigate('marketplace')}>
              Перейти к маркетплейсу
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-white rounded-xl border-0 shadow-sm">
            <Button 
              variant="ghost" 
              className="w-full flex flex-col items-center p-3 h-auto hover:bg-blue-50"
              onClick={() => onNavigate('tokenize')}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                <PlusCircle className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Токенизация</span>
              <span className="text-xs text-gray-600">Создать токены</span>
            </Button>
          </Card>

          <Card className="p-4 bg-white rounded-xl border-0 shadow-sm">
            <Button 
              variant="ghost" 
              className="w-full flex flex-col items-center p-3 h-auto hover:bg-green-50"
              onClick={() => onNavigate('marketplace')}
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Маркетплейс</span>
              <span className="text-xs text-gray-600">Купить активы</span>
            </Button>
          </Card>

          <Card className="p-4 bg-white rounded-xl border-0 shadow-sm">
            <Button 
              variant="ghost" 
              className="w-full flex flex-col items-center p-3 h-auto hover:bg-purple-50"
              onClick={() => onNavigate('governance')}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                <Vote className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Голосование</span>
              <span className="text-xs text-gray-600">Управление</span>
            </Button>
          </Card>

          <Card className="p-4 bg-white rounded-xl border-0 shadow-sm">
            <Button 
              variant="ghost" 
              className="w-full flex flex-col items-center p-3 h-auto hover:bg-red-50"
              onClick={() => onNavigate('govservices')}
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-2">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Госуслуги</span>
              <span className="text-xs text-gray-600">Оплата SOL</span>
            </Button>
          </Card>
        </div>
      </div>

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={handleWalletConnected}
      />
    </div>
  );
}