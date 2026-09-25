import React, { useState } from 'react';
import { BellRing, X, Sparkles, AlertCircle, Settings, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import { playAlertChime } from '../utils/audio';

interface NotificationBannerProps {
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  dismissed: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
  soundEnabled: boolean;
  onSendTestNotification: () => void;
  onOpenPushSettings?: () => void;
  onSendDelayedTest?: (seconds: number) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  permission,
  dismissed,
  onRequestPermission,
  onDismiss,
  soundEnabled,
  onSendTestNotification,
  onOpenPushSettings,
  onSendDelayedTest
}) => {
  const [testingDelay, setTestingDelay] = useState(false);

  if (dismissed || permission === 'unsupported') {
    return null;
  }

  const handleTest = () => {
    if (soundEnabled) playAlertChime();
    onSendTestNotification();
  };

  const handle10sTest = () => {
    setTestingDelay(true);
    if (onSendDelayedTest) {
      onSendDelayedTest(10);
    }
    setTimeout(() => setTestingDelay(false), 10000);
  };

  // 1. Permission Denied State - Clear guidance for Android Chrome users
  if (permission === 'denied') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 animate-fadeIn">
        <div className="rounded-2xl bg-gradient-to-r from-amber-700 via-rose-800 to-rose-900 p-4 text-white shadow-md shadow-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-rose-600/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold font-classic text-sm sm:text-base">
                <span>Notifications Blocked in Chrome</span>
              </div>
              <p className="text-xs text-rose-100 font-normal leading-relaxed mt-0.5">
                Chrome on Android is blocking alerts. Tap the lock icon 🔒 in the URL bar to allow notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenPushSettings && (
              <button
                type="button"
                onClick={onOpenPushSettings}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white text-rose-950 text-xs font-bold hover:bg-rose-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-rose-700" />
                <span>How to Unblock</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              title="Dismiss"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Permission Granted State - Show subtle status pill with quick background test button
  if (permission === 'granted') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 animate-fadeIn">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900/90 via-purple-950/90 to-indigo-950/90 backdrop-blur-sm p-3 px-4 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                <span>Android Background Push Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-purple-200/80">
                You will receive alerts in Android's notification panel even when Chrome is closed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handle10sTest}
              disabled={testingDelay}
              title="Schedule a 10s background test notification so you can close Chrome and see it arrive in Android notification panel"
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[11px] font-semibold border border-purple-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-3 h-3 text-purple-300" />
              <span>{testingDelay ? 'Close Chrome Now!' : 'Test 10s Background Push'}</span>
            </button>

            {onOpenPushSettings && (
              <button
                type="button"
                onClick={onOpenPushSettings}
                title="Open Push Notifications & Android Settings"
                className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onDismiss}
              title="Dismiss"
              className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Default (Unprompted) State
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 animate-fadeIn">
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 p-4 text-white shadow-md shadow-purple-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all border border-purple-600/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs flex-shrink-0">
            <BellRing className="w-5 h-5 text-purple-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold font-classic text-sm sm:text-base">
              <span>Enable Android Background Push & Alerts</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
            <p className="text-xs text-purple-200 font-normal leading-relaxed mt-0.5">
              Receive reminders in Android's notification panel for class timetable, lab prep, body stretch & habits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onRequestPermission}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white text-purple-950 text-xs font-bold hover:bg-purple-50 transition-colors shadow-xs cursor-pointer active:scale-98"
          >
            Enable Push Alerts
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
          >
            Test
          </button>
          {onOpenPushSettings && (
            <button
              type="button"
              onClick={onOpenPushSettings}
              title="Push Settings & Android Guide"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
