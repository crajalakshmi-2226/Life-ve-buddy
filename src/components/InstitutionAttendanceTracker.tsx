import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Settings2, 
  TrendingUp, 
  Calendar, 
  ShieldAlert, 
  X,
  Palmtree,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  Sliders,
  CalendarDays
} from 'lucide-react';
import { InstitutionAttendanceConfig, AttendanceDailyCheckIn, WorkingDaysPattern } from '../types';
import { getTodayDateString } from '../utils/helpers';
import confetti from 'canvas-confetti';

interface InstitutionAttendanceTrackerProps {
  config: InstitutionAttendanceConfig;
  onUpdateConfig: (newConfig: InstitutionAttendanceConfig) => void;
  soundEnabled: boolean;
  onToast: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'critical') => void;
  onLogHistoryRecord?: (title: string, category: 'Attendance & Leaves', status: string, details?: string) => void;
}

export const InstitutionAttendanceTracker: React.FC<InstitutionAttendanceTrackerProps> = ({
  config,
  onUpdateConfig,
  soundEnabled,
  onToast,
  onLogHistoryRecord
}) => {
  const todayStr = getTodayDateString();
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // User-selected schedule configuration state
  const [schedulePattern, setSchedulePattern] = useState<WorkingDaysPattern>(
    config.workingDaysPattern || (config.daysPerWeek === 6 ? '6_day' : '5_day')
  );
  const [daysPerWeekInput, setDaysPerWeekInput] = useState<number>(config.daysPerWeek || 5);
  const [weeksInTermInput, setWeeksInTermInput] = useState<number>(config.weeksInSemester || 18);
  const [totalWorkingDaysInput, setTotalWorkingDaysInput] = useState<number>(config.totalWorkingDays || 90);
  const [conductedDaysInput, setConductedDaysInput] = useState<number>(config.conductedDays || 42);
  const [attendedDaysInput, setAttendedDaysInput] = useState<number>(config.attendedDays || 36);
  const [institutionNameInput, setInstitutionNameInput] = useState<string>(config.institutionName || 'University College');
  const [targetThresholdInput, setTargetThresholdInput] = useState<number>(config.targetThreshold || 75);

  // Keep local inputs in sync when prop changes externally
  useEffect(() => {
    setSchedulePattern(config.workingDaysPattern || (config.daysPerWeek === 6 ? '6_day' : '5_day'));
    setDaysPerWeekInput(config.daysPerWeek || 5);
    setWeeksInTermInput(config.weeksInSemester || 18);
    setTotalWorkingDaysInput(config.totalWorkingDays || 90);
    setConductedDaysInput(config.conductedDays || 42);
    setAttendedDaysInput(config.attendedDays || 36);
    setInstitutionNameInput(config.institutionName || 'University College');
    setTargetThresholdInput(config.targetThreshold || 75);
  }, [config]);

  // Derived current metrics strictly using user-selected values
  const userTotalWorkingDays = Math.max(1, config.totalWorkingDays || 90);
  const conducted = Math.min(userTotalWorkingDays, Math.max(1, config.conductedDays || 1));
  const attended = Math.min(conducted, Math.max(0, config.attendedDays || 0));
  const targetThreshold = config.targetThreshold || 75;
  const currentPercentage = Number(((attended / conducted) * 100).toFixed(1));

  // Remaining working days in term based on user-selected total working days
  const remainingWorkingDays = Math.max(0, userTotalWorkingDays - conducted);

  // Maximum achievable attendance if student attends ALL remaining user-selected working days
  const maxAchievablePercentage = Math.min(
    100,
    Number((((attended + remainingWorkingDays) / userTotalWorkingDays) * 100).toFixed(1))
  );

  // Determine if check-in for today is already recorded
  const todayCheckIn = config.checkInLogs?.find(l => l.date === todayStr);

  // Calculations for safe bunks or required recovery days
  const targetFraction = targetThreshold / 100;
  let attendanceStatusText = '';
  let recoveryDaysNeeded = 0;
  let immediateSafeBunkDays = 0;
  
  // Total leaves allowed in entire term to stay >= targetThreshold
  const totalAllowableLeavesInTerm = Math.floor(userTotalWorkingDays * (1 - targetFraction));
  const leavesTakenSoFar = Math.max(0, conducted - attended);
  const termSafeBunksRemaining = Math.max(0, totalAllowableLeavesInTerm - leavesTakenSoFar);

  if (currentPercentage < targetThreshold) {
    // Days needed to recover: (attended + x) / (conducted + x) >= targetFraction
    recoveryDaysNeeded = Math.ceil((targetFraction * conducted - attended) / (1 - targetFraction));
    attendanceStatusText = `Shortage alert! Attend next ${Math.max(1, recoveryDaysNeeded)} consecutive days to reach ${targetThreshold}%.`;
  } else {
    // Can skip based on current conducted classes:
    immediateSafeBunkDays = Math.floor((attended - targetFraction * conducted) / targetFraction);
    attendanceStatusText = immediateSafeBunkDays > 0 
      ? `You can safely take leave for ${immediateSafeBunkDays} ${immediateSafeBunkDays === 1 ? 'day' : 'days'} now and stay above ${targetThreshold}%. (Total ${termSafeBunksRemaining} leaves left across term)`
      : `Right on track! Maintain regular attendance above your ${targetThreshold}% requirement.`;
  }

  // Quick switch between schedule patterns directly from card
  const handleQuickSwitchPattern = (newPattern: WorkingDaysPattern) => {
    let newDaysPerWeek = config.daysPerWeek || 5;
    if (newPattern === '5_day') newDaysPerWeek = 5;
    else if (newPattern === '6_day') newDaysPerWeek = 6;

    const weeks = config.weeksInSemester || 18;
    const newTotal = newPattern === 'custom_total' ? config.totalWorkingDays : weeks * newDaysPerWeek;

    const updatedConfig: InstitutionAttendanceConfig = {
      ...config,
      workingDaysPattern: newPattern,
      daysPerWeek: newDaysPerWeek,
      totalWorkingDays: newTotal,
      conductedDays: Math.min(newTotal, config.conductedDays),
      attendedDays: Math.min(Math.min(newTotal, config.conductedDays), config.attendedDays),
      attendancePercentage: Math.min(newTotal, config.conductedDays) > 0 
        ? Number(((config.attendedDays / Math.min(newTotal, config.conductedDays)) * 100).toFixed(1)) 
        : 100
    };

    onUpdateConfig(updatedConfig);
    onToast(
      'Schedule Updated',
      `Switched to ${newPattern === '5_day' ? '5-Day Week (Mon-Fri)' : newPattern === '6_day' ? '6-Day Week (Mon-Sat)' : 'Custom'}: ${newTotal} total working days.`,
      'info'
    );
  };

  // Handle Daily Prompt Response
  const handleDailyCheckIn = (attendedToday: boolean, isHoliday = false) => {
    let newConducted = config.conductedDays;
    let newAttended = config.attendedDays;
    let newLeaves = config.leaveDays || 0;

    if (todayCheckIn) {
      if (todayCheckIn.attended && !attendedToday) {
        newAttended = Math.max(0, newAttended - 1);
        if (!isHoliday) newLeaves += 1;
      } else if (!todayCheckIn.attended && attendedToday) {
        newAttended += 1;
        newLeaves = Math.max(0, newLeaves - 1);
      }
    } else {
      if (!isHoliday) {
        newConducted = Math.min(userTotalWorkingDays, newConducted + 1);
        if (attendedToday) {
          newAttended += 1;
        } else {
          newLeaves += 1;
        }
      }
    }

    const newPercentage = newConducted > 0 
      ? Number(((newAttended / newConducted) * 100).toFixed(1)) 
      : 100;

    const newEntry: AttendanceDailyCheckIn = {
      date: todayStr,
      attended: attendedToday,
      isHoliday,
      calculatedPercentage: newPercentage,
      note: isHoliday ? 'College/Office Holiday' : (attendedToday ? 'Present' : 'Leave / Absent'),
      timestamp: Date.now()
    };

    const updatedLogs = [
      newEntry,
      ...(config.checkInLogs || []).filter(l => l.date !== todayStr)
    ];

    const updatedConfig: InstitutionAttendanceConfig = {
      ...config,
      conductedDays: newConducted,
      attendedDays: newAttended,
      leaveDays: newLeaves,
      attendancePercentage: newPercentage,
      lastCheckInDate: todayStr,
      lastWorkingDayAttended: attendedToday ? todayStr : config.lastWorkingDayAttended,
      checkInLogs: updatedLogs
    };

    onUpdateConfig(updatedConfig);

    if (attendedToday) {
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#8b5cf6', '#10b981', '#6366f1']
        });
      }
      onToast("Great Job! 🎉", `Today's attendance recorded! Current percentage: ${newPercentage}%.`, "success");
      onLogHistoryRecord?.("Daily Attendance Check-in", "Attendance & Leaves", "Present", `Attended working day classes. Current attendance: ${newPercentage}%.`);
    } else if (isHoliday) {
      onToast("Holiday Logged 🏖️", "Marked today as institutional holiday. Attendance % was preserved.", "info");
      onLogHistoryRecord?.("Institution Holiday", "Attendance & Leaves", "Holiday", "Designated official holiday.");
    } else {
      onToast("Absence Noted ⚠️", `Leave recorded. Updated attendance: ${newPercentage}%.`, "warning");
      onLogHistoryRecord?.("Daily Attendance Check-in", "Attendance & Leaves", "Leave Taken", `Marked absent. Current attendance: ${newPercentage}%.`);
    }
  };

  // Save changes from the Settings Modal
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedTotal = Math.max(1, totalWorkingDaysInput);
    const sanitizedConducted = Math.min(sanitizedTotal, Math.max(1, conductedDaysInput));
    const sanitizedAttended = Math.min(sanitizedConducted, Math.max(0, attendedDaysInput));
    const newPercentage = sanitizedConducted > 0 
      ? Number(((sanitizedAttended / sanitizedConducted) * 100).toFixed(1)) 
      : 100;

    const newConfig: InstitutionAttendanceConfig = {
      ...config,
      institutionName: institutionNameInput.trim() || 'University College',
      workingDaysPattern: schedulePattern,
      daysPerWeek: daysPerWeekInput,
      weeksInSemester: weeksInTermInput,
      totalWorkingDays: sanitizedTotal,
      conductedDays: sanitizedConducted,
      attendedDays: sanitizedAttended,
      leaveDays: Math.max(0, sanitizedConducted - sanitizedAttended),
      targetThreshold: targetThresholdInput,
      attendancePercentage: newPercentage
    };

    onUpdateConfig(newConfig);
    setIsEditingSettings(false);
    onToast(
      "Working Days & Settings Saved! ⚙️", 
      `Total working days updated to ${sanitizedTotal} (${schedulePattern.replace('_', '-')} schedule). Attendance recalculated to ${newPercentage}%.`, 
      "success"
    );
    onLogHistoryRecord?.(
      "Working Days Configuration Updated", 
      "Attendance & Leaves", 
      "Configured", 
      `User set ${sanitizedTotal} total working days (${daysPerWeekInput} days/week). Attendance: ${newPercentage}%.`
    );
  };

  // When changing schedule pattern in the modal, update preview totals
  const handlePatternChangeInModal = (pattern: WorkingDaysPattern) => {
    setSchedulePattern(pattern);
    let newDpw = daysPerWeekInput;
    if (pattern === '5_day') newDpw = 5;
    else if (pattern === '6_day') newDpw = 6;
    setDaysPerWeekInput(newDpw);

    if (pattern !== 'custom_total') {
      const calculatedTotal = weeksInTermInput * newDpw;
      setTotalWorkingDaysInput(calculatedTotal);
    }
  };

  const handleWeeksChangeInModal = (weeks: number) => {
    setWeeksInTermInput(weeks);
    if (schedulePattern !== 'custom_total') {
      setTotalWorkingDaysInput(weeks * daysPerWeekInput);
    }
  };

  const handleDaysPerWeekChangeInModal = (dpw: number) => {
    setDaysPerWeekInput(dpw);
    if (schedulePattern !== 'custom_total') {
      setTotalWorkingDaysInput(weeksInTermInput * dpw);
    }
  };

  return (
    <section 
      aria-label="Institutional Attendance Tracker" 
      className="p-4 sm:p-6 rounded-3xl bg-white/95 border border-purple-200/90 shadow-sm space-y-5 transition-all"
    >
      {/* SECTION HEADER WITH USER-SELECTED SCHEDULE INDICATOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center text-white text-lg shadow-sm shadow-purple-500/20">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold font-classic text-purple-950">
                Attendance & Working Days Tracker
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                {config.institutionName || 'College / University'}
              </span>
            </div>
            <p className="text-xs text-purple-700/80 mt-0.5">
              Select your working days schedule (5-day, 6-day, or custom) — all percentages calculate automatically.
            </p>
          </div>
        </div>

        {/* Action Button: Edit Working Days */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingSettings(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-purple-700" />
            <span>Edit Working Days ({userTotalWorkingDays}d)</span>
          </button>
        </div>
      </div>

      {/* QUICK SCHEDULE SELECTOR: LETS USERS SWITCH IN 1 CLICK */}
      <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
          <CalendarDays className="w-4 h-4 text-purple-700 flex-shrink-0" />
          <span>Working Schedule:</span>
          <span className="text-purple-700 font-semibold">
            {schedulePattern === '5_day' && '5-Day Week (Mon–Fri)'}
            {schedulePattern === '6_day' && '6-Day Week (Mon–Sat)'}
            {schedulePattern === 'custom_weekly' && `Custom Weekly (${config.daysPerWeek} days/week)`}
            {schedulePattern === 'custom_total' && `Custom Total (${userTotalWorkingDays} days)`}
          </span>
        </div>

        {/* Quick Switch Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleQuickSwitchPattern('5_day')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              schedulePattern === '5_day'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            5-Day Week
          </button>

          <button
            type="button"
            onClick={() => handleQuickSwitchPattern('6_day')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              schedulePattern === '6_day'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            6-Day Week
          </button>

          <button
            type="button"
            onClick={() => setIsEditingSettings(true)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            <span>Custom...</span>
          </button>
        </div>
      </div>

      {/* DAILY ATTENDANCE INTERACTIVE CHECK-IN CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-md border border-purple-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/40 text-purple-200 border border-purple-400/40">
                Daily Check-In
              </span>
              <span className="text-xs text-purple-300 font-mono">
                {todayStr}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-classic text-purple-50">
              Did you attend college / classes today?
            </h3>
            <p className="text-xs text-purple-300">
              {todayCheckIn ? (
                <span>
                  Today recorded as: <strong className="text-white underline">{todayCheckIn.note}</strong>. You can modify this anytime:
                </span>
              ) : (
                <span>Confirm your attendance to immediately update your verified academic percentage and records.</span>
              )}
            </p>
          </div>

          {/* Quick Choice Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            <button
              type="button"
              onClick={() => handleDailyCheckIn(true, false)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer ${
                todayCheckIn?.attended && !todayCheckIn?.isHoliday
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yes, Attended! 🎓</span>
            </button>

            <button
              type="button"
              onClick={() => handleDailyCheckIn(false, false)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer ${
                todayCheckIn && !todayCheckIn?.attended && !todayCheckIn?.isHoliday
                  ? 'bg-rose-600 text-white ring-2 ring-rose-300 scale-105'
                  : 'bg-rose-700/80 hover:bg-rose-700 text-white'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>No, Took Leave ❌</span>
            </button>

            <button
              type="button"
              onClick={() => handleDailyCheckIn(false, true)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                todayCheckIn?.isHoliday
                  ? 'bg-amber-500 text-purple-950 ring-2 ring-amber-300'
                  : 'bg-purple-800/80 hover:bg-purple-800 text-purple-200'
              }`}
              title="Mark today as institutional holiday"
            >
              <Palmtree className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Holiday</span>
            </button>
          </div>
        </div>
      </div>

      {/* ATTENDANCE OVERVIEW STATS & PROGRESS (STRICTLY FROM USER'S WORKING DAYS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Attendance % */}
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
            Attendance %
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-black font-mono ${currentPercentage >= targetThreshold ? 'text-emerald-700' : 'text-rose-700'}`}>
              {currentPercentage}%
            </span>
            <span className="text-xs text-purple-600 font-semibold">/ {targetThreshold}% target</span>
          </div>
          <span className="text-[10px] text-purple-600 font-medium block mt-1">
            {currentPercentage >= targetThreshold ? '✅ Above Requirement' : '⚠️ Shortage Warning'}
          </span>
        </div>

        {/* Metric 2: Attended Days */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
            Attended Days
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-indigo-950 font-mono">
              {attended}
            </span>
            <span className="text-xs text-indigo-600 font-semibold">/ {conducted} held</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-medium block mt-1">
            {conducted - attended} days absent
          </span>
        </div>

        {/* Metric 3: User Selected Total Working Days */}
        <div className="p-4 rounded-2xl bg-fuchsia-50/70 border border-fuchsia-200">
          <span className="text-[11px] font-bold text-fuchsia-700 uppercase tracking-wider block">
            Total Working Days
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-fuchsia-950 font-mono">
              {userTotalWorkingDays}
            </span>
            <span className="text-xs text-fuchsia-600 font-semibold">user set</span>
          </div>
          <span className="text-[10px] text-fuchsia-600 font-medium block mt-1">
            {config.daysPerWeek} days/wk • {config.weeksInSemester || 18} wks
          </span>
        </div>

        {/* Metric 4: Remaining Working Days */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Remaining Days
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-amber-950 font-mono">
              {remainingWorkingDays}
            </span>
            <span className="text-xs text-amber-700 font-semibold">days left</span>
          </div>
          <span className="text-[10px] text-amber-700 font-medium block mt-1">
            Max achievable: {maxAchievablePercentage}%
          </span>
        </div>
      </div>

      {/* VISUAL PROGRESS BAR & STATUS RECOMMENDATION */}
      <div className="space-y-2.5 p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
        <div className="flex items-center justify-between text-xs font-bold text-purple-950 flex-wrap gap-1">
          <span>Overall Term Attendance Progress</span>
          <span className="font-mono">
            {attended} attended of {conducted} conducted ({currentPercentage}%) • Target: {targetThreshold}%
          </span>
        </div>

        <div className="w-full h-3.5 bg-purple-200/60 rounded-full overflow-hidden border border-purple-300/40 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              currentPercentage >= targetThreshold
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(100, currentPercentage)}%` }}
          />
          {/* Target threshold indicator tick */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-purple-950 z-10" 
            style={{ left: `${targetThreshold}%` }}
            title={`Required ${targetThreshold}%`}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-purple-900 font-medium">
            <TrendingUp className="w-4 h-4 text-purple-700 flex-shrink-0" />
            <span>{attendanceStatusText}</span>
          </div>

          <div className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
            <span>Safe Term Bunks Left:</span>
            <strong className="text-purple-950 px-1.5 py-0.5 rounded-md bg-purple-200/60">
              {termSafeBunksRemaining} days
            </strong>
          </div>
        </div>
      </div>

      {/* EDIT WORKING DAYS & ATTENDANCE SETTINGS MODAL */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-200 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditingSettings(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 text-lg">
                ⚙️
              </div>
              <div>
                <h3 className="text-base font-bold font-classic text-purple-950">
                  Configure Working Days & Attendance
                </h3>
                <p className="text-xs text-purple-700">
                  Select your schedule pattern or enter your exact institutional working days.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Institution / College Name */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Institution / University Name
                </label>
                <input
                  type="text"
                  value={institutionNameInput}
                  onChange={(e) => setInstitutionNameInput(e.target.value)}
                  placeholder="e.g. University College / Tech Institute"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-semibold text-purple-950"
                />
              </div>

              {/* STEP 1: SCHEDULE PATTERN SELECTION */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-purple-950">
                  Select Working Days Schedule Pattern
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePatternChangeInModal('5_day')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      schedulePattern === '5_day'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">🎓 5-Day Week</span>
                      {schedulePattern === '5_day' && <span className="text-xs text-purple-700 font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Monday to Friday (5 days/week)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePatternChangeInModal('6_day')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      schedulePattern === '6_day'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">🏢 6-Day Week</span>
                      {schedulePattern === '6_day' && <span className="text-xs text-purple-700 font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Monday to Saturday (6 days/week)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePatternChangeInModal('custom_weekly')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      schedulePattern === 'custom_weekly'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">⚙️ Custom Days / Wk</span>
                      {schedulePattern === 'custom_weekly' && <span className="text-xs text-purple-700 font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Specify active days per week</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePatternChangeInModal('custom_total')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      schedulePattern === 'custom_total'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">📅 Direct Total Days</span>
                      {schedulePattern === 'custom_total' && <span className="text-xs text-purple-700 font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Enter exact term working days</span>
                  </button>
                </div>
              </div>

              {/* STEP 2: SCHEDULE PARAMETERS */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200">
                {schedulePattern !== 'custom_total' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-purple-950 mb-1">
                        Days Per Week:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={daysPerWeekInput}
                        onChange={(e) => handleDaysPerWeekChangeInModal(parseInt(e.target.value) || 5)}
                        className="w-full px-3 py-1.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-purple-950 font-mono"
                      />
                      <span className="text-[10px] text-purple-600 font-medium">Days attended weekly</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-950 mb-1">
                        Weeks in Term / Semester:
                      </label>
                      <input
                        type="number"
                        min="4"
                        max="30"
                        value={weeksInTermInput}
                        onChange={(e) => handleWeeksChangeInModal(parseInt(e.target.value) || 18)}
                        className="w-full px-3 py-1.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-purple-950 font-mono"
                      />
                      <span className="text-[10px] text-purple-600 font-medium">Usually 15 - 20 weeks</span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <p className="text-xs text-purple-800">
                      Direct mode: enter your exact total academic working days below according to your institution calendar.
                    </p>
                  </div>
                )}
              </div>

              {/* STEP 3: TOTAL WORKING DAYS & TARGET THRESHOLD */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Total Working Days:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={totalWorkingDaysInput}
                    onChange={(e) => setTotalWorkingDaysInput(parseInt(e.target.value) || 90)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                  <span className="text-[10px] text-purple-600 font-medium">
                    {schedulePattern !== 'custom_total' ? `(= ${weeksInTermInput} wks × ${daysPerWeekInput} d/wk)` : 'Custom total'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Target Requirement %:
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={targetThresholdInput}
                    onChange={(e) => setTargetThresholdInput(parseInt(e.target.value) || 75)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                  <span className="text-[10px] text-purple-600 font-medium">e.g., 75% or 80%</span>
                </div>
              </div>

              {/* STEP 4: CONDUCTED & ATTENDED DAYS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Working Days Held So Far:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalWorkingDaysInput}
                    value={conductedDaysInput}
                    onChange={(e) => setConductedDaysInput(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                  <span className="text-[10px] text-purple-600">Total held classes/days</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Days Attended So Far:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={conductedDaysInput}
                    value={attendedDaysInput}
                    onChange={(e) => setAttendedDaysInput(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                  <span className="text-[10px] text-purple-600">Days you were present</span>
                </div>
              </div>

              {/* LIVE PREVIEW BANNER */}
              <div className="p-3.5 rounded-2xl bg-purple-100/80 border border-purple-200 text-xs text-purple-950 space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span>Recalculated Attendance:</span>
                  <span className="text-sm font-mono text-purple-900">
                    {conductedDaysInput > 0 ? ((attendedDaysInput / conductedDaysInput) * 100).toFixed(1) : '100'}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-purple-700">
                  <span>Remaining Days in Term:</span>
                  <span className="font-mono">{Math.max(0, totalWorkingDaysInput - conductedDaysInput)} days</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-purple-700">
                  <span>Max Achievable % (if 100% attendance from now):</span>
                  <span className="font-mono font-bold">
                    {totalWorkingDaysInput > 0 
                      ? (((attendedDaysInput + Math.max(0, totalWorkingDaysInput - conductedDaysInput)) / totalWorkingDaysInput) * 100).toFixed(1)
                      : '100'}%
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Save Schedule & Recalculate All
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
