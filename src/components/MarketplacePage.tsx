import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { NavigationPage, User, Transaction } from '../App';
import { SolanaService } from '../services/solana';
import { TransactionService } from '../services/transactions';
import { UserService } from '../services/firebase';
import { WalletConnectionModal } from './WalletConnectionModal';
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Building,
  Palette,
  Music,
  Gamepad2,
  Star,
  Eye,
  ShoppingCart,
  Wallet,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MarketplacePageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
}

interface MarketItem {
  id: string;
  name: string;
  symbol: string;
  description: string;
  assetType: 'real-estate' | 'art' | 'music' | 'gaming';
  currentPrice: number;
  priceChange24h: number;
  totalSupply: number;
  availableSupply: number;
  minInvestment: number;
  expectedROI: number;
  rating: number;
  views: number;
  isFeatured: boolean;
  creator: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

const mockMarketItems: MarketItem[] = [
  {
    id: '1',
    name: 'Manhattan Luxury Apartment',
    symbol: 'MLA',
    description: 'Элитная квартира в центре Манхэттена с видом на Центральный парк',
    assetType: 'real-estate',
    currentPrice: 125.50,
    priceChange24h: 2.3,
    totalSupply: 10000,
    availableSupply: 3500,
    minInvestment: 100,
    expectedROI: 8.5,
    rating: 4.8,
    views: 1250,
    isFeatured: true,
    creator: 'Real Estate Pro',
    verificationStatus: 'verified'
  },
  {
    id: '2',
    name: 'Digital Art Collection "Cosmos"',
    symbol: 'COSM',
    description: 'Коллекция цифрового искусства от известного художника',
    assetType: 'art',
    currentPrice: 45.20,
    priceChange24h: -1.2,
    totalSupply: 5000,
    availableSupply: 1200,
    minInvestment: 50,
    expectedROI: 12.0,
    rating: 4.6,
    views: 890,
    isFeatured: true,
    creator: 'ArtistDAO',
    verificationStatus: 'verified'
  },
  {
    id: '3',
    name: 'Platinum Album Rights',
    symbol: 'PAR',
    description: 'Права на доходы от платинового альбома популярной группы',
    assetType: 'music',
    currentPrice: 78.30,
    priceChange24h: 5.7,
    totalSupply: 8000,
    availableSupply: 2100,
    minInvestment: 75,
    expectedROI: 15.2,
    rating: 4.9,
    views: 2100,
    isFeatured: false,
    creator: 'Music Rights Co',
    verificationStatus: 'verified'
  },
  {
    id: '4',
    name: 'Legendary Sword NFT',
    symbol: 'LSW',
    description: 'Легендарный меч из популярной MMORPG игры',
    assetType: 'gaming',
    currentPrice: 234.80,
    priceChange24h: 8.2,
    totalSupply: 1000,
    availableSupply: 45,
    minInvestment: 200,
    expectedROI: 25.0,
    rating: 4.7,
    views: 567,
    isFeatured: true,
    creator: 'GameStudio',
    verificationStatus: 'verified'
  },
  {
    id: '5',
    name: 'Tokyo Office Building',
    symbol: 'TOB',
    description: 'Офисное здание в деловом районе Токио',
    assetType: 'real-estate',
    currentPrice: 189.45,
    priceChange24h: 1.8,
    totalSupply: 15000,
    availableSupply: 7800,
    minInvestment: 150,
    expectedROI: 7.2,
    rating: 4.5,
    views: 980,
    isFeatured: false,
    creator: 'Tokyo Investments',
    verificationStatus: 'pending'
  }
];

const assetTypeIcons = {
  'real-estate': { icon: Building, color: 'green' },
  'art': { icon: Palette, color: 'purple' },
  'music': { icon: Music, color: 'pink' },
  'gaming': { icon: Gamepad2, color: 'blue' }
};

export function MarketplacePage({ user, onNavigate }: MarketplacePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<number>(65.23);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const filteredItems = mockMarketItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedAssetType === 'all' || item.assetType === selectedAssetType;
    return matchesSearch && matchesType;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.currentPrice - b.currentPrice;
      case 'price-desc':
        return b.currentPrice - a.currentPrice;
      case 'roi':
        return b.expectedROI - a.expectedROI;
      case 'popular':
      default:
        return b.views - a.views;
    }
  });

  useEffect(() => {
    const loadWalletData = async () => {
      if (SolanaService.isWalletConnected()) {
        try {
          const balance = await SolanaService.getCurrentWalletBalance();
          setWalletBalance(balance);
          
          const currentSolPrice = await SolanaService.getTokenPrice('SOL');
          setSolPrice(currentSolPrice);
        } catch (error) {
          console.error('Error loading wallet data:', error);
        }
      }
    };

    loadWalletData();
    
    // Обновляем баланс каждые 30 секунд
    const interval = setInterval(loadWalletData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePurchase = async (item: MarketItem) => {
    try {
      const walletConnected = SolanaService.isWalletConnected();
      
      if (!walletConnected) {
        setShowWalletModal(true);
        return;
      }

      setPurchasing(item.id);
      const solAmount = item.currentPrice / solPrice;
      const walletAddress = SolanaService.getWalletAddress();

      if (!walletAddress) {
        throw new Error('Не удалось получить адрес кошелька');
      }

      // Проверяем баланс
      if (walletBalance < solAmount) {
        toast.error(`Недостаточно SOL. Требуется: ${solAmount.toFixed(4)}, доступно: ${walletBalance.toFixed(4)}`);
        return;
      }

      // Создаем запись транзакции
      const transactionData: Omit<Transaction, 'id'> = {
        userId: user.id,
        type: 'purchase',
        tokenId: item.id,
        tokenSymbol: item.symbol,
        tokenName: item.name,
        amount: 1, // Покупаем 1 токен по умолчанию
        pricePerToken: item.currentPrice,
        totalValue: item.currentPrice,
        solAmount: solAmount,
        solPrice: solPrice,
        transactionHash: '',
        walletAddress: walletAddress,
        status: 'pending',
        timestamp: new Date().toISOString(),
        assetType: item.assetType
      };

      const transactionId = await TransactionService.createTransaction(transactionData);

      try {
        // Отправляем SOL транзакцию
        const transactionHash = await SolanaService.sendSOL('TokenVaultDemo123456789ABC', solAmount);
        
        // Обновляем статус транзакции
        await TransactionService.updateTransactionStatus(transactionId, 'completed', transactionHash);
        
        // Обновляем портфель пользователя
        const newTokenHolding = {
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          amount: 1,
          value: item.currentPrice,
          priceChange24h: item.priceChange24h,
          assetType: item.assetType,
          tokenAddress: `token_${item.id}_${Date.now()}`
        };

        const updatedPortfolio = [...user.portfolio];
        const existingIndex = updatedPortfolio.findIndex(h => h.id === item.id);
        
        if (existingIndex >= 0) {
          updatedPortfolio[existingIndex].amount += 1;
          updatedPortfolio[existingIndex].value += item.currentPrice;
        } else {
          updatedPortfolio.push(newTokenHolding);
        }

        const newTotalBalance = updatedPortfolio.reduce((sum, holding) => sum + holding.value, 0);

        // Обновляем профиль пользователя
        await UserService.updateUserProfile(user.id, {
          portfolio: updatedPortfolio,
          totalBalance: newTotalBalance
        });

        // Обновляем баланс кошелька
        const newBalance = await SolanaService.getCurrentWalletBalance();
        setWalletBalance(newBalance);

        toast.success(`${item.symbol} успешно приобретен за ${solAmount.toFixed(4)} SOL!`);
        
      } catch (error) {
        // Обновляем статус транзакции как неудачной
        await TransactionService.updateTransactionStatus(transactionId, 'failed');
        throw error;
      }

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Ошибка при покупке токена');
    } finally {
      setPurchasing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center p-4 pt-12 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold">Маркетплейс</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск активов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={selectedAssetType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedAssetType('all')}
            className="whitespace-nowrap"
          >
            Все
          </Button>
          {Object.entries(assetTypeIcons).map(([type, { icon: Icon, color }]) => (
            <Button
              key={type}
              variant={selectedAssetType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAssetType(type)}
              className="whitespace-nowrap"
            >
              <Icon className="w-4 h-4 mr-1" />
              {type === 'real-estate' ? 'Недвижимость' :
               type === 'art' ? 'Искусство' :
               type === 'music' ? 'Музыка' : 'Игры'}
            </Button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {sortedItems.length} активов найдено
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value="popular">По популярности</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
            <option value="roi">По доходности</option>
          </select>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
        {sortedItems.map((item) => {
          const { icon: AssetIcon, color } = assetTypeIcons[item.assetType];
          
          return (
            <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow bg-white">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                      <AssetIcon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        {item.verificationStatus === 'verified' && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            ✓ Верифицирован
                          </Badge>
                        )}
                        {item.isFeatured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{item.symbol} • {item.creator}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.currentPrice)}</p>
                    <div className="flex items-center space-x-1">
                      {item.priceChange24h > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs ${
                        item.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {item.priceChange24h > 0 ? '+' : ''}{item.priceChange24h}%
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Доступно</p>
                    <p className="font-medium">{item.availableSupply.toLocaleString()}/{item.totalSupply.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Мин. вложение</p>
                    <p className="font-medium">{formatCurrency(item.minInvestment)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ожид. доходность</p>
                    <p className="font-medium text-green-600">{item.expectedROI}%</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{item.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(item)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Wallet className="w-3 h-3 mr-1" />
                    Купить за SOL
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="border-t p-4 bg-white">
        <h3 className="font-semibold mb-3 flex items-center">
          <Star className="w-4 h-4 mr-2 text-yellow-500" />
          Рекомендуемые активы
        </h3>
        <div className="flex space-x-3 overflow-x-auto">
          {mockMarketItems.filter(item => item.isFeatured).map((item) => (
            <Card key={item.id} className="min-w-[200px] p-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">{formatCurrency(item.currentPrice)}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.expectedROI}% ROI
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => handlePurchase(item)}
                >
                  Купить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={() => {
          setShowWalletModal(false);
          toast.success('Кошелёк подключен! Теперь можете покупать токены.');
        }}
      />
    </div>
  );
}