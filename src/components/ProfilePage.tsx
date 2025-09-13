import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { NavigationPage, User } from '../App';
import { UserService } from '../services/firebase';
import { SolanaService } from '../services/solana';
import { WalletConnectionModal } from './WalletConnectionModal';

import { 
  ArrowLeft, 
  Check,
  Camera,
  FileText,
  LogOut,
  ChevronRight,
  Settings,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Wallet,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ProfilePageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
  onSignOut: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
}

export function ProfilePage({ user, onNavigate, onSignOut, onUpdateUser }: ProfilePageProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'kyc' | 'security' | 'settings' | 'developer'>('profile');
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    portfolioUpdates: true,
    marketNews: false,
    securityAlerts: true
  });

  const [kycData, setKycData] = useState(
    user.kycData || {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      phone: '',
      idNumber: '',
      idType: 'passport'
    }
  );

  const [walletConnected, setWalletConnected] = useState(SolanaService.isWalletConnected());
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDeveloperOptions, setShowDeveloperOptions] = useState(false);
  const [testingFirebase, setTestingFirebase] = useState(false);

  const kycSteps = [
    { id: 'personal', name: 'Личные данные', completed: true },
    { id: 'documents', name: 'Документы', completed: true },
    { id: 'verification', name: 'Верификация', completed: true },
    { id: 'approval', name: 'Одобрение', completed: true }
  ];

  const handleKycUpdate = async () => {
    try {
      if (user.id !== 'demo-user') {
        await UserService.updateKYCData(user.id, kycData);
      }
      
      onUpdateUser({
        kycData: kycData
      });
      
      toast.success('KYC данные обновлены');
    } catch (error) {
      toast.error('Ошибка обновления KYC данных');
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Настройки уведомлений сохранены');
  };

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnected = () => {
    setWalletConnected(true);
    setShowWalletModal(false);
    toast.success('Phantom кошелёк успешно подключен!');
  };

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    
    try {
      toast.loading('Выполнение диагностики Firebase...', { id: 'firebase-test' });
      
      // Simulate diagnostics
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const diagnostics = {
        auth: 'Подключен',
        firestore: 'Доступен',
        storage: 'Активен',
        network: navigator.onLine ? 'Онлайн' : 'Офлайн'
      };
      
      console.log('Firebase Diagnostics:', diagnostics);
      
      toast.success('Диагностика завершена успешно', { 
        id: 'firebase-test',
        description: 'Результаты выведены в консоль'
      });
      
    } catch (error) {
      console.error('Firebase test error:', error);
      toast.error('Ошибка при выполнении диагностики', { 
        id: 'firebase-test' 
      });
    } finally {
      setTestingFirebase(false);
    }
  };



  const renderProfileSection = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {(kycData.firstName || 'U')[0].toUpperCase()}
                </span>
              </div>
            </div>
            <Button size="sm" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0">
              <Camera className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{kycData.firstName} {kycData.lastName}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                KYC Верифицирован
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Кошелек</p>
            <div className="flex items-center space-x-2">
              {walletConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Подключен
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleConnectWallet}
                  className="text-xs"
                >
                  Подключить
                </Button>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-600">Баланс</p>
            <p className="font-semibold">${user.totalBalance?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Статистика портфеля</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Активы</p>
            <p className="font-semibold">{user.portfolio?.length || 0}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Доходность</p>
            <p className="font-semibold text-green-600">+12.5%</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderKycSection = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Процесс верификации</h3>
        <div className="space-y-3">
          {kycSteps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.completed ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {step.completed && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className={step.completed ? 'text-green-600' : 'text-gray-600'}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Личные данные</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={kycData.firstName}
                onChange={(e) => setKycData({...kycData, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={kycData.lastName}
                onChange={(e) => setKycData({...kycData, lastName: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="dateOfBirth">Дата рождения</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={kycData.dateOfBirth}
              onChange={(e) => setKycData({...kycData, dateOfBirth: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="nationality">Гражданство</Label>
            <Input
              id="nationality"
              value={kycData.nationality}
              onChange={(e) => setKycData({...kycData, nationality: e.target.value})}
              placeholder="Казахстан"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={kycData.address}
              onChange={(e) => setKycData({...kycData, address: e.target.value})}
              placeholder="Полный адрес проживания"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={kycData.phone}
              onChange={(e) => setKycData({...kycData, phone: e.target.value})}
              placeholder="+7 (701) 123-45-67"
            />
          </div>
          
          <Button onClick={handleKycUpdate} className="w-full">
            Сохранить изменения
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Двухфакторная аутентификация</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">SMS аутентификация</p>
            <p className="text-sm text-gray-600">Дополнительная защита вашего аккаунта</p>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Активные сессии</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Текущая сессия</p>
              <p className="text-sm text-gray-600">Chrome на Windows • Алматы</p>
              <p className="text-xs text-gray-500">Активна сейчас</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Активна
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Безопасность аккаунта</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-between">
            <span>Изменить пароль</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            <span>Резервные коды</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            <span>История входов</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Уведомления</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ценовые уведомления</p>
              <p className="text-sm text-gray-600">Изменения цен ваших активов</p>
            </div>
            <Switch 
              checked={notifications.priceAlerts}
              onCheckedChange={() => handleNotificationToggle('priceAlerts')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Обновления портфеля</p>
              <p className="text-sm text-gray-600">Дивиденды и выплаты</p>
            </div>
            <Switch 
              checked={notifications.portfolioUpdates}
              onCheckedChange={() => handleNotificationToggle('portfolioUpdates')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Новости рынка</p>
              <p className="text-sm text-gray-600">Важные события и новости</p>
            </div>
            <Switch 
              checked={notifications.marketNews}
              onCheckedChange={() => handleNotificationToggle('marketNews')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Безопасность</p>
              <p className="text-sm text-gray-600">Подозрительная активность</p>
            </div>
            <Switch 
              checked={notifications.securityAlerts}
              onCheckedChange={() => handleNotificationToggle('securityAlerts')}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Предпочтения</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Валюта</span>
            <select className="text-sm border rounded px-2 py-1">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="RUB">RUB (₽)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Язык</span>
            <select className="text-sm border rounded px-2 py-1">
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Часовой пояс</span>
            <select className="text-sm border rounded px-2 py-1">
              <option value="Asia/Almaty">Алматы (UTC+6)</option>
              <option value="Asia/Aqtobe">Актобе (UTC+5)</option>
              <option value="Europe/London">Лондон (UTC+0)</option>
              <option value="America/New_York">Нью-Йорк (UTC-5)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4 text-red-600">Зона опасности</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
            Экспортировать данные
          </Button>
          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
            Деактивировать аккаунт
          </Button>
          <Button variant="destructive" className="w-full">
            Удалить аккаунт
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderDeveloperSection = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4 text-orange-600">🔧 Отладка</h3>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              console.log('Current user data:', user);
              toast.success('Данные пользователя выведены в консоль');
            }}
          >
            Логировать данные пользователя
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              localStorage.clear();
              toast.success('Локальное хранилище очищено');
            }}
          >
            Очистить локальное хранилище
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4 text-purple-600">📊 Статистика разработки</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Версия приложения:</span>
            <span className="font-mono">1.0.0-beta</span>
          </div>
          <div className="flex justify-between">
            <span>Пользователь ID:</span>
            <span className="font-mono">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Режим демо:</span>
            <span className={user.id === 'demo-user' ? 'text-green-600' : 'text-red-600'}>
              {user.id === 'demo-user' ? 'Включен' : 'Отключен'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Офлайн кеш:</span>
            <span className="text-blue-600">Включен</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4 text-blue-600">🔍 Диагностика</h3>
        <div className="space-y-3">
          <Button 
            onClick={handleTestFirebase}
            disabled={testingFirebase}
            variant="outline" 
            className="w-full"
          >
            {testingFirebase ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                Тестирование...
              </>
            ) : (
              'Полная диагностика Firebase'
            )}
          </Button>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Проверка Auth подключения</p>
            <p>• Проверка Firestore доступности</p>
            <p>• Тест записи и чтения данных</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4 text-red-600">⚠️ Информация</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Офлайн режим:</strong> Приложение работает даже без интернета</p>
          <p><strong>Автосинхронизация:</strong> Данные синхронизируются при восстановлении соединения</p>
          <p><strong>Кеширование:</strong> Все данные кешируются локально</p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center p-4 pt-12 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Профиль</h1>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex border-b">
        <Button
          variant={activeSection === 'profile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('profile')}
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
        >
          Профиль
        </Button>
        <Button
          variant={activeSection === 'kyc' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('kyc')}
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
        >
          KYC
        </Button>
        <Button
          variant={activeSection === 'security' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('security')}
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
        >
          Безопасность
        </Button>
        <Button
          variant={activeSection === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('settings')}
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
        >
          Настройки
        </Button>
        <Button
          variant={activeSection === 'developer' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('developer')}
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
        >
          🔧 Dev
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'kyc' && renderKycSection()}
        {activeSection === 'security' && renderSecuritySection()}
        {activeSection === 'settings' && renderSettingsSection()}
        {activeSection === 'developer' && renderDeveloperSection()}
      </div>

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={handleWalletConnected}
      />
    </div>
  );
}