import React from 'react';
import { BellRing, X, Sparkles } from 'lucide-react';
import { playAlertChime } from '../utils/audio';

interface NotificationBannerProps {
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  dismissed: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
  soundEnabled: boolean;
  onSendTestNotification: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  permission,
  dismissed,
  onRequestPermission,
  onDismiss,
  soundEnabled,
  onSendTestNotification
}) => {
  if (dismissed || permission === 'granted' || permission === 'unsupported') {
    return null;
  }

  const handleTest = () => {
    if (soundEnabled) playAlertChime();
    onSendTestNotification();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 p-4 text-white shadow-md shadow-purple-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-fadeIn border border-purple-600/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs flex-shrink-0">
            <BellRing className="w-5 h-5 text-purple-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold font-classic text-sm sm:text-base">
              <span>Enable Student & Habit Reminders</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
            <p className="text-xs text-purple-200 font-normal leading-relaxed mt-0.5">
              Receive notifications for lab preparation, body stretch relief cues & daily habits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onRequestPermission}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white text-purple-950 text-xs font-bold hover:bg-purple-50 transition-colors shadow-xs"
          >
            Enable Alerts
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors"
          >
            Test
          </button>
          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
