import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { NavigationPage, User } from '../App';
import { useAssets } from '../hooks/useFirebaseData';
import { AssetService, StorageService } from '../services/firebase';
import { ArrowLeft, Upload, Building, Palette, Music, Gamepad2, FileCheck, DollarSign, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TokenizationPageProps {
  user: User;
  onNavigate: (page: NavigationPage) => void;
}

type AssetType = 'real-estate' | 'art' | 'music' | 'gaming';

interface AssetProtocol {
  name: string;
  description: string;
  features: string[];
}

const assetProtocols: Record<AssetType, AssetProtocol[]> = {
  'real-estate': [
    {
      name: 'Фракционная собственность',
      description: 'Разделение недвижимости на доли',
      features: ['Минимальный вход', 'Ликвидность', 'Прозрачность']
    },
    {
      name: 'REIT-токены',
      description: 'Инвестиционные фонды недвижимости',
      features: ['Дивиденды', 'Диверсификация', 'Профессиональное управление']
    },
    {
      name: 'Краудфандинг',
      description: 'Коллективное инвестирование',
      features: ['Низкий порог входа', 'Множество проектов', 'Простота участия']
    }
  ],
  'art': [
    {
      name: 'Фракционное владение',
      description: 'Совместное владение произведениями искусства',
      features: ['Доступность', 'Ликвидность', 'Культурная ценность']
    },
    {
      name: 'Роялти-токены',
      description: 'Доходы от перепродаж',
      features: ['Пассивный доход', 'Рост стоимости', 'Авторские права']
    },
    {
      name: 'Цифровые галереи',
      description: 'NFT коллекции и выставки',
      features: ['Глобальный доступ', 'Верификация', 'Социальное взаимодействие']
    }
  ],
  'music': [
    {
      name: 'Токенизация треков',
      description: 'Права на музыкальные произведения',
      features: ['Авторские права', 'Стриминг доходы', 'Фан-база']
    },
    {
      name: 'Фан-инвестирование',
      description: 'Поддержка артистов через токены',
      features: ['Эксклюзивный контент', 'Встречи с артистами', 'Ранний доступ']
    },
    {
      name: 'Smart-роялти',
      description: 'Автоматическое распределение доходов',
      features: ['Прозрачность', 'Мгновенные выплаты', 'Справедливое распределение']
    }
  ],
  'gaming': [
    {
      name: 'NFT-предметы',
      description: 'Игровые активы как NFT',
      features: ['Межигровая совместимость', 'Торговля', 'Уникальность']
    },
    {
      name: 'Виртуальная недвижимость',
      description: 'Земля и здания в метавселенных',
      features: ['Развитие', 'Аренда', 'Социальное взаимодействие']
    },
    {
      name: 'Achievement токены',
      description: 'Достижения и навыки игроков',
      features: ['Прогресс', 'Репутация', 'Межплатформенность']
    }
  ]
};

const assetTypeInfo = {
  'real-estate': {
    icon: Building,
    name: 'Недвижимость',
    color: 'green'
  },
  'art': {
    icon: Palette,
    name: 'Искусство',
    color: 'purple'
  },
  'music': {
    icon: Music,
    name: 'Музыка',
    color: 'pink'
  },
  'gaming': {
    icon: Gamepad2,
    name: 'Игровые активы',
    color: 'blue'
  }
};

export function TokenizationPage({ user, onNavigate }: TokenizationPageProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<AssetProtocol | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAsset, refreshAssets } = useAssets(user.id);
  
  const [formData, setFormData] = useState({
    assetName: '',
    description: '',
    totalValue: '',
    tokenSupply: '',
    minInvestment: '',
    expectedROI: '',
    documents: [] as File[]
  });

  const handleAssetTypeSelect = (assetType: AssetType) => {
    setSelectedAssetType(assetType);
    setSelectedProtocol(null);
  };

  const handleProtocolSelect = (protocol: AssetProtocol) => {
    setSelectedProtocol(protocol);
  };

  const handleSubmit = async () => {
    if (!selectedAssetType || !selectedProtocol) {
      toast.error('Выберите тип актива и протокол');
      return;
    }

    if (!formData.assetName || !formData.totalValue || !formData.tokenSupply) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents to Firebase Storage if any
      const documentUrls: string[] = [];
      for (const file of formData.documents) {
        const url = await StorageService.uploadAssetDocument(file, `temp-${Date.now()}`, 'document');
        documentUrls.push(url);
      }

      // Create tokenized asset in Firebase
      const assetData = {
        name: formData.assetName,
        symbol: formData.assetName.toUpperCase().replace(/\s+/g, '').slice(0, 6),
        description: formData.description,
        assetType: selectedAssetType,
        protocol: selectedProtocol.name,
        totalValue: parseFloat(formData.totalValue),
        totalSupply: parseInt(formData.tokenSupply),
        availableSupply: parseInt(formData.tokenSupply),
        minInvestment: parseFloat(formData.minInvestment) || 100,
        expectedROI: parseFloat(formData.expectedROI) || 0,
        currentPrice: parseFloat(formData.totalValue) / parseInt(formData.tokenSupply),
        documents: documentUrls,
        verificationStatus: 'pending' as const,
        creatorId: user.id
      };

      toast.info('Создание токенизированного актива...', {
        description: 'Пожалуйста, подождите'
      });

      const assetId = await createAsset(assetData);
      
      toast.success('Актив успешно создан!', {
        description: 'Ваш актив отправлен на модерацию'
      });
      
      // Reset form
      setFormData({
        assetName: '',
        description: '',
        totalValue: '',
        tokenSupply: '',
        minInvestment: '',
        expectedROI: '',
        documents: []
      });
      setSelectedAssetType(null);
      setSelectedProtocol(null);
      
      // Navigate to portfolio after short delay
      setTimeout(() => {
        onNavigate('portfolio');
      }, 2000);

    } catch (error) {
      console.error('Error creating asset:', error);
      toast.error('Ошибка создания актива', {
        description: 'Попробуйте еще раз'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedAssetType) {
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
          <h1 className="text-lg font-semibold">Токенизация активов</h1>
        </div>

        {/* Asset Type Selection */}
        <div className="flex-1 p-4 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Выберите тип актива</h2>
            <p className="text-gray-600">Какой актив вы хотите токенизировать?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(assetTypeInfo) as AssetType[]).map((assetType) => {
              const info = assetTypeInfo[assetType];
              const IconComponent = info.icon;
              
              return (
                <Card
                  key={assetType}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                  onClick={() => handleAssetTypeSelect(assetType)}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-${info.color}-100 flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 text-${info.color}-600`} />
                    </div>
                    <h3 className="font-medium">{info.name}</h3>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedProtocol) {
    const protocols = assetProtocols[selectedAssetType];
    const assetInfo = assetTypeInfo[selectedAssetType];

    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex items-center p-4 pt-12 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAssetType(null)}
            className="mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Выберите протокол</h1>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">{assetInfo.name}</h2>
            <p className="text-gray-600">Выберите подходящий протокол токенизации</p>
          </div>

          <div className="space-y-4">
            {protocols.map((protocol, index) => (
              <Card
                key={index}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                onClick={() => handleProtocolSelect(protocol)}
              >
                <div className="space-y-3">
                  <h3 className="font-semibold">{protocol.name}</h3>
                  <p className="text-sm text-gray-600">{protocol.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {protocol.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Token Creation Form
  const assetInfo = assetTypeInfo[selectedAssetType];
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 pt-12 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedProtocol(null)}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Создание токена</h1>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Selected Protocol Info */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{assetInfo.name}</Badge>
              <Badge variant="outline">{selectedProtocol.name}</Badge>
            </div>
            <p className="text-sm text-gray-700">{selectedProtocol.description}</p>
          </div>
        </Card>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="assetName">Название актива *</Label>
            <Input
              id="assetName"
              placeholder="Например: Квартира в центре Москвы"
              value={formData.assetName}
              onChange={(e) => setFormData({...formData, assetName: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробное описание актива..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalValue">Общая стоимость ($) *</Label>
              <Input
                id="totalValue"
                type="number"
                placeholder="1000000"
                value={formData.totalValue}
                onChange={(e) => setFormData({...formData, totalValue: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="tokenSupply">Кол-во токенов *</Label>
              <Input
                id="tokenSupply"
                type="number"
                placeholder="1000000"
                value={formData.tokenSupply}
                onChange={(e) => setFormData({...formData, tokenSupply: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minInvestment">Мин. инвестиция ($)</Label>
              <Input
                id="minInvestment"
                type="number"
                placeholder="100"
                value={formData.minInvestment}
                onChange={(e) => setFormData({...formData, minInvestment: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="expectedROI">Ожидаемая доходность (%)</Label>
              <Input
                id="expectedROI"
                type="number"
                placeholder="8.5"
                value={formData.expectedROI}
                onChange={(e) => setFormData({...formData, expectedROI: e.target.value})}
              />
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <Label>Документы</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Загрузите документы, подтверждающие право собственности
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Выбрать файлы
              </Button>
            </div>
          </div>

          {/* Features */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Особенности протокола:</h3>
            <div className="space-y-2">
              {selectedProtocol.features.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedAssetType || !selectedProtocol}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Создание актива...
            </>
          ) : (
            'Создать токен'
          )}
        </Button>
      </div>
    </div>
  );
}