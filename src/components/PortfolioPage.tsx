import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { NavigationPage, User } from '../App';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  Building,
  Palette,
  Music,
  Gamepad2,
  Eye,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface PortfolioPageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
}

// Mock performance data
const performanceData = [
  { month: 'Янв', value: 9500 },
  { month: 'Фев', value: 9800 },
  { month: 'Мар', value: 10200 },
  { month: 'Апр', value: 10600 },
  { month: 'Май', value: 10900 },
  { month: 'Июн', value: 11300 },
];

// Portfolio distribution data
const distributionData = [
  { name: 'Недвижимость', value: 68.9, color: '#10B981' },
  { name: 'Искусство', value: 18.6, color: '#8B5CF6' },
  { name: 'Музыка', value: 12.4, color: '#EC4899' },
  { name: 'Игры', value: 0.1, color: '#3B82F6' }
];

// Mock transaction history
const transactionHistory = [
  {
    id: '1',
    type: 'buy',
    asset: 'Manhattan Luxury Property',
    symbol: 'REIT1',
    amount: 250.0,
    price: 31.25,
    total: 7812.50,
    date: '2024-03-15',
    status: 'completed'
  },
  {
    id: '2',
    type: 'sell',
    asset: 'Digital Art Collection',
    symbol: 'ART1',
    amount: 50.0,
    price: 8.40,
    total: 420.00,
    date: '2024-03-14',
    status: 'completed'
  },
  {
    id: '3',
    type: 'dividend',
    asset: 'Royalty Rights Token',
    symbol: 'MUSIC1',
    amount: 500.0,
    price: 0.28,
    total: 140.00,
    date: '2024-03-12',
    status: 'completed'
  }
];

const assetTypeIcons = {
  'real-estate': { icon: Building, color: 'green' },
  'art': { icon: Palette, color: 'purple' },
  'music': { icon: Music, color: 'pink' },
  'gaming': { icon: Gamepad2, color: 'blue' }
};

export function PortfolioPage({ user, onNavigate }: PortfolioPageProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotalGainLoss = () => {
    const totalGain = user.portfolio.reduce((sum, token) => 
      sum + (token.value * token.priceChange24h / 100), 0
    );
    return totalGain;
  };

  const totalGainLoss = calculateTotalGainLoss();
  const totalGainLossPercent = (totalGainLoss / user.totalBalance) * 100;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 pt-12 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Портфель</h1>
        <div className="ml-auto">
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="p-4 space-y-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="space-y-2">
            <p className="text-blue-100 text-sm">Общая стоимость портфеля</p>
            <h2 className="text-2xl font-semibold">{formatCurrency(user.totalBalance)}</h2>
            <div className="flex items-center space-x-2">
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-300" />
              )}
              <span className={`text-sm ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)} ({totalGainLossPercent.toFixed(2)}%)
              </span>
              <span className="text-blue-100 text-sm">за 24ч</span>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Инвестировано</p>
            <p className="font-semibold text-sm">{formatCurrency(10500)}</p>
          </Card>
          <Card className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Доходность</p>
            <p className="font-semibold text-sm text-green-600">+7.6%</p>
          </Card>
          <Card className="p-3 text-center">
            <PieChart className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Активов</p>
            <p className="font-semibold text-sm">{user.portfolio.length}</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 grid w-full grid-cols-3">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="holdings">Активы</TabsTrigger>
          <TabsTrigger value="transactions">История</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Performance Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Динамика портфеля</h3>
              <Badge variant="outline">6 месяцев</Badge>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis dataKey="month" />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Asset Distribution */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Распределение активов</h3>
            <div className="space-y-3">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Performers */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Лучшие активы</h3>
            <div className="space-y-3">
              {user.portfolio
                .sort((a, b) => b.priceChange24h - a.priceChange24h)
                .slice(0, 3)
                .map((token) => {
                  const { icon: AssetIcon } = assetTypeIcons[token.assetType];
                  return (
                    <div key={token.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <AssetIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{token.symbol}</p>
                          <p className="text-xs text-gray-600">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(token.value)}</p>
                        <p className="text-xs text-green-600">+{token.priceChange24h}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="holdings" className="flex-1 p-4 space-y-3 overflow-y-auto">
          {user.portfolio.map((token) => {
            const { icon: AssetIcon, color } = assetTypeIcons[token.assetType];
            
            return (
              <Card key={token.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}>
                      <AssetIcon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{token.name}</h3>
                      <p className="text-xs text-gray-600">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(token.value)}</p>
                    <div className="flex items-center space-x-1">
                      {token.priceChange24h > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs ${
                        token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Количество</p>
                    <p className="font-medium">{token.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Цена за токен</p>
                    <p className="font-medium">{formatCurrency(token.value / token.amount)}</p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    Продать
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 text-white">
                    Купить еще
                  </Button>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="transactions" className="flex-1 p-4 space-y-3 overflow-y-auto">
          {transactionHistory.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'buy' ? 'bg-green-100' :
                    transaction.type === 'sell' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <span className="text-xs font-medium">
                      {transaction.type === 'buy' ? '↗' :
                       transaction.type === 'sell' ? '↘' : '$'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {transaction.type === 'buy' ? 'Покупка' :
                       transaction.type === 'sell' ? 'Продажа' : 'Дивиденды'} {transaction.symbol}
                    </p>
                    <p className="text-xs text-gray-600">{transaction.asset}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    transaction.type === 'buy' ? 'text-red-600' :
                    transaction.type === 'sell' || transaction.type === 'dividend' ? 'text-green-600' : ''
                  }`}>
                    {transaction.type === 'buy' ? '-' : '+'}
                    {formatCurrency(transaction.total)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 pt-2 border-t">
                <div>
                  <p>Количество</p>
                  <p className="font-medium">{transaction.amount}</p>
                </div>
                <div>
                  <p>Цена</p>
                  <p className="font-medium">{formatCurrency(transaction.price)}</p>
                </div>
                <div>
                  <p>Статус</p>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    Завершено
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}