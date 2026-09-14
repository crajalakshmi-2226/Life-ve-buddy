import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare, ArrowUpRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running in standalone mode, don't show install buttons unless pill specifically requested
  if (isInstalled) {
    if (variant === 'pill') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>LifeBuddy Installed</span>
        </span>
      );
    }
    return null;
  }

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
      }
    } else {
      // If native prompt is not yet ready or iOS, show guided instructions
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleTriggerInstall}
          title="Install LifeBuddy on your phone or computer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white shadow-xs border border-purple-500/40 transition-all active:scale-95 cursor-pointer animate-pulse"
        >
          <Download className="w-3.5 h-3.5 text-purple-200" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-md border border-purple-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-white text-base">
              📱
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-classic text-purple-50">
                Install LifeBuddy as a Native App
              </h4>
              <p className="text-[11px] text-purple-300">
                Works offline, instant home-screen launch, and class schedule reminders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTriggerInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Guided Installation Modal for iOS Safari / Non-Chromium or Manual Installs */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-purple-200 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 text-xl font-bold">
                📱
              </div>
              <div>
                <h3 className="text-base font-bold font-classic text-purple-950">
                  Install LifeBuddy App
                </h3>
                <p className="text-xs text-purple-700">
                  {isIOS ? 'Instructions for iPhone & iPad (iOS Safari)' : 'Browser Installation Guide'}
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 py-2 text-xs text-purple-950">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="p-1.5 rounded-lg bg-purple-200 text-purple-900 font-bold">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block font-bold">Step 1: Tap the Share Button</strong>
                    <span className="text-purple-700">In Safari's bottom toolbar, tap the square Share icon with an upward arrow.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="p-1.5 rounded-lg bg-purple-200 text-purple-900 font-bold">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block font-bold">Step 2: Add to Home Screen</strong>
                    <span className="text-purple-700">Scroll down in the share sheet and tap <em>"Add to Home Screen"</em>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="p-1.5 rounded-lg bg-emerald-200 text-emerald-950 font-bold">
                    <Check className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <strong className="block font-bold">Step 3: Confirm & Launch</strong>
                    <span className="text-purple-700">Tap <strong>Add</strong> at top right. LifeBuddy is now installed on your home screen!</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2 text-xs text-purple-950">
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-purple-950">
                    <Smartphone className="w-4 h-4 text-purple-700" />
                    <span>On Chrome / Android / Edge:</span>
                  </div>
                  <p className="text-purple-700">
                    Look for the <strong>Install</strong> icon in the address bar (or tap the 3-dots menu <strong>⋮</strong> and select <strong>"Install LifeBuddy"</strong> or <strong>"Add to Home screen"</strong>).
                  </p>
                </div>

                {isInstallable && (
                  <button
                    type="button"
                    onClick={async () => {
                      setShowGuideModal(false);
                      await install();
                    }}
                    className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Launch Native Install Prompt</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
