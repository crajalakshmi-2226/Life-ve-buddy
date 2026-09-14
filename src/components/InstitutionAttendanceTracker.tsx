import React, { useState } from 'react';
import { 
  UserCheck, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Sparkles,
  Edit3,
  Sliders,
  Check,
  X,
  Palmtree,
  ShieldCheck
} from 'lucide-react';
import { InstitutionAttendanceConfig, AttendanceDailyCheckIn } from '../types';
import { getTodayDateString } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { playSuccessChime, playAlertChime } from '../utils/audio';

interface InstitutionAttendanceTrackerProps {
  config: InstitutionAttendanceConfig;
  onUpdateConfig: (newConfig: InstitutionAttendanceConfig) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
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

  // Editable settings inputs
  const [totalWorkingDaysInput, setTotalWorkingDaysInput] = useState<number>(config.totalWorkingDays || 90);
  const [conductedDaysInput, setConductedDaysInput] = useState<number>(config.conductedDays || 42);
  const [attendedDaysInput, setAttendedDaysInput] = useState<number>(config.attendedDays || 36);
  const [institutionNameInput, setInstitutionNameInput] = useState<string>(config.institutionName || 'University College');
  const [targetThreshold, setTargetThreshold] = useState<number>(75);

  const conducted = config.conductedDays > 0 ? config.conductedDays : 1;
  const attended = config.attendedDays;
  const percentage = Number(((attended / conducted) * 100).toFixed(1));

  // Determine if check-in for today is already recorded
  const todayCheckIn = config.checkInLogs?.find(l => l.date === todayStr);

  // Calculate safe bunks or required recovery days
  const targetFraction = targetThreshold / 100;
  let attendanceStatusText = "";
  let recoveryDaysNeeded = 0;
  let safeBunkDays = 0;

  if (percentage < targetThreshold) {
    // Need: (attended + x) / (conducted + x) >= targetFraction
    // attended + x >= targetFraction * conducted + targetFraction * x
    // x * (1 - targetFraction) >= targetFraction * conducted - attended
    // x >= (targetFraction * conducted - attended) / (1 - targetFraction)
    recoveryDaysNeeded = Math.ceil((targetFraction * conducted - attended) / (1 - targetFraction));
    attendanceStatusText = `Shortage alert! Attend next ${Math.max(1, recoveryDaysNeeded)} consecutive days to reach ${targetThreshold}%.`;
  } else {
    // Can skip: attended / (conducted + y) >= targetFraction
    // attended >= targetFraction * conducted + targetFraction * y
    // y <= (attended - targetFraction * conducted) / targetFraction
    safeBunkDays = Math.floor((attended - targetFraction * conducted) / targetFraction);
    attendanceStatusText = safeBunkDays > 0 
      ? `You can safely take leave for ${safeBunkDays} ${safeBunkDays === 1 ? 'day' : 'days'} and stay above ${targetThreshold}%.`
      : `Right on track! Maintain high attendance above ${targetThreshold}%.`;
  }

  // Handle Daily Prompt Response
  const handleDailyCheckIn = (attendedToday: boolean, isHoliday = false) => {
    let newConducted = config.conductedDays;
    let newAttended = config.attendedDays;
    let newLeaves = config.leaveDays || 0;

    // If already checked in today, adjust previous response
    if (todayCheckIn) {
      if (todayCheckIn.attended && !attendedToday) {
        newAttended = Math.max(0, newAttended - 1);
        if (!isHoliday) newLeaves += 1;
      } else if (!todayCheckIn.attended && attendedToday) {
        newAttended += 1;
        newLeaves = Math.max(0, newLeaves - 1);
      }
    } else {
      // New check-in
      if (!isHoliday) {
        newConducted += 1;
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
      checkInLogs: updatedLogs
    };

    onUpdateConfig(updatedConfig);

    if (attendedToday && !isHoliday) {
      if (soundEnabled) playSuccessChime();
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.debug(e);
      }
      onToast("Attendance Logged", `Marked Present for today! Attendance updated to ${newPercentage}% 🎓`, "success");
      onLogHistoryRecord?.("Daily Attendance Check-in", "Attendance & Leaves", "Present", `Attended working day. Overall attendance: ${newPercentage}%`);
    } else if (isHoliday) {
      onToast("Holiday Noted", "Today marked as institutional holiday (working days untouched).", "info");
      onLogHistoryRecord?.("College/Work Holiday", "Attendance & Leaves", "Holiday", "Institutional holiday recorded.");
    } else {
      if (soundEnabled) playAlertChime();
      onToast("Leave Recorded", `Marked Leave for today. Current attendance: ${newPercentage}%`, "alert");
      onLogHistoryRecord?.("Daily Attendance Check-in", "Attendance & Leaves", "Absent/Leave", `Leave marked. Attendance updated to ${newPercentage}%`);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cond = Math.max(1, conductedDaysInput);
    const att = Math.min(cond, Math.max(0, attendedDaysInput));
    const total = Math.max(cond, totalWorkingDaysInput);
    const newPct = Number(((att / cond) * 100).toFixed(1));

    const updatedConfig: InstitutionAttendanceConfig = {
      ...config,
      institutionName: institutionNameInput.trim() || config.institutionName,
      totalWorkingDays: total,
      conductedDays: cond,
      attendedDays: att,
      leaveDays: Math.max(0, cond - att),
      attendancePercentage: newPct
    };

    onUpdateConfig(updatedConfig);
    setIsEditingSettings(false);
    onToast("Settings Saved", `Updated total working days to ${total} and attendance to ${newPct}%!`, "success");
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                Attendance Tracker & Working Days
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                percentage >= targetThreshold 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                  : 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
              }`}>
                {percentage}% Attendance
              </span>
            </div>
            <p className="text-xs text-purple-700/80 font-medium">
              Configurable total working days, daily check-in prompt, and automatic percentage recalculations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTotalWorkingDaysInput(config.totalWorkingDays);
              setConductedDaysInput(config.conductedDays);
              setAttendedDaysInput(config.attendedDays);
              setInstitutionNameInput(config.institutionName);
              setIsEditingSettings(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-700" />
            <span>Configure Working Days</span>
          </button>
        </div>
      </div>

      {/* DAILY "DID YOU ATTEND TODAY?" PROMPT BANNER */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-md border border-purple-800/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                DAILY ATTENDANCE PROMPT
              </span>
              <span className="text-xs text-purple-300 font-mono">Today: {todayStr}</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold font-classic text-purple-50">
              Did you attend your institution today?
            </h3>
            <p className="text-xs text-purple-300">
              {todayCheckIn ? (
                <span>
                  Today recorded as: <strong className="text-white underline">{todayCheckIn.note}</strong>. You can change it anytime:
                </span>
              ) : (
                <span>Click Yes to record your presence and automatically recalculate your overall percentage.</span>
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

      {/* ATTENDANCE OVERVIEW STATS & PROGRESS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
            Attendance %
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-black font-mono ${percentage >= targetThreshold ? 'text-emerald-700' : 'text-rose-700'}`}>
              {percentage}%
            </span>
            <span className="text-xs text-purple-600 font-semibold">/ {targetThreshold}% target</span>
          </div>
        </div>

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
        </div>

        <div className="p-4 rounded-2xl bg-fuchsia-50/70 border border-fuchsia-200">
          <span className="text-[11px] font-bold text-fuchsia-700 uppercase tracking-wider block">
            Total Working Days
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-fuchsia-950 font-mono">
              {config.totalWorkingDays}
            </span>
            <span className="text-xs text-fuchsia-600 font-semibold">days total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Remaining Days
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-amber-950 font-mono">
              {Math.max(0, config.totalWorkingDays - conducted)}
            </span>
            <span className="text-xs text-amber-700 font-semibold">days left</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar & Status Recommendation */}
      <div className="space-y-2 p-4 rounded-2xl bg-purple-50/40 border border-purple-200">
        <div className="flex items-center justify-between text-xs font-bold text-purple-950">
          <span>Overall Semester / Term Attendance Progress</span>
          <span className="font-mono">{attended} attended of {conducted} conducted ({percentage}%)</span>
        </div>

        <div className="w-full h-3 bg-purple-200/60 rounded-full overflow-hidden border border-purple-300/40 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= targetThreshold
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          {percentage >= targetThreshold ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span className={`font-semibold ${percentage >= targetThreshold ? 'text-emerald-900' : 'text-rose-900'}`}>
            {attendanceStatusText}
          </span>
        </div>
      </div>

      {/* EDITABLE SETTINGS MODAL */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-purple-200 relative space-y-4">
            <button
              type="button"
              onClick={() => setIsEditingSettings(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-classic text-purple-950 leading-tight">
                  Configure Working Days & Records
                </h3>
                <p className="text-xs text-purple-700">
                  Update institution working days and manual counts
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={institutionNameInput}
                  onChange={(e) => setInstitutionNameInput(e.target.value)}
                  placeholder="e.g. University College / Tech Institute"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-semibold text-purple-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Total Working Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={totalWorkingDaysInput}
                    onChange={(e) => setTotalWorkingDaysInput(parseInt(e.target.value) || 90)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                  <span className="text-[10px] text-purple-600">Total planned in term</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Minimum Target %
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={targetThreshold}
                    onChange={(e) => setTargetThreshold(parseInt(e.target.value) || 75)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                  <span className="text-[10px] text-purple-600">e.g. 75% or 80%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Working Days Held So Far
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalWorkingDaysInput}
                    value={conductedDaysInput}
                    onChange={(e) => setConductedDaysInput(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Days Attended So Far
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={conductedDaysInput}
                    value={attendedDaysInput}
                    onChange={(e) => setAttendedDaysInput(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-purple-950 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-100/60 border border-purple-200 text-xs text-purple-900">
                <strong>Recalculated Preview:</strong> {attendedDaysInput} / {conductedDaysInput} = {
                  conductedDaysInput > 0 ? ((attendedDaysInput / conductedDaysInput) * 100).toFixed(1) : 0
                }% Attendance
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Changes & Recalculate
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
