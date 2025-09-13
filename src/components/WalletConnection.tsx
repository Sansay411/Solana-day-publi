import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Wallet } from 'lucide-react';

interface WalletConnectionProps {
  onConnect: (connected: boolean) => void;
}

export function WalletConnection({ onConnect }: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectPhantomWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if Phantom is available
      const { solana } = window as any;
      
      if (solana && solana.isPhantom) {
        // Real Phantom connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await solana.connect();
        console.log('Connected with Public Key:', response.publicKey.toString());
        toast.success('Phantom Wallet успешно подключен!');
      } else {
        // Demo mode when Phantom is not available
        console.error('Phantom wallet not found. Please install Phantom extension.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Демо-кошелек подключен! (Установите Phantom для реального кошелька)');
      }
      
      onConnect(true);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // Always allow demo connection as fallback
      toast.success('Демо-кошелек подключен (Phantom недоступен)');
      onConnect(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const createNewWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Новый кошелек создан!');
      onConnect(true);
    } catch (error) {
      toast.error('Ошибка создания кошелька');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Добро пожаловать в <span className="text-blue-600">TokenVault</span>
          </h1>
          <p className="text-gray-600">
            Для начала работы подключите кошелек или создайте новый
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={connectPhantomWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl"
          >
            {isConnecting ? 'Подключение...' : 'Подключить Phantom Wallet'}
          </Button>

          <Button
            onClick={createNewWallet}
            disabled={isConnecting}
            variant="outline"
            className="w-full py-3 rounded-xl border-2"
          >
            Создать новый кошелек
          </Button>
        </div>

        {/* Terms */}
        <p className="text-xs text-center text-gray-500">
          Продолжая, вы соглашаетесь с{' '}
          <span className="text-blue-600 underline">Условиями использования</span>
        </p>
      </div>
    </div>
  );
}