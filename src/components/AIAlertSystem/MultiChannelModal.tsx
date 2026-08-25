import React, { useState } from 'react';
import { X, Mail, MessageSquare, Bell, Smartphone, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import { AlertNotificationItem, NotificationChannel } from '../../types';

interface MultiChannelModalProps {
  alert: AlertNotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
}

export const MultiChannelModal: React.FC<MultiChannelModalProps> = ({
  alert,
  isOpen,
  onClose,
  studentName
}) => {
  const [activeChannel, setActiveChannel] = useState<NotificationChannel>('Email');

  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-5 flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800/80 border border-purple-600 flex items-center justify-center text-purple-200">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-classic">
                Multi-Channel Dispatch Simulator
              </h3>
              <p className="text-xs text-purple-300">
                View real-time transmission formats across student communication channels
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selector Tabs */}
        <div className="flex border-b border-purple-100 bg-purple-50/70 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveChannel('Email')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeChannel === 'Email'
                ? 'bg-white text-purple-950 border-purple-700 shadow-2xs'
                : 'text-purple-700 hover:text-purple-950 border-transparent hover:bg-purple-100/60'
            }`}
          >
            <Mail className="w-4 h-4 text-purple-600" />
            <span>Email Alert</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('SMS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeChannel === 'SMS'
                ? 'bg-white text-purple-950 border-purple-700 shadow-2xs'
                : 'text-purple-700 hover:text-purple-950 border-transparent hover:bg-purple-100/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>SMS Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('Push')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeChannel === 'Push'
                ? 'bg-white text-purple-950 border-purple-700 shadow-2xs'
                : 'text-purple-700 hover:text-purple-950 border-transparent hover:bg-purple-100/60'
            }`}
          >
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Push Notification</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('In-App')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeChannel === 'In-App'
                ? 'bg-white text-purple-950 border-purple-700 shadow-2xs'
                : 'text-purple-700 hover:text-purple-950 border-transparent hover:bg-purple-100/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span>In-App Banner</span>
          </button>
        </div>

        {/* Channel Preview Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white space-y-4">
          {/* EMAIL CHANNEL */}
          {activeChannel === 'Email' && (
            <div className="border border-slate-200 rounded-2xl shadow-xs overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 p-4 border-b border-slate-200 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-16">From:</span>
                  <span className="font-medium text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {alert.emailSnippet?.from || 'AI Academic Alert System <alerts@university.edu>'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-16">To:</span>
                  <span className="font-medium text-slate-900">
                    {studentName.toLowerCase().replace(/\s+/g, '.')}@student.university.edu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-16">Subject:</span>
                  <span className="font-bold text-slate-950">
                    {alert.emailSnippet?.subject || `[${alert.priority.toUpperCase()} ALERT] ${alert.title}`}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white space-y-4 text-sm text-slate-800 leading-relaxed">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-purple-950">University Academic Advisory Portal</span>
                  <span className="text-xs text-slate-400">{alert.dateStr}</span>
                </div>

                <p className="font-semibold text-slate-900">
                  Dear {studentName},
                </p>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                    <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-950 font-bold">
                      Priority: {alert.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                      Risk Level: {alert.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-950 font-medium">
                    {alert.message}
                  </p>
                </div>

                {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recommended Preventive Actions:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {alert.recommendedActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Student Advisory Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  This automated message was dispatched by the University AI Risk & Early Warning Engine.
                </p>
              </div>
            </div>
          )}

          {/* SMS CHANNEL */}
          {activeChannel === 'SMS' && (
            <div className="max-w-md mx-auto bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-4">
              <div className="text-center pb-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-300">
                  {alert.smsSnippet?.senderId || 'UNIV-ALERT'}
                </div>
                <div className="text-[10px] text-slate-500">Official Campus SMS Gateway</div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="self-center bg-slate-800/80 px-3 py-1 rounded-full text-[10px] text-slate-400">
                  Today, {alert.dateStr.split(',')[1] || 'Just now'}
                </div>

                <div className="bg-purple-900/90 text-purple-50 p-4 rounded-2xl rounded-tl-xs text-xs sm:text-sm leading-relaxed border border-purple-700 shadow-md space-y-2">
                  <p className="font-medium">
                    {alert.smsSnippet?.messageText || `[${alert.priority.toUpperCase()} ALERT] ${studentName}: ${alert.title}. ${alert.message} Visit portal.univ.edu/alerts`}
                  </p>
                  <div className="text-[10px] text-purple-300 font-mono">
                    Sender: CampusAI-Gateway • MsgRef: #AK9921
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500">
                Reply STOP to unsubscribe from non-critical alerts. Academic emergency alerts cannot be disabled.
              </div>
            </div>
          )}

          {/* PUSH NOTIFICATION CHANNEL */}
          {activeChannel === 'Push' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="text-xs font-bold text-slate-500">Mobile & Web Push Notification Preview:</div>

              {/* iOS / Android Style Notification Banner */}
              <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-xl border border-slate-700 backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      ✨
                    </div>
                    <span className="text-xs font-bold text-purple-200">LIFEBUDDY ALERT SYSTEM</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Now</span>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">
                    {alert.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-purple-700 text-white text-[11px] font-bold hover:bg-purple-600 cursor-pointer"
                  >
                    View Action
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium hover:bg-slate-700 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* IN-APP CHANNEL */}
          {activeChannel === 'In-App' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-white border border-purple-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                      {alert.priority} Priority
                    </span>
                    <span className="text-xs text-purple-300">{alert.category}</span>
                  </div>
                  <span className="text-xs text-purple-300">{alert.dateStr}</span>
                </div>

                <h4 className="text-base font-bold font-classic text-purple-100">
                  {alert.title}
                </h4>

                <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                  {alert.message}
                </p>

                {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Required Next Steps:
                    </div>
                    {alert.recommendedActions.map((action, i) => (
                      <div key={i} className="text-xs text-purple-100 flex items-center gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-purple-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Channels Active: {alert.dispatchedChannels.join(', ')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
