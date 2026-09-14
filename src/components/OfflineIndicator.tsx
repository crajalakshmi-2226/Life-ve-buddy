import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside aria-label="Offline notification" className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl border border-amber-400/50 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-100 flex-shrink-0" />
      <span>Offline Mode — Using cached data and local storage</span>
    </aside>
  );
};
