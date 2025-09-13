import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { CloudOff, Wifi, Monitor } from 'lucide-react';
import { AppModeManager } from '../services/appModeManager';

export function OfflineIndicator() {
  const [appMode, setAppMode] = useState(AppModeManager.getCurrentMode());

  useEffect(() => {
    const unsubscribe = AppModeManager.addModeListener((mode) => {
      setAppMode(mode);
    });

    return unsubscribe;
  }, []);

  // Показываем индикатор только если не в Firebase режиме
  if (appMode.mode === 'firebase') {
    return null;
  }

  const getModeInfo = () => {
    switch (appMode.mode) {
      case 'demo':
        return {
          icon: <Monitor className="w-3 h-3 mr-1" />,
          text: 'Демо режим',
          className: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'offline':
        return {
          icon: <CloudOff className="w-3 h-3 mr-1" />,
          text: 'Офлайн режим',
          className: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      default:
        return {
          icon: <CloudOff className="w-3 h-3 mr-1" />,
          text: 'Локальный режим',
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40">
      <Badge variant="secondary" className={modeInfo.className}>
        {modeInfo.icon}
        {modeInfo.text}
      </Badge>
    </div>
  );
}