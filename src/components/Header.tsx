import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Monitor, 
  Timer, 
  Sparkles, 
  Heart, 
  BookOpen, 
  GraduationCap, 
  Edit2, 
  Check, 
  X, 
  Bell, 
  ShieldAlert, 
  Palmtree,
  Cake,
  History,
  LayoutDashboard,
  User
} from 'lucide-react';
import { formatHeaderDate } from '../utils/helpers';
import { RiskLevel } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  userName?: string;
  onUpdateUserName?: (name: string) => void;
  activeTab?: 'dashboard' | 'holidays' | 'history' | 'aboutme';
  onChangeTab?: (tab: 'dashboard' | 'holidays' | 'history' | 'aboutme') => void;
  onOpenAboutMe?: () => void;
  onOpenBirthday?: () => void;
  hasBirthdayToday?: boolean;
  extraBirthdaysCount?: number;
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
  activeTab = 'dashboard',
  onChangeTab,
  onOpenAboutMe,
  onOpenBirthday,
  hasBirthdayToday = false,
  extraBirthdaysCount = 0,
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
      <div className="max-w-4xl mx-auto px-3 py-2.5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo, App Title & Personalized Hello */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-300/40 flex-shrink-0 overflow-hidden">
              <img
                src="/app-logo.jpg"
                alt="LifeBuddy Logo"
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
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

                {/* About Me Profile Button next to Name */}
                {onOpenAboutMe && (
                  <button
                    type="button"
                    onClick={onOpenAboutMe}
                    title="Open About Me profile & theme customization"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <User className="w-3 h-3 text-purple-700" />
                    <span>About Me</span>
                  </button>
                )}

                {totalStreak > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                    🔥 {totalStreak}d
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-purple-700/80 mt-0.5">
                AI Student System, Timetable & Habits
              </p>
            </div>
          </div>

          {/* Mobile Right Controls: Sound & View Mode */}
          <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? "Mute audio" : "Enable audio"}
              className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-purple-100 text-purple-900 border-purple-300"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Action Controls: FLEX-WRAP GUARANTEES NO HORIZONTAL OVERFLOW */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Main View Tabs */}
          {onChangeTab && (
            <div className="flex items-center p-0.5 bg-purple-100/80 rounded-2xl border border-purple-200/90 shadow-2xs mr-1">
              <button
                type="button"
                onClick={() => onChangeTab('dashboard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeTab('holidays')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'holidays'
                    ? 'bg-amber-500 text-purple-950 shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                <Palmtree className="w-3 h-3" />
                <span>Holidays</span>
                {upcomingHolidaysCount > 0 && (
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-black ${
                    activeTab === 'holidays' ? 'bg-purple-950 text-amber-300' : 'bg-amber-400 text-purple-950'
                  }`}>
                    {upcomingHolidaysCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onChangeTab('history')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                <History className="w-3 h-3" />
                <span>History</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeTab('aboutme')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'aboutme'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                <User className="w-3 h-3" />
                <span>About Me</span>
              </button>
            </div>
          )}

          {/* Birthday Reminder Quick Launcher */}
          {onOpenBirthday && (
            <button
              type="button"
              onClick={onOpenBirthday}
              title="Open Birthday Reminder & Celebration Wishes"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
                hasBirthdayToday
                  ? 'text-white bg-gradient-to-r from-rose-600 to-pink-600 border-rose-400 ring-2 ring-rose-300 animate-pulse'
                  : 'text-rose-950 bg-rose-100 hover:bg-rose-200 border-rose-300'
              }`}
            >
              <Cake className={`w-3.5 h-3.5 ${hasBirthdayToday ? 'text-white animate-bounce' : 'text-rose-600'}`} />
              <span>Birthday</span>
              {hasBirthdayToday ? (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white text-rose-700">
                  Today!
                </span>
              ) : extraBirthdaysCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-200 text-rose-900">
                  {extraBirthdaysCount}
                </span>
              ) : null}
            </button>
          )}

          {/* AI Alert System quick launcher */}
          {onOpenAlerts && (
            <button
              type="button"
              onClick={onOpenAlerts}
              title="Jump to AI-Based Alert System"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 hover:from-purple-900 hover:to-indigo-900 border border-purple-700 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Alerts</span>
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
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs cursor-pointer"
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

          {/* Class Timetable quick launcher */}
          {onOpenSchedule && (
            <button
              type="button"
              onClick={onOpenSchedule}
              title="Jump to Weekly Class Schedule Timetable"
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
              <span className="hidden sm:inline">Timetable</span>
            </button>
          )}

          {/* Animated Body Stretch Break Trigger */}
          <button
            type="button"
            onClick={onOpenStretchRelief}
            title="Open Body Stretch & Relief Guide"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span className="text-sm">🧘</span>
            <span className="hidden sm:inline">Relief</span>
          </button>

          {/* Focus Timer quick launcher */}
          <button
            type="button"
            onClick={onOpenTimer}
            title="Open Focus Timer"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden lg:inline">Timer</span>
          </button>

          {/* PWA In-App Install App Button */}
          <PWAInstallButton variant="header" />

          {/* Desktop Controls: Sound & Android Mode */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
              className={`p-1.5 rounded-xl border text-xs transition-colors shadow-2xs cursor-pointer ${
                soundEnabled
                  ? "bg-purple-100/90 text-purple-900 border-purple-300 hover:bg-purple-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onToggleAndroidView}
              title={isAndroidView ? "Switch to Desktop View" : "Preview Android WebView Frame"}
              className={`p-1.5 rounded-xl border text-xs transition-colors shadow-2xs cursor-pointer ${
                isAndroidView
                  ? "bg-purple-200 text-purple-950 border-purple-400 hover:bg-purple-300"
                  : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
              }`}
            >
              {isAndroidView ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};



