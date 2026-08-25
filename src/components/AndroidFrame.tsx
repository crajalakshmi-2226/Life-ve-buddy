import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isAndroidView: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isAndroidView }) => {
  if (!isAndroidView) {
    return <>{children}</>;
  }

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="min-h-screen bg-purple-950 py-6 px-2 sm:px-4 flex items-center justify-center">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[420px] bg-[#faf5ff] rounded-[44px] shadow-2xl border-[10px] border-purple-900 overflow-hidden flex flex-col relative max-h-[92vh]">
        {/* Android Status Bar */}
        <div className="bg-purple-950 text-white px-6 py-2 flex items-center justify-between text-[11px] font-medium z-40 select-none">
          <span>{currentTime}</span>
          <div className="w-20 h-4 bg-purple-900 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5 text-purple-200">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Inner Scrollable WebView Content */}
        <div className="flex-1 overflow-y-auto bg-[#faf5ff] relative">
          {children}
        </div>

        {/* Android Home Navigation Bar Pill */}
        <div className="bg-white py-2 flex items-center justify-center z-40 border-t border-purple-100">
          <div className="w-32 h-1 bg-purple-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
