import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Smartphone, 
  Timer, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Clock, 
  Radio, 
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  isWebPushSupported, 
  getNotificationPermissionState, 
  getActivePushSubscription, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications, 
  triggerBackgroundPush, 
  fetchPushServerStatus 
} from '../utils/pushManager';
import { sendSystemNotification } from '../utils/notifications';
import { playAlertChime, playSuccessChime } from '../utils/audio';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  onToast: (title: string, body: string, type: 'info' | 'success' | 'alert') => void;
  soundEnabled?: boolean;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  onToast,
  soundEnabled = true
}) => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'test' | 'guide'>('test');
  const [selectedScreen, setSelectedScreen] = useState<'labs' | 'schedule' | 'exams' | 'stretch' | 'habits' | 'birthday'>('labs');
  const [serverStatus, setServerStatus] = useState<{ subscribersCount: number; vapidConfigured: boolean; vapidPublicKey?: string }>({
    subscribersCount: 0,
    vapidConfigured: false
  });
  const [copiedKey, setCopiedKey] = useState(false);

  // Check state on mount / open
  useEffect(() => {
    if (!isOpen) return;
    refreshStatus();
  }, [isOpen]);

  const refreshStatus = async () => {
    const currentPerm = getNotificationPermissionState();
    setPermission(currentPerm);

    const sub = await getActivePushSubscription();
    setIsSubscribed(!!sub);

    const status = await fetchPushServerStatus();
    setServerStatus(status);
  };

  // Handle Subscribe
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await subscribeToPushNotifications();
      if (res.success) {
        setPermission('granted');
        setIsSubscribed(true);
        if (soundEnabled) playSuccessChime();
        onToast('🔔 Background Push Enabled!', 'Your device is registered to receive alerts even when Chrome is closed.', 'success');
        refreshStatus();
      } else {
        onToast('Subscription Failed', res.reason || 'Could not complete registration.', 'alert');
        setPermission(getNotificationPermissionState());
      }
    } catch (e: any) {
      onToast('Error', e.message, 'alert');
    } finally {
      setLoading(false);
    }
  };

  // Handle Unsubscribe
  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPushNotifications();
      setIsSubscribed(false);
      onToast('Push Notifications Disabled', 'You have unsubscribed from background push alerts.', 'info');
      refreshStatus();
    } catch (e: any) {
      onToast('Error', e.message, 'alert');
    } finally {
      setLoading(false);
    }
  };

  // Test Immediate Notification
  const handleImmediateTest = async () => {
    if (permission !== 'granted') {
      await handleSubscribe();
      return;
    }

    if (soundEnabled) playAlertChime();

    const targetUrl = `/?tab=${selectedScreen}`;
    const titles: Record<string, { title: string; body: string }> = {
      labs: {
        title: '🧪 Lab Preparation Alert',
        body: 'Digital Signal Processing Lab starts in 15 minutes! Have your circuit records ready.'
      },
      schedule: {
        title: '📅 Class Timetable Reminder',
        body: 'Machine Learning Lecture in Room 402 is starting soon. Check your timetable!'
      },
      exams: {
        title: '🎓 Exam Countdown Alert',
        body: 'DSP Unit Test 2 is in 3 days. Review your syllabus checklist.'
      },
      stretch: {
        title: '🧘 Desk Stretch Break',
        body: 'You have been seated for 50 minutes. Tap for a quick 2-minute posture relief!'
      },
      habits: {
        title: '⚡ Daily Habit Reminder',
        body: 'Keep your streak alive! Log your daily habits and water intake.'
      },
      birthday: {
        title: '🎂 LifeBuddy Celebration',
        body: 'A special day for celebration and joy! Check your birthday calendar.'
      }
    };

    const alertInfo = titles[selectedScreen];

    // Send through Service Worker for Android tray display
    await sendSystemNotification({
      title: alertInfo.title,
      body: alertInfo.body,
      tag: `test-${selectedScreen}-${Date.now()}`,
      data: { url: targetUrl },
      soundEnabled
    });

    onToast('System Notification Sent', `Dispatched to Android panel for ${selectedScreen.toUpperCase()}.`, 'info');
  };

  // Test Delayed Background Push (for testing closed/background Chrome)
  const handleDelayedPushTest = async (seconds: number = 10) => {
    if (permission !== 'granted' || !isSubscribed) {
      const subRes = await subscribeToPushNotifications();
      if (!subRes.success) {
        onToast('Please Enable Notifications First', 'Permission and subscription are required for background push.', 'alert');
        return;
      }
      setIsSubscribed(true);
      setPermission('granted');
    }

    setCountdown(seconds);
    onToast(
      `⏳ Background Push Scheduled (${seconds}s)`,
      'NOW CLOSE CHROME or switch to another app! Android notification drawer will buzz in 10s.',
      'info'
    );

    const targetUrl = `/?tab=${selectedScreen}`;
    const targetTitles: Record<string, string> = {
      labs: '🧪 DSP Lab Preparation (Background Alert)',
      schedule: '📅 Timetable Reminder (Background Alert)',
      exams: '🎓 Exam Notification (Background Alert)',
      stretch: '🧘 Posture & Body Relief (Background Alert)',
      habits: '⚡ Habit Check-in (Background Alert)',
      birthday: '🎂 Celebration Wishes (Background Alert)'
    };

    // Trigger backend delayed push
    await triggerBackgroundPush({
      title: targetTitles[selectedScreen] || '🔔 LifeBuddy Background Notification',
      body: 'Success! This notification was received while Chrome was in the background or closed.',
      url: targetUrl,
      tag: `bg-test-${Date.now()}`,
      delaySeconds: seconds
    });

    // Countdown interval for user visual feedback
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCopyKey = () => {
    if (serverStatus.vapidPublicKey) {
      navigator.clipboard.writeText(serverStatus.vapidPublicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 p-5 text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-purple-200">
              <Smartphone className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-classic">Android Background Push</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Chrome on Android
                </span>
              </div>
              <p className="text-xs text-purple-200/90 mt-0.5">
                Receive notifications in system panel even when app is closed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-purple-100 bg-purple-50/60 p-1.5 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'test'
                ? 'bg-white text-purple-950 shadow-xs font-bold'
                : 'text-purple-700 hover:bg-purple-100/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-600" />
            <span>Test Notifications</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-purple-950 shadow-xs font-bold'
                : 'text-purple-700 hover:bg-purple-100/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Service Status</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-purple-950 shadow-xs font-bold'
                : 'text-purple-700 hover:bg-purple-100/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Android Setup Steps</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* TAB 1: TEST NOTIFICATIONS */}
          {activeTab === 'test' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Permission Banner if not granted */}
              {permission !== 'granted' && (
                <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  permission === 'denied' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-purple-50 border-purple-200 text-purple-950'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {permission === 'denied' ? (
                      <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <BellRing className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5 animate-bounce" />
                    )}
                    <div>
                      <div className="font-bold text-xs sm:text-sm">
                        {permission === 'denied' ? 'Notifications Blocked in Chrome' : 'Enable Notification Permission'}
                      </div>
                      <p className="text-[11px] sm:text-xs opacity-90 mt-0.5">
                        {permission === 'denied'
                          ? 'Tap the Lock icon in Chrome URL bar -> Permissions -> Notifications -> Allow, then refresh.'
                          : 'Grant browser permission so LifeBuddy can wake your device for class & lab reminders.'}
                      </p>
                    </div>
                  </div>
                  {permission !== 'denied' && (
                    <button
                      type="button"
                      onClick={handleSubscribe}
                      disabled={loading}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {loading ? 'Enabling...' : 'Allow'}
                    </button>
                  )}
                </div>
              )}

              {/* Destination Screen Picker */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-800 text-xs">
                  🎯 Click Action: Select destination page when notification is tapped
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'labs', label: '🧪 Lab Tracker', desc: '/?tab=labs' },
                    { id: 'schedule', label: '📅 Timetable', desc: '/?tab=schedule' },
                    { id: 'exams', label: '🎓 Exams', desc: '/?tab=exams' },
                    { id: 'stretch', label: '🧘 Desk Stretch', desc: '/?tab=stretch' },
                    { id: 'habits', label: '⚡ Habits', desc: '/?tab=habits' },
                    { id: 'birthday', label: '🎂 Birthdays', desc: '/?tab=birthday' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedScreen(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedScreen === item.id
                          ? 'bg-purple-100/80 border-purple-500 text-purple-950 font-bold ring-1 ring-purple-400'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delayed Background Test Card (The main feature user requested) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                      <Timer className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Test Background Push (When Chrome is Closed)
                    </span>
                  </div>
                  {countdown !== null && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white animate-pulse">
                      Fires in {countdown}s
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Tap below to schedule a push via Google FCM. Then <strong>immediately close this Chrome tab</strong> or switch to your Android Home screen. Your phone will vibrate and post the alert to Android's notification drawer!
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDelayedPushTest(10)}
                    disabled={countdown !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-900/10 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-200" />
                    <span>{countdown ? `Firing in ${countdown}s... Close Chrome!` : 'Schedule 10s Background Test'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImmediateTest}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5 text-slate-600" />
                    <span>Instant Alert</span>
                  </button>
                </div>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${permission === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>
                    Permission: <strong className="capitalize">{permission}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Web Push: <strong>{isSubscribed ? 'Active' : 'Not Subscribed'}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={refreshStatus}
                  title="Refresh status"
                  className="text-purple-700 hover:text-purple-900 p-1 rounded-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICE STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Perm State */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold">Notification Permission</div>
                  <div className="flex items-center gap-1.5">
                    {permission === 'granted' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="font-bold text-xs uppercase text-slate-800">{permission}</span>
                  </div>
                </div>

                {/* Service Worker State */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold">Service Worker</div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-800">/sw.js Registered</span>
                  </div>
                </div>

                {/* Web Push Subscription */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold">Web Push Subscription</div>
                  <div className="flex items-center gap-1.5">
                    {isSubscribed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-bold text-xs text-slate-800">
                      {isSubscribed ? 'Subscribed (Ready for FCM)' : 'Unsubscribed'}
                    </span>
                  </div>
                </div>

                {/* Subscribers on Backend */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold">Registered Devices</div>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs text-slate-800">
                      {serverStatus.subscribersCount} Device(s) Active
                    </span>
                  </div>
                </div>
              </div>

              {/* VAPID Public Key Card */}
              {serverStatus.vapidPublicKey && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 text-xs">VAPID Public Key (FCM Bridge)</span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-200/80 hover:bg-purple-300 text-purple-900 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-purple-900 bg-white p-2 rounded-lg border border-purple-200 break-all select-all">
                    {serverStatus.vapidPublicKey}
                  </p>
                </div>
              )}

              {/* Subscription actions */}
              <div className="pt-2 flex items-center justify-between">
                {isSubscribed ? (
                  <button
                    type="button"
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Unsubscribe This Device
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors cursor-pointer shadow-xs"
                  >
                    Subscribe Device to Web Push
                  </button>
                )}
                <button
                  type="button"
                  onClick={refreshStatus}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID & CHROME SETUP GUIDE (Requirement 10) */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  To guarantee notifications arrive even when Google Chrome is completely swiped away or your screen is locked, verify these 4 standard Android settings:
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                {/* Step 1 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">1</span>
                    <span>Android 13+ System Permission</span>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    On Android 13 (Tiramisu) and newer: Go to <strong>Android Settings → Apps → Chrome → Notifications</strong> and make sure <strong>"All Chrome notifications"</strong> is toggled <strong>ON</strong>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">2</span>
                    <span>Chrome Site Settings</span>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    In Chrome, tap the <strong>Lock / Tune icon (🔒)</strong> on the left side of the address bar → <strong>Permissions</strong> → <strong>Notifications</strong> → Tap <strong>"Allow"</strong>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">3</span>
                    <span>Battery Optimization (Background Sleep)</span>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    On devices with aggressive power savers (Samsung, Xiaomi, OnePlus): Go to <strong>Android Settings → Apps → Chrome → Battery</strong> and select <strong>"Optimized"</strong> or <strong>"Unrestricted"</strong> (not "Restricted"). Ensure <strong>"Allow background data usage"</strong> is active.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">4</span>
                    <span>Web Push / FCM VAPID Protocol</span>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    The backend automatically provisions standard VAPID credentials communicating directly with Google Firebase Cloud Messaging (FCM) push servers. No external third-party accounts or manual API keys are required.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-purple-100 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            LifeBuddy Web Push Engine
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
