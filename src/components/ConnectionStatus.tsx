import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Cloud, CloudOff } from 'lucide-react';
import { ConnectionManager } from '../services/connectionManager';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState(ConnectionManager.getConnectionStatus());
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = ConnectionManager.addConnectionListener((isConnected) => {
      const status = ConnectionManager.getConnectionStatus();
      setConnectionStatus(status);
      
      // Показываем статус при изменении
      setShowStatus(true);
      
      // Автоматически скрываем если подключение восстановлено
      if (isConnected) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    });

    // Показываем статус если есть проблемы с подключением
    if (!connectionStatus.isFullyConnected) {
      setShowStatus(true);
    }

    return unsubscribe;
  }, []);

  // Автоматически скрываем статус через 10 секунд для офлайн статуса
  useEffect(() => {
    if (!connectionStatus.isFullyConnected && showStatus) {
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus.isFullyConnected, showStatus]);

  if (!showStatus && connectionStatus.isFullyConnected) {
    return null;
  }

  const getStatusInfo = () => {
    if (!connectionStatus.isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4 text-red-500" />,
        text: 'Нет подключения к интернету',
        badge: 'Офлайн режим',
        badgeVariant: 'destructive' as const
      };
    }
    
    if (!connectionStatus.isFirebaseConnected) {
      return {
        icon: <CloudOff className="w-4 h-4 text-orange-500" />,
        text: 'Проблемы с сервером',
        badge: 'Локальные данные',
        badgeVariant: 'secondary' as const
      };
    }
    
    return {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      text: 'Подключение восстановлено',
      badge: 'Онлайн',
      badgeVariant: 'secondary' as const
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-3 shadow-lg transition-all duration-300 ${
      showStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    } ${className}`}>
      <div className="flex items-center space-x-2">
        {statusInfo.icon}
        <span className="text-sm font-medium">{statusInfo.text}</span>
        <Badge variant={statusInfo.badgeVariant} className="text-xs">
          {statusInfo.badge}
        </Badge>
      </div>
    </Card>
  );
}

// Enhanced network status hook
export function useNetworkStatus() {
  const [connectionStatus, setConnectionStatus] = useState(ConnectionManager.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = ConnectionManager.addConnectionListener(() => {
      setConnectionStatus(ConnectionManager.getConnectionStatus());
    });

    return unsubscribe;
  }, []);

  return {
    isOnline: connectionStatus.isOnline,
    isFirebaseConnected: connectionStatus.isFirebaseConnected,
    isFullyConnected: connectionStatus.isFullyConnected,
    connectionStatus
  };
}