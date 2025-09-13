import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { SolanaService } from '../services/solana';
import { 
  Wallet,
  Download,
  Chrome,
  Globe,
  Check,
  ExternalLink,
  Monitor,
  Smartphone,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function WalletConnectionModal({ isOpen, onClose, onConnected }: WalletConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);
  const [currentStep, setCurrentStep] = useState<'check' | 'install' | 'connect'>('check');

  useEffect(() => {
    if (isOpen) {
      checkPhantomAvailability();
    }
  }, [isOpen]);

  const checkPhantomAvailability = () => {
    const { solana } = window as any;
    if (solana && solana.isPhantom) {
      setHasPhantom(true);
      setCurrentStep('connect');
    } else {
      setHasPhantom(false);
      setCurrentStep('install');
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await SolanaService.connectPhantomWallet();
      toast.success('Phantom кошелёк успешно подключен!');
      onConnected?.();
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Ошибка подключения. Попробуйте перезагрузить страницу.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstallPhantom = () => {
    window.open('https://phantom.app/', '_blank');
    setTimeout(() => {
      checkPhantomAvailability();
    }, 3000);
  };

  const renderCheckStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
        <Wallet className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold">Проверяем кошелёк...</h3>
      <p className="text-gray-600">Ищем установленные криптокошельки</p>
      <div className="flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    </div>
  );

  const renderInstallStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Download className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Установите Phantom Wallet</h3>
        <p className="text-gray-600">Phantom - это безопасный кошелёк для Solana блокчейна</p>
      </div>

      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start space-x-3">
          <Monitor className="w-5 h-5 text-purple-600 mt-1" />
          <div>
            <h4 className="font-medium text-purple-900">Для ПК (Рекомендуется)</h4>
            <p className="text-sm text-purple-700 mb-3">Установите расширение для браузера</p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa', '_blank')}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Chrome / Edge / Brave
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://addons.mozilla.org/en-US/firefox/addon/phantom-app/', '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Firefox
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Smartphone className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900">Для мобильных</h4>
            <p className="text-sm text-blue-700 mb-3">Скачайте мобильное приложение</p>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open('https://phantom.app/download', '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              App Store / Google Play
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Важно!</h4>
            <p className="text-sm text-yellow-800">
              После установки расширения перезагрузите эту страницу, чтобы подключить кошелёк.
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex-1"
        >
          Перезагрузить страницу
        </Button>
        <Button
          onClick={handleInstallPhantom}
          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
        >
          Установить Phantom
        </Button>
      </div>
    </div>
  );

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Phantom кошелёк найден!</h3>
        <p className="text-gray-600">Нажмите кнопку ниже, чтобы подключить кошелёк к TokenVault</p>
      </div>

      <Card className="p-4 bg-green-50 border-green-200">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800">Phantom Wallet обнаружен</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800">Готов к подключению</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800">Поддерживается Solana сеть</span>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Что произойдёт?</h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• Откроется окно Phantom для подтверждения</li>
              <li>• Вы сможете покупать токены за SOL</li>
              <li>• Все транзакции будут демонстрационными</li>
            </ul>
          </div>
        </div>
      </div>

      <Button
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Подключение...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Подключить Phantom
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Подключение кошелька</span>
          </DialogTitle>
          <DialogDescription>
            Подключите Phantom Wallet для совершения транзакций в TokenVault
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentStep === 'check' && renderCheckStep()}
          {currentStep === 'install' && renderInstallStep()}
          {currentStep === 'connect' && renderConnectStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}