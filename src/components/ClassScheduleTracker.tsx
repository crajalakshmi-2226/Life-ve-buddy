import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  User, 
  Calendar, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  SlidersHorizontal,
  Bell,
  X,
  FileText
} from 'lucide-react';
import { ClassPeriod, DayOfWeek } from '../types';
import { 
  DAYS_OF_WEEK, 
  getTodayDayOfWeek, 
  formatTime12, 
  getCurrentClassStatus 
} from '../utils/helpers';
import { playSuccessChime, playAlertChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ClassScheduleTrackerProps {
  periods: ClassPeriod[];
  onUpdatePeriods: (periods: ClassPeriod[]) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

const COLOR_THEMES = [
  { id: 'purple', name: 'Purple', bg: 'bg-purple-100/90', border: 'border-purple-300', text: 'text-purple-950', badge: 'bg-purple-200 text-purple-900', ring: 'ring-purple-400' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-100/90', border: 'border-indigo-300', text: 'text-indigo-950', badge: 'bg-indigo-200 text-indigo-900', ring: 'ring-indigo-400' },
  { id: 'violet', name: 'Violet', bg: 'bg-violet-100/90', border: 'border-violet-300', text: 'text-violet-950', badge: 'bg-violet-200 text-violet-900', ring: 'ring-violet-400' },
  { id: 'fuchsia', name: 'Fuchsia', bg: 'bg-fuchsia-100/90', border: 'border-fuchsia-300', text: 'text-fuchsia-950', badge: 'bg-fuchsia-200 text-fuchsia-900', ring: 'ring-fuchsia-400' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-100/90', border: 'border-emerald-300', text: 'text-emerald-950', badge: 'bg-emerald-200 text-emerald-900', ring: 'ring-emerald-400' },
  { id: 'sky', name: 'Sky Blue', bg: 'bg-sky-100/90', border: 'border-sky-300', text: 'text-sky-950', badge: 'bg-sky-200 text-sky-900', ring: 'ring-sky-400' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-100/90', border: 'border-amber-300', text: 'text-amber-950', badge: 'bg-amber-200 text-amber-900', ring: 'ring-amber-400' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-100/90', border: 'border-rose-300', text: 'text-rose-950', badge: 'bg-rose-200 text-rose-900', ring: 'ring-rose-400' }
] as const;

export const DEFAULT_CLASS_PERIODS: ClassPeriod[] = [
  {
    id: 'p1',
    periodNumber: 'Period 1',
    subject: 'Data Structures & Algorithms',
    code: 'CS 301',
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '09:00',
    endTime: '10:15',
    room: 'Hall B - Room 204',
    instructor: 'Prof. Anderson',
    colorTheme: 'purple',
    notes: 'Bring notebook & laptop for live coding',
    attendedToday: false,
    reminderMinutesBefore: 10
  },
  {
    id: 'p2',
    periodNumber: 'Period 2',
    subject: 'Linear Algebra & Calculus',
    code: 'MATH 202',
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '10:30',
    endTime: '11:45',
    room: 'Science Complex - Rm 110',
    instructor: 'Dr. Evelyn Clark',
    colorTheme: 'indigo',
    notes: 'Submit assignment problem set #4',
    attendedToday: false,
    reminderMinutesBefore: 10
  },
  {
    id: 'p3',
    periodNumber: 'Period 3',
    subject: 'Computer Systems Architecture',
    code: 'CS 310',
    days: ['Tuesday', 'Thursday'],
    startTime: '13:00',
    endTime: '14:30',
    room: 'Tech Hub - Lab 3',
    instructor: 'Prof. Miller',
    colorTheme: 'violet',
    notes: 'RISC-V pipeline review',
    attendedToday: false,
    reminderMinutesBefore: 15
  },
  {
    id: 'p4',
    periodNumber: 'Period 4',
    subject: 'Applied Physics & Thermodynamics',
    code: 'PHYS 102',
    days: ['Tuesday', 'Thursday'],
    startTime: '15:00',
    endTime: '16:30',
    room: 'Physics Lab Block 4',
    instructor: 'Dr. Raymond Zhao',
    colorTheme: 'emerald',
    notes: 'Lab safety coat mandatory',
    attendedToday: false,
    reminderMinutesBefore: 10
  }
];

export const ClassScheduleTracker: React.FC<ClassScheduleTrackerProps> = ({
  periods,
  onUpdatePeriods,
  soundEnabled,
  onToast
}) => {
  const todayDay = getTodayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>(todayDay);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  // Modal Form State
  const [formPeriodNumber, setFormPeriodNumber] = useState('Period 1');
  const [formSubject, setFormSubject] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDays, setFormDays] = useState<DayOfWeek[]>([todayDay]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formRoom, setFormRoom] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formColor, setFormColor] = useState<ClassPeriod['colorTheme']>('purple');
  const [formNotes, setFormNotes] = useState('');
  const [formReminder, setFormReminder] = useState<number>(10);

  const status = getCurrentClassStatus(periods);

  const openAddModal = (defaultDay?: DayOfWeek) => {
    setEditingPeriodId(null);
    const countForDay = periods.filter(p => p.days.includes(defaultDay || todayDay)).length;
    setFormPeriodNumber(`Period ${countForDay + 1}`);
    setFormSubject('');
    setFormCode('');
    setFormDays(defaultDay ? [defaultDay] : [todayDay]);
    setFormStartTime('09:00');
    setFormEndTime('10:15');
    setFormRoom('');
    setFormInstructor('');
    setFormColor('purple');
    setFormNotes('');
    setFormReminder(10);
    setIsModalOpen(true);
  };

  const openEditModal = (period: ClassPeriod) => {
    setEditingPeriodId(period.id);
    setFormPeriodNumber(period.periodNumber || 'Period 1');
    setFormSubject(period.subject);
    setFormCode(period.code || '');
    setFormDays(period.days);
    setFormStartTime(period.startTime);
    setFormEndTime(period.endTime);
    setFormRoom(period.room || '');
    setFormInstructor(period.instructor || '');
    setFormColor(period.colorTheme || 'purple');
    setFormNotes(period.notes || '');
    setFormReminder(period.reminderMinutesBefore || 10);
    setIsModalOpen(true);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      onToast("Subject Required", "Please enter a subject name for this class period.", "alert");
      return;
    }
    if (formDays.length === 0) {
      onToast("Day Required", "Please select at least one day of the week.", "alert");
      return;
    }

    if (editingPeriodId) {
      // Edit existing
      const updated = periods.map(p => {
        if (p.id === editingPeriodId) {
          return {
            ...p,
            periodNumber: formPeriodNumber.trim() || 'Period',
            subject: formSubject.trim(),
            code: formCode.trim(),
            days: formDays,
            startTime: formStartTime,
            endTime: formEndTime,
            room: formRoom.trim(),
            instructor: formInstructor.trim(),
            colorTheme: formColor,
            notes: formNotes.trim(),
            reminderMinutesBefore: formReminder
          };
        }
        return p;
      });
      onUpdatePeriods(updated);
      onToast("Class Period Updated", `Saved changes for ${formSubject}`, "success");
    } else {
      // Create new period
      const newPeriod: ClassPeriod = {
        id: `period_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        periodNumber: formPeriodNumber.trim() || `Period ${periods.length + 1}`,
        subject: formSubject.trim(),
        code: formCode.trim(),
        days: formDays,
        startTime: formStartTime,
        endTime: formEndTime,
        room: formRoom.trim(),
        instructor: formInstructor.trim(),
        colorTheme: formColor,
        notes: formNotes.trim(),
        attendedToday: false,
        reminderMinutesBefore: formReminder
      };
      onUpdatePeriods([...periods, newPeriod]);
      onToast("Class Period Added", `Added ${formSubject} (${formPeriodNumber})`, "success");
    }

    if (soundEnabled) playSuccessChime();
    setIsModalOpen(false);
  };

  const handleDeletePeriod = (id: string, subjectName: string) => {
    onUpdatePeriods(periods.filter(p => p.id !== id));
    onToast("Period Removed", `Deleted ${subjectName} from schedule`, "info");
  };

  const handleDuplicatePeriod = (period: ClassPeriod) => {
    const duplicated: ClassPeriod = {
      ...period,
      id: `period_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subject: `${period.subject} (Copy)`,
      attendedToday: false
    };
    onUpdatePeriods([...periods, duplicated]);
    onToast("Period Duplicated", `Created copy of ${period.subject}`, "success");
    if (soundEnabled) playSuccessChime();
  };

  const toggleAttendance = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    const willBeAttended = !period?.attendedToday;
    const updated = periods.map(p => p.id === periodId ? { ...p, attendedToday: willBeAttended } : p);
    onUpdatePeriods(updated);

    if (willBeAttended) {
      if (soundEnabled) playSuccessChime();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.65 }
        });
      } catch (e) {
        console.debug(e);
      }
      onToast("Attendance Marked", `Marked ${period?.subject} as attended today! 🎓`, "success");
    }
  };

  const toggleFormDay = (day: DayOfWeek) => {
    if (formDays.includes(day)) {
      setFormDays(formDays.filter(d => d !== day));
    } else {
      setFormDays([...formDays, day]);
    }
  };

  const selectAllWeekdays = () => {
    setFormDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  };

  const selectMWF = () => {
    setFormDays(['Monday', 'Wednesday', 'Friday']);
  };

  const selectTT = () => {
    setFormDays(['Tuesday', 'Thursday']);
  };

  // Filter periods based on selected tab
  const displayedPeriods = selectedDay === 'ALL'
    ? [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime))
    : periods.filter(p => p.days.includes(selectedDay)).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalClassesToday = periods.filter(p => p.days.includes(todayDay)).length;
  const attendedTodayCount = periods.filter(p => p.days.includes(todayDay) && p.attendedToday).length;

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                Class Time Periods & Schedule
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                Custom Timetable
              </span>
            </div>
            <p className="text-xs text-purple-700/80 font-medium">
              Configure your exact class periods, lecture times, lecture halls, and live period alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal(selectedDay !== 'ALL' ? selectedDay : todayDay)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Period</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-white shadow-md border border-purple-800/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                <Clock className="w-3 h-3 text-purple-300" />
                {status.statusType === 'in-session' ? 'LIVE NOW' : 'SCHEDULE TRACKER'}
              </span>
              <span className="text-xs text-purple-300">Today is <strong>{todayDay}</strong></span>
            </div>

            <div className="text-sm sm:text-base font-bold font-classic text-purple-50">
              {status.badgeText}
            </div>

            {status.activePeriod && (
              <div className="text-xs text-purple-300 flex items-center gap-2">
                <span>{status.activePeriod.periodNumber} • {formatTime12(status.activePeriod.startTime)} – {formatTime12(status.activePeriod.endTime)}</span>
                {status.activePeriod.room && (
                  <span className="flex items-center gap-1 text-purple-200">
                    <MapPin className="w-3 h-3 text-purple-400" />
                    {status.activePeriod.room}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Today's Attendance Counter */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-purple-800/60 pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[11px] text-purple-300 font-medium">Classes Attended Today</span>
            <div className="text-base sm:text-lg font-extrabold text-white font-mono">
              {attendedTodayCount} <span className="text-purple-400 font-normal text-xs">/ {totalClassesToday}</span>
            </div>
          </div>
        </div>

        {/* In-Session Progress Bar */}
        {status.activePeriod && (
          <div className="mt-3 pt-2 border-t border-purple-800/50">
            <div className="flex items-center justify-between text-[11px] text-purple-300 mb-1">
              <span>Period In Progress</span>
              <span className="font-mono font-bold text-purple-200">{status.progressPercent}% elapsed</span>
            </div>
            <div className="w-full h-2 bg-purple-900/80 rounded-full overflow-hidden border border-purple-700/50">
              <div
                className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${status.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Day Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
            View Schedule by Day
          </span>
          <span className="text-xs text-purple-600 font-medium">
            {displayedPeriods.length} {displayedPeriods.length === 1 ? 'period' : 'periods'} shown
          </span>
        </div>

        {/* Day Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDay(todayDay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedDay === todayDay
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
            }`}
          >
            ⭐ Today ({todayDay.slice(0, 3)})
          </button>

          {DAYS_OF_WEEK.map(day => {
            const isSelected = selectedDay === day;
            const isToday = day === todayDay;
            const count = periods.filter(p => p.days.includes(day)).length;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected && selectedDay !== todayDay
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/60'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDay === 'ALL'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            All Week View
          </button>
        </div>
      </div>

      {/* Class Periods List / Grid */}
      <div className="space-y-3">
        {displayedPeriods.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-purple-50/50 border border-dashed border-purple-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mx-auto">
              📚
            </div>
            <div>
              <h4 className="text-sm font-bold font-classic text-purple-950">
                No classes scheduled for {selectedDay === 'ALL' ? 'the week' : selectedDay}
              </h4>
              <p className="text-xs text-purple-700/80 mt-0.5">
                Add your lecture slots, lab periods, or seminar hours for this day.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddModal(selectedDay !== 'ALL' ? selectedDay : todayDay)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Period for {selectedDay === 'ALL' ? 'Today' : selectedDay}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedPeriods.map((period) => {
              const theme = COLOR_THEMES.find(t => t.id === period.colorTheme) || COLOR_THEMES[0];
              const isToday = selectedDay === todayDay || (selectedDay === 'ALL' && period.days.includes(todayDay));

              return (
                <div
                  key={period.id}
                  className={`rounded-2xl p-4 border transition-all ${theme.bg} ${theme.border} hover:shadow-xs flex flex-col justify-between space-y-3 group`}
                >
                  {/* Top Bar: Period slot badge & Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-classic ${theme.badge} border border-black/5`}>
                        {period.periodNumber}
                      </span>
                      {period.code && (
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/70 text-purple-900 border border-purple-200/60">
                          {period.code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleDuplicatePeriod(period)}
                        className="p-1.5 rounded-lg text-purple-700 hover:text-purple-950 hover:bg-white/60 transition-colors"
                        title="Duplicate Period"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(period)}
                        className="p-1.5 rounded-lg text-purple-700 hover:text-purple-950 hover:bg-white/60 transition-colors"
                        title="Edit Period Options"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(period.id, period.subject)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-rose-600 hover:bg-white/60 transition-colors"
                        title="Delete Period"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Content: Subject, Time, Room, Instructor */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold font-classic text-purple-950 leading-tight">
                      {period.subject}
                    </h3>

                    {/* Time pill */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-900">
                      <Clock className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                      <span>{formatTime12(period.startTime)} – {formatTime12(period.endTime)}</span>
                    </div>

                    {/* Room & Instructor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px] text-purple-800">
                      {period.room && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{period.room}</span>
                        </div>
                      )}
                      {period.instructor && (
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{period.instructor}</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Notes */}
                    {period.notes && (
                      <p className="text-[11px] text-purple-700/90 italic bg-white/50 p-1.5 rounded-lg border border-purple-200/50 mt-1">
                        📝 {period.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Days chips & Attendance Toggle */}
                  <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {period.days.map(d => (
                        <span
                          key={d}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                            d === todayDay
                              ? 'bg-purple-700 text-white'
                              : 'bg-white/80 text-purple-900 border border-purple-200/80'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </div>

                    {isToday && (
                      <button
                        type="button"
                        onClick={() => toggleAttendance(period.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          period.attendedToday
                            ? 'bg-purple-800 text-white shadow-2xs'
                            : 'bg-white/90 hover:bg-white text-purple-900 border border-purple-300'
                        }`}
                      >
                        {period.attendedToday ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-200" />
                            <span>Attended</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-purple-400" />
                            <span>Mark Attended</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preset Helper Bar for Instant Schedule Setup */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-purple-900 font-medium">
          <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span>Quick Schedule Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              onUpdatePeriods(DEFAULT_CLASS_PERIODS);
              onToast("Preset Loaded", "Loaded 4 Standard College Periods (CS & Physics)", "success");
              if (soundEnabled) playSuccessChime();
            }}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-100 text-purple-950 font-bold border border-purple-200 transition-colors shadow-2xs"
          >
            College 4-Period Preset
          </button>
          <button
            type="button"
            onClick={() => openAddModal()}
            className="px-2.5 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-2xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Custom Period</span>
          </button>
        </div>
      </div>

      {/* Full Customizable Modal for Class Period */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-200 relative max-h-[90vh] overflow-y-auto">
            {/* Close modal */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-classic text-purple-950 leading-tight">
                  {editingPeriodId ? 'Edit Class Time Period' : 'Add Custom Class Period'}
                </h3>
                <p className="text-xs text-purple-700/80">
                  Set specific start time, period name, days of week & class info
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-4">
              {/* Period Name & Course Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Period / Slot Name *
                  </label>
                  <input
                    type="text"
                    value={formPeriodNumber}
                    onChange={(e) => setFormPeriodNumber(e.target.value)}
                    placeholder="e.g. Period 1, Slot A"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Subject / Course Name *
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Start Time *</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>End Time *</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. CS 301"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Days of the Week Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950">
                    Schedule Days *
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={selectAllWeekdays}
                      className="text-purple-700 hover:text-purple-950 underline font-bold"
                    >
                      Mon-Fri
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={selectMWF}
                      className="text-purple-700 hover:text-purple-950 underline font-bold"
                    >
                      MWF
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={selectTT}
                      className="text-purple-700 hover:text-purple-950 underline font-bold"
                    >
                      Tue/Thu
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map(day => {
                    const isChecked = formDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleFormDay(day)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                          isChecked
                            ? 'bg-purple-700 text-white border-purple-800 shadow-2xs scale-[1.02]'
                            : 'bg-purple-50/50 text-purple-800 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room & Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>Room / Lecture Hall</span>
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. Block B - Room 204"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>Professor / Instructor</span>
                  </label>
                  <input
                    type="text"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    placeholder="e.g. Prof. Anderson"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-950">
                  Card Theme Tag
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormColor(theme.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${theme.bg} ${theme.border} ${theme.text} ${
                        formColor === theme.id ? `ring-2 ${theme.ring} shadow-xs scale-105` : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-current" />
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Notes & Key Reminders (Optional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Bring scientific calculator & assignment sheets"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-medium text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-purple-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {editingPeriodId ? 'Save Period Changes' : 'Add Period to Timetable'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-semibold transition-colors"
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
