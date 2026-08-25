import React, { useState } from 'react';
import { Volume2, VolumeX, Smartphone, Monitor, Timer, Sparkles, Heart, BookOpen, GraduationCap, Edit2, Check, X, Bell, ShieldAlert, Palmtree } from 'lucide-react';
import { formatHeaderDate } from '../utils/helpers';
import { RiskLevel } from '../types';

interface HeaderProps {
  userName?: string;
  onUpdateUserName?: (name: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isAndroidView: boolean;
  onToggleAndroidView: () => void;
  onOpenTimer: () => void;
  onOpenStretchRelief: () => void;
  onOpenSchedule?: () => void;
  onOpenExams?: () => void;
  onOpenAlerts?: () => void;
  onOpenHolidays?: () => void;
  upcomingExamsCount?: number;
  upcomingHolidaysCount?: number;
  unreadAlertsCount?: number;
  criticalAlertsCount?: number;
  riskLevel?: RiskLevel;
  totalStreak: number;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Alex',
  onUpdateUserName,
  soundEnabled,
  onToggleSound,
  isAndroidView,
  onToggleAndroidView,
  onOpenTimer,
  onOpenStretchRelief,
  onOpenSchedule,
  onOpenExams,
  onOpenAlerts,
  onOpenHolidays,
  upcomingExamsCount = 0,
  upcomingHolidaysCount = 0,
  unreadAlertsCount = 0,
  criticalAlertsCount = 0,
  riskLevel,
  totalStreak
}) => {
  const currentDate = formatHeaderDate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tempName.trim() && onUpdateUserName) {
      onUpdateUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/95 border-b border-purple-200/80 shadow-xs transition-all">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Logo, App Title & Top Hello Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-300/40 flex-shrink-0">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-classic tracking-tight text-purple-950 leading-none">
                LifeBuddy
              </h1>

              {/* Personalized Hello with Name & Smile Face */}
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempName(userName);
                    setIsEditingName(true);
                  }}
                  title="Click to edit your name"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-950 border border-purple-300/80 shadow-2xs transition-all active:scale-95 cursor-pointer group"
                >
                  <span className="text-sm">😊</span>
                  <span>Hello, <span className="underline decoration-purple-400 underline-offset-2">{userName}</span></span>
                  <Edit2 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-purple-700 ml-0.5" />
                </button>
              ) : (
                <form onSubmit={handleSaveName} className="inline-flex items-center gap-1">
                  <span className="text-sm">😊</span>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter name"
                    autoFocus
                    className="w-24 px-2 py-0.5 text-xs font-bold text-purple-950 bg-purple-50 border border-purple-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              )}

              {totalStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                  🔥 {totalStreak}d
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-purple-700/80 mt-0.5">
              AI Student Alert System, Focus, Timetable & Habits
            </p>
          </div>
        </div>

        {/* Action Controls & Date Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* AI Alert System quick launcher */}
          {onOpenAlerts && (
            <button
              type="button"
              onClick={onOpenAlerts}
              title="Jump to AI-Based Alert System"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 hover:from-purple-900 hover:to-indigo-900 border border-purple-700 transition-all shadow-xs hover:shadow-md cursor-pointer animate-fadeIn"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Exam Schedule quick launcher */}
          {onOpenExams && (
            <button
              type="button"
              onClick={onOpenExams}
              title="Jump to Exam Schedules & Countdowns"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
              <span className="hidden sm:inline">Exams</span>
              {upcomingExamsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-700 text-white">
                  {upcomingExamsCount}
                </span>
              )}
            </button>
          )}

          {/* Holiday Reminders quick launcher */}
          {onOpenHolidays && (
            <button
              type="button"
              onClick={onOpenHolidays}
              title="Jump to Holidays & Vacations Reminder Tracker"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200 transition-colors shadow-xs cursor-pointer"
            >
              <Palmtree className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Holidays</span>
              {upcomingHolidaysCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-purple-950">
                  {upcomingHolidaysCount}
                </span>
              )}
            </button>
          )}

          {/* Class Timetable quick launcher */}
          {onOpenSchedule && (
            <button
              type="button"
              onClick={onOpenSchedule}
              title="Jump to Class Periods & Schedule"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
              <span className="hidden sm:inline">Classes</span>
            </button>
          )}

          {/* Animated Body Stretch Break Trigger */}
          <button
            type="button"
            onClick={onOpenStretchRelief}
            title="Open Body Stretch & Relief Guide"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span className="text-sm">🧘</span>
            <span className="hidden sm:inline">Relief</span>
          </button>

          {/* Focus Timer quick launcher */}
          <button
            type="button"
            onClick={onOpenTimer}
            title="Open Focus Timer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs"
          >
            <Timer className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden md:inline">Timer</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
            className={`p-2 rounded-xl border text-xs transition-colors shadow-xs cursor-pointer ${
              soundEnabled
                ? "bg-purple-100/90 text-purple-900 border-purple-300 hover:bg-purple-200"
                : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Android Frame Mode Toggle */}
          <button
            type="button"
            onClick={onToggleAndroidView}
            title={isAndroidView ? "Switch to Desktop View" : "Preview Android WebView Frame"}
            className={`p-2 rounded-xl border text-xs transition-colors shadow-xs cursor-pointer ${
              isAndroidView
                ? "bg-purple-200 text-purple-950 border-purple-400 hover:bg-purple-300"
                : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
            }`}
          >
            {isAndroidView ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};



