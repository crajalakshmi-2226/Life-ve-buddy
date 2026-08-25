import React, { useState } from 'react';
import { RefreshCw, Sparkles, Target, Trophy, AlertTriangle, FlaskConical, Calendar, Check, Heart, BookOpen, Clock, Plus, GraduationCap, Edit2, X, Palmtree } from 'lucide-react';
import { DailyQuote, TodayData, MoodType, LabData, ProjectData, ClassPeriod, ExamItem, HolidayItem } from '../types';
import { getNextLabInfo, getProjectDeadlineInfo, getCurrentClassStatus, formatTime12, getExamCountdown, formatExamDate, getHolidayCountdown } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/audio';

interface TodaySectionProps {
  quote: DailyQuote;
  loadingQuote: boolean;
  onRefreshQuote: () => void;
  todayData: TodayData;
  onUpdateTodayData: (data: Partial<TodayData>) => void;
  labData: LabData;
  projectData: ProjectData;
  classPeriods?: ClassPeriod[];
  exams?: ExamItem[];
  holidays?: HolidayItem[];
  soundEnabled: boolean;
  onOpenStretchRelief?: () => void;
  onOpenClassSchedule?: () => void;
  onOpenExamSchedule?: () => void;
  onOpenAlerts?: () => void;
  onOpenHolidays?: () => void;
  criticalAlertsCount?: number;
}

const MOODS: { type: MoodType; label: string; emoji: string; bg: string; border: string; text: string }[] = [
  { type: 'Calm', label: 'Calm', emoji: '🌊', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  { type: 'Happy', label: 'Happy', emoji: '🌟', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900' },
  { type: 'Focused', label: 'Focused', emoji: '🎯', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
  { type: 'Energized', label: 'Energized', emoji: '⚡', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900' },
  { type: 'Stress', label: 'Stress', emoji: '🧘', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900' },
  { type: 'Tired', label: 'Tired', emoji: '🔋', bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
];

const DEFAULT_FOCUS_PRESETS = ["Persistence", "Deep Work", "Clarity", "Grit", "Consistency", "Calm Focus"];

export const TodaySection: React.FC<TodaySectionProps> = ({
  quote,
  loadingQuote,
  onRefreshQuote,
  todayData,
  onUpdateTodayData,
  labData,
  projectData,
  classPeriods = [],
  exams = [],
  holidays = [],
  soundEnabled,
  onOpenStretchRelief,
  onOpenClassSchedule,
  onOpenExamSchedule,
  onOpenAlerts,
  onOpenHolidays,
  criticalAlertsCount = 0
}) => {
  const [winCelebrated, setWinCelebrated] = useState(false);
  const [customWordInput, setCustomWordInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(todayData.userName || 'Alex');
  const [customPresets, setCustomPresets] = useState<string[]>(() => {
    const saved = localStorage.getItem('customFocusPresets');
    return saved ? JSON.parse(saved) : DEFAULT_FOCUS_PRESETS;
  });

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tempName.trim()) {
      onUpdateTodayData({ userName: tempName.trim() });
      if (soundEnabled) playSuccessChime();
    }
    setIsEditingName(false);
  };

  const nextLab = getNextLabInfo(labData);
  const deadlineInfo = getProjectDeadlineInfo(projectData);
  const classStatus = getCurrentClassStatus(classPeriods);

  // Find most urgent upcoming exam
  const activeUpcomingExams = exams
    .map(e => ({ exam: e, countdown: getExamCountdown(e) }))
    .filter(item => !item.countdown.isPast || item.countdown.isToday)
    .sort((a, b) => a.countdown.diffDays - b.countdown.diffDays);
  
  const nearestExam = activeUpcomingExams.length > 0 ? activeUpcomingExams[0] : null;

  // Find most urgent upcoming holiday
  const activeUpcomingHolidays = holidays
    .map(h => ({ holiday: h, countdown: getHolidayCountdown(h) }))
    .filter(item => !item.countdown.isPast || item.countdown.isToday || item.countdown.isOngoing)
    .sort((a, b) => {
      if (a.countdown.isOngoing && !b.countdown.isOngoing) return -1;
      if (!a.countdown.isOngoing && b.countdown.isOngoing) return 1;
      return a.countdown.diffDays - b.countdown.diffDays;
    });

  const nearestHoliday = activeUpcomingHolidays.length > 0 ? activeUpcomingHolidays[0] : null;

  const handleSmallWinBlur = () => {
    if (todayData.smallWin && !winCelebrated) {
      setWinCelebrated(true);
      if (soundEnabled) playSuccessChime();
      try {
        confetti({
          particleCount: 35,
          spread: 65,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.debug('Confetti error', e);
      }
    }
  };

  const handleAddCustomFocusWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWordInput.trim()) return;
    const word = customWordInput.trim();
    if (!customPresets.includes(word)) {
      const updated = [...customPresets, word];
      setCustomPresets(updated);
      localStorage.setItem('customFocusPresets', JSON.stringify(updated));
    }
    onUpdateTodayData({ focusWord: word });
    setCustomWordInput('');
    if (soundEnabled) playSuccessChime();
  };

  const currentUserName = todayData.userName || 'Alex';

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      {/* Top Greeting Banner: Hello [Name] with Smile Face */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-100 via-fuchsia-50 to-indigo-100 p-4 sm:p-5 border border-purple-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Cheerful Smile Face Badge */}
            <div className="w-12 h-12 rounded-2xl bg-white/90 text-purple-700 flex items-center justify-center text-3xl shadow-xs border border-purple-200 flex-shrink-0 animate-bounce duration-1000">
              😊
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-bold font-classic text-purple-950 flex items-center gap-2 flex-wrap">
                  <span>Hello,</span>
                  {!isEditingName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-white/80 border border-purple-300 text-purple-900 shadow-2xs">
                      <span>{currentUserName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempName(currentUserName);
                          setIsEditingName(true);
                        }}
                        title="Click to change your name"
                        className="text-purple-600 hover:text-purple-900 transition-colors p-0.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <form onSubmit={handleSaveName} className="inline-flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Enter your name"
                        autoFocus
                        className="w-32 px-2.5 py-1 text-sm font-bold text-purple-950 bg-white border border-purple-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-inner"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="px-2 py-1 bg-purple-200 hover:bg-purple-300 text-purple-900 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                  <span className="text-2xl">😊</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-medium text-purple-800/90 mt-0.5">
                Ready for today&apos;s focus sessions, classes, and study goals? Let&apos;s make today awesome!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-purple-900 border border-purple-200 shadow-2xs">
              ✨ Today: {todayData.focusWord}
            </span>
          </div>
        </div>
      </div>

      {/* Section Title & Navigation Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="text-base sm:text-lg font-bold font-classic text-purple-950">
            Daily Focus & Mindset
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {onOpenExamSchedule && (
            <button
              type="button"
              onClick={onOpenExamSchedule}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 transition-all cursor-pointer shadow-2xs"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Exams</span>
            </button>
          )}

          {onOpenClassSchedule && (
            <button
              type="button"
              onClick={onOpenClassSchedule}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 transition-all cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Classes</span>
            </button>
          )}

          {onOpenStretchRelief && (
            <button
              type="button"
              onClick={onOpenStretchRelief}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 transition-all cursor-pointer shadow-2xs"
            >
              <span className="animate-bounce">🧘</span>
              <span>Body Stretch</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Daily Motivational Quote Header in Classic Serif */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-6 sm:p-7 text-white shadow-md border border-purple-800/60">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-purple-500/25 text-purple-200 border border-purple-400/30">
            <Sparkles className="w-3 h-3 text-purple-300" />
            DAILY INSPIRATION
          </span>
          <button
            type="button"
            onClick={onRefreshQuote}
            disabled={loadingQuote}
            title="Fetch New Motivational Quote"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingQuote ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="my-3 relative z-10">
          <p className="text-lg sm:text-xl font-medium leading-relaxed italic text-purple-50 font-quote">
            "{quote.quote}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-purple-800/70 text-xs text-purple-300 relative z-10">
          <span className="font-semibold font-classic text-purple-200 tracking-wide">— {quote.author || 'LifeBuddy'}</span>
          <span className="text-[11px] opacity-75">Daily Refresh & Audio Guidance</span>
        </div>
      </div>

      {/* Real-time Class, Lab, Exam, AI Risk Alert & Holiday Countdown Banner */}
      {(criticalAlertsCount > 0 || nearestHoliday || (nearestExam && (nearestExam.countdown.diffDays <= 7 || nearestExam.countdown.isToday)) || classStatus.statusType === 'in-session' || classStatus.statusType === 'upcoming-soon' || nextLab.isSoon || deadlineInfo.urgency === 'urgent' || deadlineInfo.urgency === 'today' || deadlineInfo.urgency === 'tomorrow') && (
        <div className="space-y-2.5">
          {/* Upcoming Holiday Countdown Reminder Banner */}
          {nearestHoliday && (
            <div
              onClick={onOpenHolidays}
              className={`rounded-2xl p-4 border flex items-start justify-between gap-3 shadow-2xs cursor-pointer transition-all group ${
                nearestHoliday.countdown.isOngoing
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100/90 ring-1 ring-emerald-200'
                  : nearestHoliday.countdown.isToday
                  ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/90 ring-1 ring-amber-200'
                  : nearestHoliday.countdown.diffDays <= 7
                  ? 'bg-gradient-to-r from-amber-50/90 to-purple-50 border-amber-300 text-purple-950 hover:border-amber-400'
                  : 'bg-purple-50/80 border-purple-200 text-purple-950 hover:bg-purple-100/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  nearestHoliday.countdown.isOngoing
                    ? 'bg-emerald-200 text-emerald-900'
                    : nearestHoliday.countdown.diffDays <= 7
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-purple-200 text-purple-900'
                }`}>
                  <Palmtree className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm">
                  <div className="font-bold font-classic flex items-center gap-2 flex-wrap">
                    <span>🌴 Holiday Reminder: {nearestHoliday.holiday.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      nearestHoliday.countdown.isOngoing
                        ? 'bg-emerald-700 text-white'
                        : nearestHoliday.countdown.diffDays <= 3
                        ? 'bg-amber-500 text-purple-950 font-black animate-pulse'
                        : 'bg-purple-700 text-white'
                    }`}>
                      {nearestHoliday.countdown.countdownBadge}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">
                    📅 {nearestHoliday.countdown.relativeDateRange} ({nearestHoliday.holiday.totalDays} {nearestHoliday.holiday.totalDays === 1 ? 'day break' : 'days vacation'})
                    {nearestHoliday.holiday.studyCatchUpGoal ? ` • Goal: ${nearestHoliday.holiday.studyCatchUpGoal}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform self-center hidden sm:inline whitespace-nowrap">
                View Holidays ➔
              </span>
            </div>
          )}

          {/* AI Early Warning Banner */}
          {criticalAlertsCount > 0 && onOpenAlerts && (
            <div
              onClick={onOpenAlerts}
              className="rounded-2xl p-4 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-300 flex items-start justify-between gap-3 text-purple-950 shadow-2xs cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-200 text-amber-900 rounded-xl flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-900" />
                </div>
                <div className="text-xs sm:text-sm">
                  <div className="font-bold font-classic flex items-center gap-2 flex-wrap">
                    <span>⚠️ AI Academic Warning & Risk Alerts</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                      {criticalAlertsCount} Action{criticalAlertsCount !== 1 ? 's' : ''} Needed
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs mt-0.5 font-medium">
                    Attendance debarment risk detected in DSP & OS. Complete pending lab reports to avoid exam debarment.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-900 group-hover:translate-x-1 transition-transform self-center hidden sm:inline whitespace-nowrap">
                Open AI Defense ➔
              </span>
            </div>
          )}

          {/* Upcoming Exam Countdown Alert */}
          {nearestExam && (nearestExam.countdown.diffDays <= 7 || nearestExam.countdown.isToday) && (
            <div
              onClick={onOpenExamSchedule}
              className={`rounded-2xl p-4 border flex items-start justify-between gap-3 shadow-2xs cursor-pointer transition-all group ${
                nearestExam.countdown.isToday
                  ? 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100/80'
                  : nearestExam.countdown.isTomorrow
                  ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/80'
                  : 'bg-purple-100/90 border-purple-300 text-purple-950 hover:bg-purple-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  nearestExam.countdown.isToday ? 'bg-rose-200 text-rose-800' : 'bg-purple-200 text-purple-800'
                }`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm">
                  <div className="font-bold font-classic flex items-center gap-2 flex-wrap">
                    <span>Exam Alert: {nearestExam.exam.subject}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      nearestExam.countdown.isToday 
                        ? 'bg-rose-600 text-white animate-pulse' 
                        : 'bg-purple-700 text-white'
                    }`}>
                      {nearestExam.countdown.countdownBadge}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">
                    📅 {formatExamDate(nearestExam.exam.examDate)} at {formatTime12(nearestExam.exam.startTime)} 
                    {nearestExam.exam.room ? ` • ${nearestExam.exam.room}` : ''}
                    {nearestExam.exam.syllabus ? ` — Topics: ${nearestExam.exam.syllabus}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform self-center hidden sm:inline">
                View Exam ➔
              </span>
            </div>
          )}

          {/* Active / Upcoming Class Period Alert */}
          {(classStatus.statusType === 'in-session' || classStatus.statusType === 'upcoming-soon') && (
            <div 
              onClick={onOpenClassSchedule}
              className="rounded-2xl p-4 bg-purple-100/90 border border-purple-300/90 flex items-start justify-between gap-3 text-purple-950 shadow-2xs cursor-pointer hover:bg-purple-100 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-200 rounded-xl text-purple-800 flex-shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm">
                  <div className="font-bold font-classic flex items-center gap-2">
                    <span>{classStatus.statusType === 'in-session' ? '🟢 Active Class Period' : '⏰ Upcoming Class Period'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-700 text-white">
                      {classStatus.statusType === 'in-session' ? `${classStatus.minutesRemaining}m left` : `in ${classStatus.minutesUntilNext}m`}
                    </span>
                  </div>
                  <p className="text-purple-800 text-xs mt-0.5">
                    {classStatus.badgeText}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform self-center hidden sm:inline">
                View Schedule ➔
              </span>
            </div>
          )}

          {nextLab.isSoon && labData.hasLab === 'yes' && (
            <div className="rounded-2xl p-4 bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 text-amber-900 shadow-2xs">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-800 flex-shrink-0 mt-0.5">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="font-bold font-classic flex items-center gap-2">
                  <span>Lab Alert: {nextLab.displayText}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {nextLab.isToday ? 'Today' : 'Tomorrow'}
                  </span>
                </div>
                <p className="text-amber-800/90 text-xs mt-0.5">
                  🥼 Don't forget your <strong>Lab Coat</strong> and lab manuals/safety gear!
                </p>
              </div>
            </div>
          )}

          {(deadlineInfo.urgency === 'today' || deadlineInfo.urgency === 'tomorrow' || deadlineInfo.urgency === 'urgent') && (
            <div className="rounded-2xl p-4 bg-rose-50/90 border border-rose-200/90 flex items-start gap-3 text-rose-900 shadow-2xs">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-800 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="font-bold font-classic">
                  Project Deadline: {projectData.projectName || 'Semester Project'} ({deadlineInfo.statusText})
                </div>
                <p className="text-rose-800/90 text-xs mt-0.5">
                  Check your remaining milestones below to stay on schedule.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animated Mini Body Relief Stretch Card */}
      {onOpenStretchRelief && (
        <div 
          onClick={onOpenStretchRelief}
          className="group rounded-2xl p-4 bg-gradient-to-r from-purple-50 via-fuchsia-50/50 to-indigo-50 border border-purple-200/90 flex items-center justify-between gap-4 cursor-pointer hover:border-purple-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-200/80 text-purple-900 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform border border-purple-300">
              🧘
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold font-classic text-purple-950 flex items-center gap-2">
                <span>Quick Body Stretch & Spine Relief</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold">
                  60s Break
                </span>
              </div>
              <p className="text-xs text-purple-700/90 mt-0.5">
                Stretching posture guide for desk neck relief, wrist recovery, and tension release.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-purple-800 group-hover:translate-x-1 transition-transform">
            <span>Start Stretch</span>
            <span>➔</span>
          </div>
        </div>
      )}

      {/* Today's Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Focus Word Input & Custom Word Adder */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              <span>🎯 Daily Focus Word</span>
            </label>
            <span className="text-[11px] text-purple-600">Customizable</span>
          </div>
          <input
            type="text"
            id="focusWordInput"
            value={todayData.focusWord}
            onChange={(e) => onUpdateTodayData({ focusWord: e.target.value })}
            placeholder="e.g. Persistence, Flow, Clarity..."
            maxLength={30}
            className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm font-medium text-purple-950 transition-all placeholder:text-purple-300"
          />

          {/* Preset chips & Custom Adder */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {customPresets.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => onUpdateTodayData({ focusWord: word })}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  todayData.focusWord === word
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
                }`}
              >
                {word}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddCustomFocusWord} className="flex gap-1 pt-1">
            <input
              type="text"
              value={customWordInput}
              onChange={(e) => setCustomWordInput(e.target.value)}
              placeholder="+ Add your own focus word..."
              className="flex-1 px-2.5 py-1 text-xs rounded-xl border border-purple-200 bg-white placeholder:text-purple-300 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
            <span>😊 Today's Energy & Mood</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => {
              const isSelected = todayData.mood === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => onUpdateTodayData({ mood: m.type })}
                  className={`px-2 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${m.bg} ${m.border} ${m.text} ring-2 ring-purple-500/40 shadow-xs scale-[1.02]`
                      : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50/50'
                  }`}
                >
                  <span className="text-base leading-none">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Small Win Input (Full Width) */}
        <div className="md:col-span-2 space-y-2 pt-1">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>🏆 Today's Small Win</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="smallWinInput"
              value={todayData.smallWin}
              onChange={(e) => onUpdateTodayData({ smallWin: e.target.value })}
              onBlur={handleSmallWinBlur}
              placeholder="e.g. Finished chapter 3 reading, completed lab safety checklist, solved 5 problem sets..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm text-purple-950 transition-all placeholder:text-purple-300"
            />
            {todayData.smallWin && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-fadeIn">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

