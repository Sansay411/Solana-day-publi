import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  CreditCard, 
  Shield, 
  Car,
  GraduationCap,
  Heart,
  Home,
  Briefcase,
  ChevronRight,
  Wallet,
  QrCode
} from 'lucide-react';
import { User, NavigationPage } from '../App';
import { toast } from 'sonner@2.0.3';
import { SolanaService } from '../services/solana';

interface GovServicesPageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
}

interface GovService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: React.ReactNode;
  processingTime: string;
  requirements: string[];
}

const govServices: GovService[] = [
  {
    id: 'passport',
    name: 'Загранпаспорт',
    description: 'Оформление заграничного паспорта РК',
    price: 0.2,
    category: 'Документы',
    icon: <FileText className="w-6 h-6" />,
    processingTime: '30 дней',
    requirements: ['Казахстанское гражданство', 'Фото 3x4 см']
  },
  {
    id: 'driving-license',
    name: 'Водительские права',
    description: 'Получение/замена водительского удостоверения РК',
    price: 0.15,
    category: 'Транспорт',
    icon: <Car className="w-6 h-6" />,
    processingTime: '10 дней',
    requirements: ['Медицинская справка', 'Сертификат о прохождении курсов']
  },
  {
    id: 'marriage-certificate',
    name: 'Свидетельство о браке',
    description: 'Регистрация брака в органах РАГС',
    price: 0.08,
    category: 'РАГС',
    icon: <Heart className="w-6 h-6" />,
    processingTime: '1 месяц',
    requirements: ['Удостоверения личности сторон', 'Заявление о регистрации брака']
  },
  {
    id: 'property-registration',
    name: 'Регистрация собственности',
    description: 'Оформление права собственности на недвижимость в РК',
    price: 0.5,
    category: 'Недвижимость',
    icon: <Home className="w-6 h-6" />,
    processingTime: '15 дней',
    requirements: ['Документы на объект', 'Техническая характеристика']
  },
  {
    id: 'business-registration',
    name: 'Регистрация ИП',
    description: 'Государственная регистрация индивидуального предпринимателя',
    price: 0.03,
    category: 'Бизнес',
    icon: <Briefcase className="w-6 h-6" />,
    processingTime: '1 день',
    requirements: ['Удостоверение личности', 'Заявление', 'ИИН']
  },
  {
    id: 'education-certificate',
    name: 'Справка об образовании',
    description: 'Справка о текущем образовании из учебного заведения',
    price: 0.02,
    category: 'Образование',
    icon: <GraduationCap className="w-6 h-6" />,
    processingTime: '3 дня',
    requirements: ['Удостоверение личности', 'Студенческий билет']
  }
];

export function GovServicesPage({ user, onNavigate }: GovServicesPageProps) {
  const [selectedService, setSelectedService] = useState<GovService | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    fullName: '',
    passport: '',
    address: '',
    phone: ''
  });

  const categories = [...new Set(govServices.map(service => service.category))];

  const handleServiceSelect = (service: GovService) => {
    setSelectedService(service);
  };

  const handlePayment = async () => {
    if (!selectedService) return;

    if (!paymentData.fullName || !paymentData.passport) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsProcessing(true);

    try {
      const solPrice = await SolanaService.getSolanaPrice();
      const solAmount = selectedService.price;

      toast.loading('��нициализация платежа...', { id: 'payment' });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTransaction = {
        id: `gov-${Date.now()}`,
        userId: user.id,
        type: 'govservice' as const,
        tokenId: selectedService.id,
        tokenSymbol: 'SOL',
        tokenName: selectedService.name,
        amount: 1,
        pricePerToken: selectedService.price,
        totalValue: selectedService.price * solPrice,
        solAmount: solAmount,
        solPrice: solPrice,
        transactionHash: `gov_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress: user.walletAddress || 'demo_wallet',
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        assetType: 'govservice' as const,
        serviceType: selectedService.category
      };

      toast.success('Оплата успешно проведена!', { 
        id: 'payment',
        description: `Заявка на ${selectedService.name} подана`
      });

      toast.info(`Ваша заявка будет обработана в течение ${selectedService.processingTime}`, {
        duration: 5000
      });

      setSelectedService(null);
      setPaymentData({ fullName: '', passport: '', address: '', phone: '' });

    } catch (error) {
      toast.error('Ошибка при проведении платежа', { id: 'payment' });
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedService) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedService(null)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Оплата госуслуги</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {selectedService.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedService.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline">{selectedService.category}</Badge>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{selectedService.price} SOL</p>
                    <p className="text-xs text-gray-500">≈ ${(selectedService.price * 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Информация о заявителе</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">ФИО *</label>
                <Input
                  value={paymentData.fullName}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Назарбаев Нурсултан Абишевич"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Номер удостоверения личности *</label>
                <Input
                  value={paymentData.passport}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, passport: e.target.value }))}
                  placeholder="123456789012"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Адрес регистрации</label>
                <Input
                  value={paymentData.address}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="г. Алматы, ул. Абая, д. 150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <Input
                  value={paymentData.phone}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (701) 123-45-67"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Требования</h3>
            <ul className="space-y-2">
              {selectedService.requirements.map((req, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Срок обработки:</strong> {selectedService.processingTime}
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isProcessing ? (
                'Обработка...'
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Оплатить {selectedService.price} SOL
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Оплата производится через Solana Phantom Wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Госуслуги</h1>
            <p className="text-sm text-gray-600">Оплата через Solana</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Безопасно
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Цифровые госуслуги</h3>
              <p className="text-sm text-blue-700">Быстро, безопасно, с использованием блокчейн</p>
            </div>
          </div>
        </div>

        {categories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
            <div className="space-y-3">
              {govServices
                .filter(service => service.category === category)
                .map(service => (
                  <Card 
                    key={service.id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {service.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-gray-600">{service.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {service.processingTime}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-blue-600">
                              {service.price} SOL
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold">Безопасность платежей</h4>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Все транзакции защищены блокчейн Solana</li>
            <li>• Мгновенное подтверждение платежа</li>
            <li>• Прозрачность и отслеживаемость</li>
            <li>• Низкие комиссии за операции</li>
          </ul>
        </div>
      </div>
    </div>
  );
}