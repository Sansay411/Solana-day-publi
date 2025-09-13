import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { ConnectionManager } from '../services/connectionManager';
import { FirebaseTestService } from '../services/firebase-test';
import { FirebaseOfflineManager } from '../services/firebaseOffline';
import { AppModeManager } from '../services/appModeManager';
import { toast } from 'sonner@2.0.3';

export function FirebaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState(ConnectionManager.getConnectionStatus());
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState<any>(null);
  const [offlineStats, setOfflineStats] = useState(FirebaseOfflineManager.getStats());
  const [appMode, setAppMode] = useState(AppModeManager.getCurrentMode());
  const [appStats, setAppStats] = useState(AppModeManager.getStats());

  useEffect(() => {
    const connectionUnsubscribe = ConnectionManager.addConnectionListener(() => {
      setConnectionStatus(ConnectionManager.getConnectionStatus());
    });

    const offlineUnsubscribe = FirebaseOfflineManager.addOfflineModeListener(() => {
      setOfflineStats(FirebaseOfflineManager.getStats());
    });

    const modeUnsubscribe = AppModeManager.addModeListener((mode) => {
      setAppMode(mode);
      setAppStats(AppModeManager.getStats());
    });

    // Периодически обновляем статистику
    const statsInterval = setInterval(() => {
      setOfflineStats(FirebaseOfflineManager.getStats());
      setAppStats(AppModeManager.getStats());
    }, 5000);

    return () => {
      connectionUnsubscribe();
      offlineUnsubscribe();
      modeUnsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const results = await FirebaseTestService.testFirebaseConnection();
      setLastTest(results);
      
      if (results.overall) {
        toast.success('Firebase подключен успешно!');
      } else {
        toast.error('Проблемы с подключением к Firebase');
      }
    } catch (error) {
      toast.error('Ошибка тестирования Firebase');
    } finally {
      setTesting(false);
    }
  };

  const handleModeSwitch = async () => {
    const nextMode = appMode.mode === 'firebase' ? 'demo' : 'firebase';
    
    try {
      await AppModeManager.forceMode(nextMode, 'Manual switch by user');
      toast.success(`Переключено в ${nextMode === 'firebase' ? 'Firebase' : 'демо'} режим`);
    } catch (error) {
      toast.error('Ошибка переключения режима');
    }
  };

  const handleResetFailures = () => {
    AppModeManager.resetFailureCount();
    toast.success('Счетчик ошибок сброшен');
    setAppStats(AppModeManager.getStats());
  };

  const getStatusColor = () => {
    if (connectionStatus.isFullyConnected) return 'text-green-600';
    if (connectionStatus.isOnline && !connectionStatus.isFirebaseConnected) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (connectionStatus.isFullyConnected) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (connectionStatus.isOnline && !connectionStatus.isFirebaseConnected) {
      return <CloudOff className="w-4 h-4 text-orange-600" />;
    }
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (connectionStatus.isFullyConnected) return 'Firebase подключен';
    if (connectionStatus.isOnline && !connectionStatus.isFirebaseConnected) return 'Проблемы с Firebase';
    return 'Оффлайн режим';
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleModeSwitch}
            >
              {appMode.mode === 'firebase' ? 'Demo' : 'Firebase'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Тест'
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Режим:</span>
            <Badge variant={appMode.mode === 'firebase' ? 'default' : 'secondary'}>
              {appMode.mode === 'firebase' ? 'Firebase' : appMode.mode === 'demo' ? 'Demo' : 'Offline'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Сеть:</span>
            <Badge variant={connectionStatus.isOnline ? 'default' : 'destructive'}>
              {connectionStatus.isOnline ? 'Онлайн' : 'Оффлайн'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Firebase:</span>
            <Badge variant={connectionStatus.isFirebaseConnected ? 'default' : 'secondary'}>
              {connectionStatus.isFirebaseConnected ? 'Подключен' : 'Отключен'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Ошибки:</span>
            <Badge variant={appStats.firebaseFailureCount > 0 ? 'destructive' : 'default'}>
              {appStats.firebaseFailureCount}
            </Badge>
          </div>
        </div>

        {lastTest && (
          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Результаты тестирования:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Auth:</span>
                <span className={lastTest.auth.success ? 'text-green-600' : 'text-red-600'}>
                  {lastTest.auth.success ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Firestore:</span>
                <span className={lastTest.firestore.success ? 'text-green-600' : 'text-red-600'}>
                  {lastTest.firestore.success ? '✓' : '✗'}
                </span>
              </div>
              {lastTest.offline && (
                <div className="flex items-center justify-between">
                  <span>Офлайн менеджер:</span>
                  <span className={lastTest.offline.success ? 'text-green-600' : 'text-red-600'}>
                    {lastTest.offline.success ? '✓' : '✗'}
                  </span>
                </div>
              )}
              {!lastTest.overall && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                  {lastTest.firestore.message || 'Проблемы с подключением'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Режим приложения:</h4>
            {appStats.firebaseFailureCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFailures}
                className="text-xs"
              >
                Сбросить
              </Button>
            )}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Текущий режим:</strong> {appMode.mode}</p>
            <p><strong>Причина:</strong> {appMode.reason}</p>
            <p><strong>Ошибки Firebase:</strong> {appStats.firebaseFailureCount}/{appStats.maxFailures}</p>
            <p><strong>Время:</strong> {appMode.timestamp.toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>🔧 Работает в режиме офлайн persistence</p>
          <p>💾 Данные синхронизируются автоматически при восстановлении соединения</p>
        </div>
      </div>
    </Card>
  );
}