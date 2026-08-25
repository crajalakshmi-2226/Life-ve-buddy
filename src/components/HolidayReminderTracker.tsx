import React, { useState } from 'react';
import { 
  Palmtree, 
  Calendar, 
  Clock, 
  Bell, 
  BellRing, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Sun, 
  Compass, 
  BookOpen, 
  Sliders, 
  X, 
  ChevronRight, 
  Volume2, 
  Check, 
  CalendarDays,
  Plane,
  HeartHandshake,
  Tag
} from 'lucide-react';
import { HolidayItem, HolidayCategory, HolidayCountdownInfo } from '../types';
import { 
  formatHolidayDate, 
  getHolidayCountdown, 
  getHolidaysComingInDays, 
  DEFAULT_HOLIDAYS 
} from '../utils/helpers';
import { playSuccessChime } from '../utils/audio';

interface HolidayReminderTrackerProps {
  holidays: HolidayItem[];
  onUpdateHolidays: (holidays: HolidayItem[]) => void;
  reminderThresholdDays?: number;
  onUpdateReminderThreshold?: (days: number) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

const CATEGORY_STYLES: Record<HolidayCategory, { label: string; icon: string; bg: string; text: string; border: string }> = {
  'National Holiday': {
    label: 'National Holiday',
    icon: '🏛️',
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300'
  },
  'Academic Break': {
    label: 'Academic Break',
    icon: '📚',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300'
  },
  'Festival / Cultural': {
    label: 'Festival / Cultural',
    icon: '🎉',
    bg: 'bg-fuchsia-100',
    text: 'text-fuchsia-900',
    border: 'border-fuchsia-300'
  },
  'Semester Vacation': {
    label: 'Semester Vacation',
    icon: '🌴',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300'
  },
  'Institutional / Optional': {
    label: 'Institutional / Optional',
    icon: '🏫',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    border: 'border-sky-300'
  }
};

const COLOR_THEMES = [
  { id: 'purple', label: 'Royal Purple', class: 'border-purple-300 bg-purple-50/50' },
  { id: 'emerald', label: 'Emerald Green', class: 'border-emerald-300 bg-emerald-50/50' },
  { id: 'amber', label: 'Warm Amber', class: 'border-amber-300 bg-amber-50/50' },
  { id: 'sky', label: 'Ocean Sky', class: 'border-sky-300 bg-sky-50/50' },
  { id: 'rose', label: 'Sunset Rose', class: 'border-rose-300 bg-rose-50/50' },
  { id: 'indigo', label: 'Deep Indigo', class: 'border-indigo-300 bg-indigo-50/50' }
];

export const HolidayReminderTracker: React.FC<HolidayReminderTrackerProps> = ({
  holidays,
  onUpdateHolidays,
  reminderThresholdDays = 30,
  onUpdateReminderThreshold,
  soundEnabled,
  onToast
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedThreshold, setSelectedThreshold] = useState<number>(reminderThresholdDays);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [showStudyPlanner, setShowStudyPlanner] = useState(false);

  // Add/Edit Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<HolidayCategory>('National Holiday');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStudyGoal, setFormStudyGoal] = useState('');
  const [formColor, setFormColor] = useState<'purple' | 'emerald' | 'amber' | 'sky' | 'rose' | 'indigo'>('purple');
  const [formRemindDays, setFormRemindDays] = useState<number[]>([14, 7, 3, 1]);

  // Compute countdowns & sort
  const enrichedHolidays = holidays.map(h => ({
    holiday: h,
    countdown: getHolidayCountdown(h)
  }));

  // Nearest upcoming or ongoing holiday
  const upcomingOrOngoing = enrichedHolidays
    .filter(item => !item.countdown.isPast || item.countdown.isToday)
    .sort((a, b) => {
      if (a.countdown.isOngoing && !b.countdown.isOngoing) return -1;
      if (!a.countdown.isOngoing && b.countdown.isOngoing) return 1;
      return a.countdown.diffDays - b.countdown.diffDays;
    });

  const nearestHoliday = upcomingOrOngoing.length > 0 ? upcomingOrOngoing[0] : null;

  // Filtered by selected days threshold ("Remind holidays coming in X days")
  const holidaysWithinThreshold = enrichedHolidays.filter(item => {
    if (item.countdown.isOngoing) return true;
    return !item.countdown.isPast && item.countdown.diffDays >= 0 && item.countdown.diffDays <= selectedThreshold;
  });

  // Filtered by category
  const filteredHolidays = enrichedHolidays.filter(item => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Upcoming') return !item.countdown.isPast;
    if (activeCategory === 'Past') return item.countdown.isPast;
    return item.holiday.category === activeCategory;
  });

  // Handle threshold change
  const handleThresholdChange = (days: number) => {
    setSelectedThreshold(days);
    if (onUpdateReminderThreshold) {
      onUpdateReminderThreshold(days);
    }
    const count = holidays.filter(h => {
      const c = getHolidayCountdown(h);
      return !c.isPast && c.diffDays <= days;
    }).length;

    onToast(
      "⏰ Holiday Reminder Filter Updated",
      `Tracking ${count} ${count === 1 ? 'holiday' : 'holidays'} coming within ${days} days.`,
      "info"
    );
  };

  // Quick Test / Trigger Notification for a holiday
  const handleTriggerHolidayReminder = (h: HolidayItem, c: HolidayCountdownInfo) => {
    if (soundEnabled) playSuccessChime();
    
    let message = '';
    if (c.isOngoing) {
      message = `🌴 Ongoing Vacation: ${h.name}! ${c.countdownText}`;
    } else if (c.isTomorrow) {
      message = `🏖️ Vacation Starts Tomorrow! ${h.name} (${c.relativeDateRange})`;
    } else if (c.diffDays === 0) {
      message = `🎉 Happy Holiday! ${h.name} is TODAY! Enjoy your day off!`;
    } else {
      message = `🌴 Holiday Reminder: ${h.name} is coming in ${c.diffDays} days! (${c.relativeDateRange})`;
    }

    onToast(`🌴 ${h.name} Reminder`, message, 'success');

    // Trigger browser notification if supported and granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🌴 LifeBuddy Holiday Reminder: ${h.name}`, {
          body: message,
          icon: '/icon-192.png'
        });
      } catch (e) {
        console.debug('Push notification error', e);
      }
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (h: HolidayItem) => {
    setEditingHoliday(h);
    setFormName(h.name);
    setFormCategory(h.category);
    setFormStartDate(h.startDate);
    setFormEndDate(h.endDate || '');
    setFormDescription(h.description || '');
    setFormStudyGoal(h.studyCatchUpGoal || '');
    setFormColor((h.colorTheme as any) || 'purple');
    setFormRemindDays(h.reminderDaysBefore || [7, 3, 1]);
    setShowAddModal(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormName('');
    setFormCategory('National Holiday');
    setFormStartDate('');
    setFormEndDate('');
    setFormDescription('');
    setFormStudyGoal('');
    setFormColor('purple');
    setFormRemindDays([14, 7, 3, 1]);
    setShowAddModal(true);
  };

  // Save Holiday Form (Add or Edit)
  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStartDate) return;

    let totalDays = 1;
    if (formEndDate && formEndDate !== formStartDate) {
      const [sy, sm, sd] = formStartDate.split('-').map(Number);
      const [ey, em, ed] = formEndDate.split('-').map(Number);
      const s = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      const diffMs = end.getTime() - s.getTime();
      totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }

    if (editingHoliday) {
      const updated = holidays.map(h => {
        if (h.id === editingHoliday.id) {
          return {
            ...h,
            name: formName.trim(),
            category: formCategory,
            startDate: formStartDate,
            endDate: formEndDate ? formEndDate : undefined,
            totalDays,
            description: formDescription.trim() || undefined,
            studyCatchUpGoal: formStudyGoal.trim() || undefined,
            colorTheme: formColor,
            reminderDaysBefore: formRemindDays
          };
        }
        return h;
      });
      onUpdateHolidays(updated);
      onToast("✅ Holiday Updated", `Saved changes for "${formName}"`, "success");
    } else {
      const newHol: HolidayItem = {
        id: `hol_${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        startDate: formStartDate,
        endDate: formEndDate ? formEndDate : undefined,
        totalDays,
        reminderEnabled: true,
        reminderDaysBefore: formRemindDays,
        isCustom: true,
        colorTheme: formColor,
        description: formDescription.trim() || undefined,
        studyCatchUpGoal: formStudyGoal.trim() || undefined
      };
      onUpdateHolidays([...holidays, newHol]);
      onToast("✨ Holiday Added", `Added "${formName}" to your semester calendar.`, "success");
    }

    if (soundEnabled) playSuccessChime();
    setShowAddModal(false);
    setEditingHoliday(null);
  };

  // Delete Holiday
  const handleDeleteHoliday = (id: string) => {
    const target = holidays.find(h => h.id === id);
    const updated = holidays.filter(h => h.id !== id);
    onUpdateHolidays(updated);
    onToast("🗑️ Holiday Deleted", `Removed "${target?.name || 'holiday'}" from tracker.`, "info");
  };

  // Toggle Reminder Status
  const handleToggleReminder = (id: string) => {
    const updated = holidays.map(h => {
      if (h.id === id) {
        const nextState = !h.reminderEnabled;
        return { ...h, reminderEnabled: nextState };
      }
      return h;
    });
    onUpdateHolidays(updated);
    const h = holidays.find(item => item.id === id);
    onToast(
      h?.reminderEnabled ? "🔕 Reminders Muted" : "🔔 Reminders Activated",
      `Notifications for ${h?.name || 'holiday'} are now ${!h?.reminderEnabled ? 'active' : 'paused'}.`,
      "info"
    );
  };

  // Reset to default holidays
  const handleResetDefaults = () => {
    onUpdateHolidays(DEFAULT_HOLIDAYS);
    onToast("🔄 Restored Sample Holidays", "Re-populated standard academic breaks and public holidays.", "info");
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-purple-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-purple-500/10 border border-purple-200 flex-shrink-0">
            🌴
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                Upcoming Days Reminder
              </span>
              <span className="text-xs font-semibold text-purple-700">
                Semester Breaks & Vacations
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold font-classic text-purple-950 mt-0.5">
              Holidays & Vacations Countdown Tracker
            </h2>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowStudyPlanner(!showStudyPlanner)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-700" />
            <span>{showStudyPlanner ? 'Hide Prep Tips' : 'Vacation Study Tips'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday / Break</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset to default holidays"
            className="p-2 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. HERO COUNTDOWN CARD: NEAREST UPCOMING HOLIDAY        */}
      {/* ======================================================== */}
      {nearestHoliday && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-purple-950 text-white p-5 sm:p-7 shadow-lg border border-purple-800/80">
          {/* Background Decorative Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/10 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-purple-950 shadow-xs flex items-center gap-1">
                  <span>✨ Next Holiday Coming Up</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-purple-200 border border-white/15">
                  {nearestHoliday.holiday.category}
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold font-classic tracking-tight text-white">
                  {nearestHoliday.holiday.name}
                </h3>
                <p className="text-xs sm:text-sm text-purple-200 font-medium mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-amber-300" />
                    <strong>{nearestHoliday.countdown.relativeDateRange}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">
                    {nearestHoliday.holiday.totalDays} {nearestHoliday.holiday.totalDays === 1 ? 'Day' : 'Days'} Duration
                  </span>
                </p>
              </div>

              {nearestHoliday.holiday.description && (
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  {nearestHoliday.holiday.description}
                </p>
              )}

              {nearestHoliday.holiday.studyCatchUpGoal && (
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-purple-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Pre-Break Goal: </strong>
                    <span>{nearestHoliday.holiday.studyCatchUpGoal}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown Badge & Quick Test Action */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[200px] space-y-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-amber-300">
                Live Days Countdown
              </div>

              <div className="space-y-0.5">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {nearestHoliday.countdown.isOngoing 
                    ? 'ONGOING' 
                    : nearestHoliday.countdown.diffDays === 0 
                    ? 'TODAY' 
                    : nearestHoliday.countdown.diffDays === 1 
                    ? 'TOMORROW' 
                    : `${nearestHoliday.countdown.diffDays} DAYS`}
                </div>
                <div className="text-xs text-purple-200 font-medium">
                  {nearestHoliday.countdown.countdownText}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerHolidayReminder(nearestHoliday.holiday, nearestHoliday.countdown)}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-purple-950" />
                <span>Test Reminder Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CUSTOM THRESHOLD FILTER BAR ("Remind holidays coming in X days") */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-800" />
              <h3 className="text-xs sm:text-sm font-bold text-purple-950">
                Remind Holidays Coming in:
              </h3>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Select your custom reminder threshold window to track upcoming vacations and days off.
            </p>
          </div>

          <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-white border border-purple-300 text-purple-900 shadow-2xs self-start sm:self-auto">
            {holidaysWithinThreshold.length} Holidays within {selectedThreshold} Days
          </span>
        </div>

        {/* Interactive Threshold Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Next 3 Days', days: 3 },
            { label: 'Next 7 Days (1 Week)', days: 7 },
            { label: 'Next 14 Days (2 Weeks)', days: 14 },
            { label: 'Next 30 Days (1 Month)', days: 30 },
            { label: 'Next 60 Days (2 Months)', days: 60 },
            { label: 'Next 120 Days (Full Semester)', days: 120 }
          ].map(preset => (
            <button
              key={preset.days}
              type="button"
              onClick={() => handleThresholdChange(preset.days)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedThreshold === preset.days
                  ? 'bg-purple-800 text-white shadow-xs scale-102'
                  : 'bg-white text-purple-900 hover:bg-purple-100 border border-purple-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. OPTIONAL VACATION STUDY & PRODUCTIVITY PLANNER TIPS   */}
      {/* ======================================================== */}
      {showStudyPlanner && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-100 via-indigo-50 to-amber-50 border border-purple-200 space-y-3 transition-all animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-purple-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Smart Pre-Holiday Study Strategy (Relax Without Guilt)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowStudyPlanner(false)}
              className="text-purple-600 hover:text-purple-900 text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1">
                <span>1. Clear Pending Deadlines</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Submit active lab reports and programming assignments 48 hours before your vacation begins to prevent backlog stress.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1">
                <span>2. The 30-Min Daily Rhythm</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                During multi-day breaks, spend just 20–30 minutes in the morning reviewing flashcards to maintain academic recall without ruining leisure time.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1">
                <span>3. Attendance Buffer Check</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Make sure you do not take unapproved unofficial leaves right before or after scheduled official university breaks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CATEGORY TABS & SUMMARY FILTER                       */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['All', 'Upcoming', 'National Holiday', 'Academic Break', 'Semester Vacation', 'Past'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredHolidays.length} of {holidays.length} Total Holidays
        </span>
      </div>

      {/* ======================================================== */}
      {/* 5. HOLIDAYS LIST CARDS GRID                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHolidays.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2">
            <div className="text-3xl">🌴</div>
            <h4 className="text-sm font-bold text-purple-950">No Holidays Found</h4>
            <p className="text-xs text-slate-500">
              No entries match the selected filter. Click "Add Holiday / Break" to add your campus schedule.
            </p>
          </div>
        ) : (
          filteredHolidays.map(({ holiday: h, countdown: c }) => {
            const catStyle = CATEGORY_STYLES[h.category] || CATEGORY_STYLES['National Holiday'];

            return (
              <div
                key={h.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 shadow-2xs ${
                  c.isOngoing
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-200'
                    : c.isTomorrow || c.diffDays <= 3 && !c.isPast
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200'
                    : 'bg-white border-purple-200 hover:border-purple-300'
                }`}
              >
                {/* Card Top: Category badge & Countdown Ribbon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                      <span>{catStyle.icon}</span>
                      <span>{h.category}</span>
                    </span>
                    {h.isCustom && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Countdown Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs whitespace-nowrap ${c.badgeStyle.bg} ${c.badgeStyle.text} ${c.badgeStyle.border}`}>
                    {c.countdownBadge}
                  </span>
                </div>

                {/* Holiday Title & Date Range */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-purple-950 line-clamp-1">
                    {h.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-800">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>{c.relativeDateRange}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-bold">
                      {h.totalDays} {h.totalDays === 1 ? 'day' : 'days break'}
                    </span>
                  </div>
                </div>

                {/* Description or Study Goal */}
                {h.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {h.description}
                  </p>
                )}

                {h.studyCatchUpGoal && (
                  <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-900 font-medium">
                    <span className="font-bold text-purple-950">🎯 Goal: </span>
                    <span className="italic">{h.studyCatchUpGoal}</span>
                  </div>
                )}

                {/* Card Footer: Reminder status & Actions */}
                <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-2">
                  {/* Reminder Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleReminder(h.id)}
                    title={h.reminderEnabled ? "Reminders Enabled (Click to pause)" : "Reminders Muted (Click to enable)"}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                      h.reminderEnabled
                        ? 'bg-purple-100 text-purple-950 border-purple-300 hover:bg-purple-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Bell className={`w-3 h-3 ${h.reminderEnabled ? 'text-purple-700 fill-purple-700' : 'text-slate-400'}`} />
                    <span>{h.reminderEnabled ? 'Reminding' : 'Muted'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Test alert trigger */}
                    <button
                      type="button"
                      onClick={() => handleTriggerHolidayReminder(h, c)}
                      title="Send instant preview notification"
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5 text-amber-700" />
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(h)}
                      title="Edit holiday details"
                      className="p-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(h.id)}
                      title="Delete holiday"
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT HOLIDAY MODAL                                */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-purple-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-purple-950 font-classic">
                  {editingHoliday ? 'Edit Holiday / Vacation' : 'Add New Semester Holiday / Break'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="space-y-3.5">
              {/* Holiday Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-950">Holiday / Break Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Labor Day, Autumn Break, Spring Vacation"
                  className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Category & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-950">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as HolidayCategory)}
                    className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl font-medium"
                  >
                    <option value="National Holiday">🏛️ National Holiday</option>
                    <option value="Academic Break">📚 Academic Break</option>
                    <option value="Festival / Cultural">🎉 Festival / Cultural</option>
                    <option value="Semester Vacation">🌴 Semester Vacation</option>
                    <option value="Institutional / Optional">🏫 Institutional / Optional</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-950">Theme Color</label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl font-medium"
                  >
                    <option value="purple">Royal Purple</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="amber">Warm Amber</option>
                    <option value="sky">Ocean Sky</option>
                    <option value="rose">Sunset Rose</option>
                    <option value="indigo">Deep Indigo</option>
                  </select>
                </div>
              </div>

              {/* Dates: Start and End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-950">Start Date *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-950">End Date (Optional for 1-day)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-950">Description / Details</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Official campus recess. Administrative offices and classes closed."
                  className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl"
                />
              </div>

              {/* Pre-Holiday Study Goal */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-950">Pre-Holiday Study / Catch-up Goal</label>
                <input
                  type="text"
                  value={formStudyGoal}
                  onChange={(e) => setFormStudyGoal(e.target.value)}
                  placeholder="e.g. Complete DSA assignment 3 before taking break"
                  className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-xl"
                />
              </div>

              {/* Reminder Thresholds */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-purple-950">
                  Notify Me Before Holiday:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[30, 14, 7, 3, 1].map(d => {
                    const isChecked = formRemindDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setFormRemindDays(formRemindDays.filter(item => item !== d));
                          } else {
                            setFormRemindDays([...formRemindDays, d].sort((a, b) => b - a));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-purple-700 text-white'
                            : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {d} {d === 1 ? 'day' : 'days'} before
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  {editingHoliday ? 'Save Changes' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
