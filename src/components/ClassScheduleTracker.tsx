import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Upload,
  Download,
  Moon,
  Sun,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ClassPeriod, DayOfWeek, TomorrowConfirmationRecord } from '../types';
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
  },
  {
    id: 'p5',
    periodNumber: 'Period 1',
    subject: 'Database Management Systems',
    code: 'CS 320',
    days: ['Saturday'],
    startTime: '09:30',
    endTime: '11:00',
    room: 'Hall C - Room 301',
    instructor: 'Dr. Sarah Patel',
    colorTheme: 'amber',
    notes: 'SQL normalization review and practical test',
    attendedToday: false,
    reminderMinutesBefore: 10
  }
];

// Presets for 1-click loading
const PRESET_SCHEDULES = {
  cs_5day: [
    { id: 'cs1', periodNumber: 'Period 1', subject: 'Operating Systems', code: 'CS 350', days: ['Monday', 'Wednesday', 'Friday'] as DayOfWeek[], startTime: '09:00', endTime: '10:15', room: 'Hall A 101', instructor: 'Dr. Lin', colorTheme: 'purple' as const, reminderMinutesBefore: 10 },
    { id: 'cs2', periodNumber: 'Period 2', subject: 'Algorithms Design', code: 'CS 355', days: ['Monday', 'Wednesday', 'Friday'] as DayOfWeek[], startTime: '10:30', endTime: '11:45', room: 'Hall B 202', instructor: 'Prof. Vance', colorTheme: 'indigo' as const, reminderMinutesBefore: 10 },
    { id: 'cs3', periodNumber: 'Period 3', subject: 'Web Systems & API', code: 'CS 380', days: ['Tuesday', 'Thursday'] as DayOfWeek[], startTime: '13:00', endTime: '14:30', room: 'Computer Lab 2', instructor: 'Prof. Gomez', colorTheme: 'emerald' as const, reminderMinutesBefore: 10 },
    { id: 'cs4', periodNumber: 'Period 4', subject: 'Cybersecurity Principles', code: 'CS 390', days: ['Tuesday', 'Thursday'] as DayOfWeek[], startTime: '15:00', endTime: '16:30', room: 'Auditorium 1', instructor: 'Dr. Becker', colorTheme: 'rose' as const, reminderMinutesBefore: 10 }
  ],
  college_6day: [
    { id: 'c1', periodNumber: 'Period 1', subject: 'Calculus III', code: 'MATH 301', days: ['Monday', 'Wednesday', 'Friday'] as DayOfWeek[], startTime: '08:30', endTime: '09:45', room: 'Math Rm 12', instructor: 'Prof. Davis', colorTheme: 'purple' as const, reminderMinutesBefore: 10 },
    { id: 'c2', periodNumber: 'Period 2', subject: 'Modern Physics', code: 'PHYS 201', days: ['Monday', 'Wednesday', 'Friday'] as DayOfWeek[], startTime: '10:00', endTime: '11:15', room: 'Science Ctr', instructor: 'Dr. Klein', colorTheme: 'indigo' as const, reminderMinutesBefore: 10 },
    { id: 'c3', periodNumber: 'Period 3', subject: 'Organic Chemistry', code: 'CHEM 210', days: ['Tuesday', 'Thursday'] as DayOfWeek[], startTime: '09:00', endTime: '10:30', room: 'Chem Lab B', instructor: 'Dr. Adams', colorTheme: 'amber' as const, reminderMinutesBefore: 10 },
    { id: 'c4', periodNumber: 'Period 4', subject: 'Technical Writing', code: 'ENG 205', days: ['Tuesday', 'Thursday'] as DayOfWeek[], startTime: '11:00', endTime: '12:30', room: 'Humanities 3', instructor: 'Prof. Miller', colorTheme: 'sky' as const, reminderMinutesBefore: 10 },
    { id: 'c5', periodNumber: 'Period 1', subject: 'Engineering Seminar & Viva', code: 'ENGR 400', days: ['Saturday'] as DayOfWeek[], startTime: '09:00', endTime: '12:00', room: 'Conference Hall', instructor: 'Dept Dean', colorTheme: 'rose' as const, reminderMinutesBefore: 15 }
  ]
};

export const ClassScheduleTracker: React.FC<ClassScheduleTrackerProps> = ({
  periods,
  onUpdatePeriods,
  soundEnabled,
  onToast
}) => {
  const todayDay = getTodayDayOfWeek();

  // 5-Day vs 6-Day setting
  const [workDaysMode, setWorkDaysMode] = useState<5 | 6>(() => {
    const saved = localStorage.getItem('class_schedule_workdays');
    return saved === '5' ? 5 : 6;
  });

  const activeDaysList: DayOfWeek[] = workDaysMode === 5
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>(todayDay);
  const [viewMode, setViewMode] = useState<'weekly_timetable' | 'daily_cards'>('weekly_timetable');

  // Modal Form State (Add / Edit period)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [formPeriodNumber, setFormPeriodNumber] = useState('Period 1');
  const [formSubject, setFormSubject] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDays, setFormDays] = useState<DayOfWeek[]>([todayDay]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:15');
  const [formRoom, setFormRoom] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formColor, setFormColor] = useState<ClassPeriod['colorTheme']>('purple');
  const [formNotes, setFormNotes] = useState('');
  const [formReminder, setFormReminder] = useState<number>(10);

  // Upload / Import Timetable Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'paste' | 'templates'>('file');
  const [pasteContent, setPasteContent] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evening Next-Day Confirmation State
  const [isEveningConfirmationOpen, setIsEveningConfirmationOpen] = useState(false);
  const [tomorrowReminderMap, setTomorrowReminderMap] = useState<{ [id: string]: boolean }>({});
  const [tomorrowCustomPeriods, setTomorrowCustomPeriods] = useState<ClassPeriod[]>([]);
  const [isAddPeriodForTomorrowOpen, setIsAddPeriodForTomorrowOpen] = useState(false);
  const [newTomorrowSubject, setNewTomorrowSubject] = useState('');
  const [newTomorrowTime, setNewTomorrowTime] = useState('09:00');
  const [newTomorrowEndTime, setNewTomorrowEndTime] = useState('10:15');
  const [newTomorrowRoom, setNewTomorrowRoom] = useState('');

  // Calculate Tomorrow's Day
  const getTomorrowDay = (): DayOfWeek => {
    const map: { [k in DayOfWeek]: DayOfWeek } = {
      Monday: 'Tuesday',
      Tuesday: 'Wednesday',
      Wednesday: 'Thursday',
      Thursday: 'Friday',
      Friday: workDaysMode === 5 ? 'Monday' : 'Saturday',
      Saturday: 'Monday',
      Sunday: 'Monday'
    };
    return map[todayDay] || 'Monday';
  };

  const tomorrowDay = getTomorrowDay();

  // Calculate Tomorrow's Date String
  const getTomorrowDateStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const tomorrowDateStr = getTomorrowDateStr();

  // Check if current time is evening (5 PM / 17:00 or later)
  const isEvening = new Date().getHours() >= 17;

  // Check if confirmation already completed for tomorrow
  const confirmationStorageKey = `schedule_tomorrow_confirmed_${tomorrowDateStr}`;
  const [isTomorrowConfirmed, setIsTomorrowConfirmed] = useState<boolean>(() => {
    return localStorage.getItem(confirmationStorageKey) === 'true';
  });

  // Periods scheduled for tomorrow
  const tomorrowBasePeriods = periods.filter(p => p.days.includes(tomorrowDay));
  const tomorrowAllPeriods = [...tomorrowBasePeriods, ...tomorrowCustomPeriods];

  // Initialize reminder map for tomorrow's periods
  useEffect(() => {
    const initialMap: { [id: string]: boolean } = {};
    tomorrowAllPeriods.forEach(p => {
      initialMap[p.id] = tomorrowReminderMap[p.id] !== undefined ? tomorrowReminderMap[p.id] : true;
    });
    setTomorrowReminderMap(initialMap);
  }, [tomorrowBasePeriods.length, tomorrowCustomPeriods.length]);

  const handleToggleWorkDaysMode = (days: 5 | 6) => {
    setWorkDaysMode(days);
    localStorage.setItem('class_schedule_workdays', days.toString());
    if (soundEnabled) playSuccessChime();
    onToast(`Timetable Updated`, `Switched to ${days}-Day academic week (${days === 5 ? 'Mon–Fri' : 'Mon–Sat'}).`, 'info');
  };

  const status = getCurrentClassStatus(periods);

  const openAddModal = (defaultDay?: DayOfWeek) => {
    setEditingPeriodId(null);
    const targetDay = defaultDay || (selectedDay !== 'ALL' ? selectedDay : todayDay);
    const countForDay = periods.filter(p => p.days.includes(targetDay)).length;
    setFormPeriodNumber(`Period ${countForDay + 1}`);
    setFormSubject('');
    setFormCode('');
    setFormDays([targetDay]);
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

  // Upload / Import Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      processTimetableImport(text, file.name.endsWith('.csv') ? 'csv' : 'json');
    };
    reader.onerror = () => {
      setFileError('Could not read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const processTimetableImport = (text: string, format: 'json' | 'csv') => {
    try {
      let importedPeriods: ClassPeriod[] = [];

      if (format === 'json' || text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : (parsed.periods || []);
        if (!Array.isArray(list) || list.length === 0) {
          setFileError('JSON file did not contain an array of class periods.');
          return;
        }

        importedPeriods = list.map((item: any, idx: number) => ({
          id: item.id || `imported_${Date.now()}_${idx}`,
          periodNumber: item.periodNumber || `Period ${idx + 1}`,
          subject: item.subject || 'Class',
          code: item.code || '',
          days: Array.isArray(item.days) && item.days.length > 0 ? item.days : ['Monday'],
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '10:00',
          room: item.room || '',
          instructor: item.instructor || '',
          colorTheme: item.colorTheme || 'purple',
          notes: item.notes || '',
          reminderMinutesBefore: item.reminderMinutesBefore || 10,
          attendedToday: false
        }));
      } else {
        // Parse CSV
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          setFileError('CSV file has no data rows.');
          return;
        }

        // Header could be: Day,Period,Subject,Code,Start,End,Room,Instructor
        const dataLines = lines.slice(1);
        importedPeriods = dataLines.map((line, idx) => {
          const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const dayVal = (cols[0] as DayOfWeek) || 'Monday';
          const validDay = DAYS_OF_WEEK.includes(dayVal) ? dayVal : 'Monday';

          return {
            id: `csv_${Date.now()}_${idx}`,
            periodNumber: cols[1] || `Period ${idx + 1}`,
            subject: cols[2] || 'Lecture',
            code: cols[3] || '',
            days: [validDay],
            startTime: cols[4] || '09:00',
            endTime: cols[5] || '10:00',
            room: cols[6] || '',
            instructor: cols[7] || '',
            colorTheme: 'purple',
            reminderMinutesBefore: 10,
            attendedToday: false
          };
        });
      }

      if (importedPeriods.length > 0) {
        onUpdatePeriods(importedPeriods);
        setIsUploadModalOpen(false);
        setPasteContent('');
        if (soundEnabled) playSuccessChime();
        onToast('Timetable Imported! 📅', `Successfully loaded ${importedPeriods.length} class periods across the week.`, 'success');
      } else {
        setFileError('No valid class periods found in import data.');
      }
    } catch (err: any) {
      setFileError(`Parse error: ${err.message || 'Invalid format'}`);
    }
  };

  const handleExportSchedule = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(periods, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LifeBuddy_Timetable_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onToast('Exported Timetable', 'Downloaded your weekly schedule JSON file.', 'success');
  };

  // Evening Confirmation Actions
  const handleToggleTomorrowPeriodReminder = (periodId: string) => {
    setTomorrowReminderMap(prev => ({
      ...prev,
      [periodId]: !prev[periodId]
    }));
  };

  const handleDeleteTomorrowPeriod = (periodId: string) => {
    // If it's a custom tomorrow period, remove it from custom list
    setTomorrowCustomPeriods(prev => prev.filter(p => p.id !== periodId));
    // If it's a base period, turn off reminder and exclude
    setTomorrowReminderMap(prev => ({
      ...prev,
      [periodId]: false
    }));
    onToast('Period Skipped for Tomorrow', 'This class will not trigger a reminder for tomorrow.', 'info');
  };

  const handleAddPeriodForTomorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTomorrowSubject.trim()) return;

    const extra: ClassPeriod = {
      id: `tomorrow_extra_${Date.now()}`,
      periodNumber: `Special / Extra`,
      subject: newTomorrowSubject.trim(),
      days: [tomorrowDay],
      startTime: newTomorrowTime,
      endTime: newTomorrowEndTime,
      room: newTomorrowRoom.trim() || 'Online / Extra',
      colorTheme: 'fuchsia',
      reminderMinutesBefore: 10,
      attendedToday: false
    };

    setTomorrowCustomPeriods(prev => [...prev, extra]);
    setTomorrowReminderMap(prev => ({ ...prev, [extra.id]: true }));
    setIsAddPeriodForTomorrowOpen(false);
    setNewTomorrowSubject('');
    setNewTomorrowRoom('');
    if (soundEnabled) playSuccessChime();
    onToast('Extra Class Added for Tomorrow', `Added ${extra.subject} to tomorrow's reminder list.`, 'success');
  };

  const handleConfirmTomorrowSchedule = () => {
    localStorage.setItem(confirmationStorageKey, 'true');
    setIsTomorrowConfirmed(true);
    setIsEveningConfirmationOpen(false);

    if (soundEnabled) playSuccessChime();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.debug(e);
    }
    const activeCount = Object.values(tomorrowReminderMap).filter(Boolean).length;
    onToast('Reminders Confirmed! 🌙', `Scheduled ${activeCount} class reminders for tomorrow (${tomorrowDay}). Sleep well!`, 'success');
  };

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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                Class Time Periods & Weekly Timetable
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                {workDaysMode}-Day Schedule
              </span>
            </div>
            <p className="text-xs text-purple-700/80 font-medium">
              Configure your timetable for {workDaysMode === 5 ? '5 days (Mon–Fri)' : '6 days (Mon–Sat)'}, upload schedule & confirm evening reminders
            </p>
          </div>
        </div>

        {/* Top Header Buttons: 5/6 Days Toggle, Upload, Evening Confirmation, Add Slot */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* 5-Day vs 6-Day Academic Week Switcher */}
          <div className="flex items-center p-0.5 bg-purple-100 rounded-xl border border-purple-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleToggleWorkDaysMode(5)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                workDaysMode === 5 ? 'bg-purple-800 text-white shadow-2xs' : 'text-purple-800 hover:bg-purple-200/60'
              }`}
            >
              5-Day (Mon–Fri)
            </button>
            <button
              type="button"
              onClick={() => handleToggleWorkDaysMode(6)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                workDaysMode === 6 ? 'bg-purple-800 text-white shadow-2xs' : 'text-purple-800 hover:bg-purple-200/60'
              }`}
            >
              6-Day (Mon–Sat)
            </button>
          </div>

          {/* Upload / Import Timetable Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload CSV/JSON timetable or pick academic template"
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-700" />
            <span>Upload</span>
          </button>

          {/* Evening Tomorrow Confirmation Launcher */}
          <button
            type="button"
            onClick={() => setIsEveningConfirmationOpen(true)}
            title="Review and confirm class reminders for tomorrow"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              isEvening && !isTomorrowConfirmed
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-purple-950 animate-pulse font-extrabold'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-700" />
            <span>Tomorrow's Check</span>
            {isTomorrowConfirmed && <Check className="w-3 h-3 text-emerald-600" />}
          </button>

          {/* Add Class Period */}
          <button
            type="button"
            onClick={() => openAddModal()}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Period</span>
          </button>
        </div>
      </div>

      {/* AUTOMATIC EVENING CONFIRMATION PROMPT BANNER (If evening and not yet confirmed) */}
      {isEvening && !isTomorrowConfirmed && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white border border-indigo-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
              🌙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Evening Timetable Check
                </span>
                <span className="text-[10px] bg-indigo-800 px-2 py-0.2 rounded-full text-indigo-200 font-mono">
                  Tomorrow: {tomorrowDay}
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-0.5 leading-relaxed">
                Tomorrow is <strong>{tomorrowDay}</strong> with <strong>{tomorrowBasePeriods.length}</strong> scheduled periods. Confirm your reminder preferences for tomorrow!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEveningConfirmationOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap self-end sm:self-auto cursor-pointer"
          >
            Review & Set Reminders ➔
          </button>
        </div>
      )}

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

      {/* View Mode & Day Selector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
              Layout:
            </span>
            <div className="flex items-center p-0.5 bg-purple-100 rounded-xl border border-purple-200">
              <button
                type="button"
                onClick={() => setViewMode('weekly_timetable')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'weekly_timetable'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                📅 Weekly Timetable ({workDaysMode}-Day)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('daily_cards')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'daily_cards'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                📋 Single Day View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSchedule}
              className="text-xs text-purple-700 hover:text-purple-950 font-bold flex items-center gap-1 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup</span>
            </button>
            <span className="text-xs text-purple-500">•</span>
            <span className="text-xs text-purple-600 font-medium">
              {periods.length} total periods
            </span>
          </div>
        </div>

        {/* Day Pills Carousel (Active in Daily View) */}
        {viewMode === 'daily_cards' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none animate-fadeIn">
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

            {activeDaysList.map(day => {
              const isSelected = selectedDay === day;
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
              All Periods
            </button>
          </div>
        )}
      </div>

      {/* FULL WEEKLY TIMETABLE (5-DAY OR 6-DAY) */}
      {viewMode === 'weekly_timetable' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-purple-800">
            <span className="font-semibold">
              Academic timetable ({activeDaysList[0]} to {activeDaysList[activeDaysList.length - 1]}):
            </span>
            <button
              type="button"
              onClick={() => openAddModal(todayDay)}
              className="font-bold text-purple-700 hover:text-purple-950 underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Slot</span>
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 ${workDaysMode === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-3.5`}>
            {activeDaysList.map(day => {
              const dayPeriods = periods
                .filter(p => p.days.includes(day))
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = day === todayDay;

              return (
                <div 
                  key={day}
                  className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                    isToday 
                      ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400/50 shadow-xs' 
                      : 'bg-white border-purple-200/90 hover:border-purple-300'
                  }`}
                >
                  {/* Day Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold font-classic text-purple-950">
                        {day}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-purple-700 text-white shadow-2xs">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-purple-700 px-1.5 py-0.5 rounded-md bg-purple-100">
                        {dayPeriods.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => openAddModal(day)}
                        title={`Add class period for ${day}`}
                        className="p-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Day Classes List */}
                  <div className="space-y-2 flex-1 min-h-[140px]">
                    {dayPeriods.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-400 space-y-1.5 border border-dashed border-purple-200/60 rounded-xl bg-purple-50/20">
                        <span className="text-lg opacity-40">☕</span>
                        <p className="text-xs font-medium text-purple-400">No classes on {day}</p>
                        <button
                          type="button"
                          onClick={() => openAddModal(day)}
                          className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                        >
                          + Add slot
                        </button>
                      </div>
                    ) : (
                      dayPeriods.map(p => {
                        const theme = COLOR_THEMES.find(t => t.id === p.colorTheme) || COLOR_THEMES[0];
                        return (
                          <div
                            key={`${day}-${p.id}`}
                            className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${theme.bg} ${theme.border} group`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${theme.badge}`}>
                                {p.periodNumber}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-purple-900 font-mono">
                                <Clock className="w-3 h-3 text-purple-600" />
                                <span>{formatTime12(p.startTime)} - {formatTime12(p.endTime)}</span>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-purple-950 line-clamp-1">
                                {p.subject}
                              </h4>
                              {(p.code || p.room) && (
                                <div className="text-[10px] text-purple-700 font-medium flex items-center gap-2 mt-0.5">
                                  {p.code && <span className="font-semibold">{p.code}</span>}
                                  {p.room && <span>• {p.room}</span>}
                                </div>
                              )}
                            </div>

                            {/* Actions row */}
                            <div className="pt-1.5 border-t border-black/5 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => toggleAttendance(p.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-purple-900 cursor-pointer"
                              >
                                {p.attendedToday ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-purple-400" />
                                )}
                                <span>{p.attendedToday ? 'Attended' : 'Mark attend'}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(p)}
                                  className="p-1 rounded text-purple-700 hover:bg-white/80 transition-colors cursor-pointer"
                                  title="Edit period"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePeriod(p.id, p.subject)}
                                  className="p-1 rounded text-purple-400 hover:text-rose-600 hover:bg-white/80 transition-colors cursor-pointer"
                                  title="Delete period"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* DAILY CARDS VIEW */}
      {viewMode === 'daily_cards' && (
        <div className="space-y-3">
          {periods.filter(p => selectedDay === 'ALL' || p.days.includes(selectedDay)).length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-purple-50/50 border border-dashed border-purple-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mx-auto">
                📚
              </div>
              <h4 className="text-sm font-bold text-purple-950">No classes scheduled</h4>
              <button
                type="button"
                onClick={() => openAddModal()}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs cursor-pointer"
              >
                + Add Class Period
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {periods
                .filter(p => selectedDay === 'ALL' || p.days.includes(selectedDay))
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(p => {
                  const theme = COLOR_THEMES.find(t => t.id === p.colorTheme) || COLOR_THEMES[0];
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border ${theme.bg} ${theme.border} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${theme.badge}`}>
                          {p.periodNumber}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-purple-950">
                          <Clock className="w-3.5 h-3.5 text-purple-700" />
                          <span>{formatTime12(p.startTime)} - {formatTime12(p.endTime)}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-purple-950">{p.subject}</h4>
                        <div className="text-xs text-purple-800 flex items-center gap-2 mt-1">
                          {p.code && <span className="font-mono font-bold">{p.code}</span>}
                          {p.room && <span>• {p.room}</span>}
                          {p.instructor && <span>• {p.instructor}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-black/5">
                        <button
                          type="button"
                          onClick={() => toggleAttendance(p.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-purple-950 cursor-pointer"
                        >
                          {p.attendedToday ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Circle className="w-4 h-4 text-purple-400" />
                          )}
                          <span>{p.attendedToday ? 'Attended Today' : 'Mark Attendance'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicatePeriod(p)}
                            className="p-1.5 rounded-lg text-purple-700 hover:bg-white/80"
                            title="Duplicate period"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-purple-700 hover:bg-white/80"
                            title="Edit period"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePeriod(p.id, p.subject)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-white/80"
                            title="Delete period"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* EVENING NEXT-DAY CONFIRMATION MODAL & CHECKLIST */}
      {isEveningConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-200 relative max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xl font-bold shadow-xs border border-indigo-200">
                  🌙
                </div>
                <div>
                  <h3 className="text-lg font-bold font-classic text-purple-950">
                    Evening Check: Tomorrow's Schedule
                  </h3>
                  <p className="text-xs text-purple-700 font-medium">
                    Tomorrow is <strong>{tomorrowDay}</strong> ({tomorrowDateStr})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEveningConfirmationOpen(false)}
                className="p-1.5 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Checklist */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200/90 text-xs text-purple-900 flex items-center justify-between">
                <span>Select which periods you want active reminders for tomorrow:</span>
                <button
                  type="button"
                  onClick={() => setIsAddPeriodForTomorrowOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs hover:bg-purple-800"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Tomorrow Class</span>
                </button>
              </div>

              {/* Tomorrow Periods Checklist */}
              <div className="space-y-2.5">
                {tomorrowAllPeriods.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-purple-200 text-xs text-purple-600">
                    No classes scheduled for tomorrow ({tomorrowDay}). Enjoy your break or click "+ Add Tomorrow Class" above if you have a special lecture!
                  </div>
                ) : (
                  tomorrowAllPeriods.map(p => {
                    const isRemindActive = tomorrowReminderMap[p.id] !== false;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isRemindActive
                            ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Checkbox & Period details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isRemindActive}
                            onChange={() => handleToggleTomorrowPeriodReminder(p.id)}
                            className="w-4 h-4 rounded text-purple-700 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-purple-950 truncate">
                                {p.subject}
                              </span>
                              <span className="text-[10px] bg-purple-200/80 text-purple-900 px-1.5 py-0.2 rounded font-mono">
                                {p.periodNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-purple-700 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{formatTime12(p.startTime)} - {formatTime12(p.endTime)}</span>
                              {p.room && <span>• {p.room}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Skip / Remove from tomorrow button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTomorrowPeriod(p.id)}
                          title="Skip or remove this class from tomorrow's reminders"
                          className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Skip</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Extra Period for Tomorrow Popup Form */}
              {isAddPeriodForTomorrowOpen && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Add Extra / Makeup Period for Tomorrow</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddPeriodForTomorrowOpen(false)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">Subject</label>
                      <input
                        type="text"
                        value={newTomorrowSubject}
                        onChange={(e) => setNewTomorrowSubject(e.target.value)}
                        placeholder="e.g. Extra Physics Tutorial"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">Room / Link</label>
                      <input
                        type="text"
                        value={newTomorrowRoom}
                        onChange={(e) => setNewTomorrowRoom(e.target.value)}
                        placeholder="Room 102"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={newTomorrowTime}
                        onChange={(e) => setNewTomorrowTime(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={newTomorrowEndTime}
                        onChange={(e) => setNewTomorrowEndTime(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-200 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPeriodForTomorrow}
                    className="w-full py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs"
                  >
                    Add to Tomorrow's List
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-purple-100 pt-3 mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEveningConfirmationOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 rounded-xl"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleConfirmTomorrowSchedule}
                className="px-5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Confirm Tomorrow's Reminders</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD / IMPORT TIMETABLE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-200 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl font-bold border border-purple-200">
                  📥
                </div>
                <div>
                  <h3 className="text-lg font-bold font-classic text-purple-950">
                    Upload / Import Weekly Timetable
                  </h3>
                  <p className="text-xs text-purple-700 font-medium">
                    Upload a file, paste structured text, or load a preset schedule
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-purple-100/80 rounded-2xl border border-purple-200 mb-3">
              <button
                type="button"
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  uploadTab === 'file' ? 'bg-purple-800 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                📁 Upload CSV/JSON
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('paste')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  uploadTab === 'paste' ? 'bg-purple-800 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                📋 Paste Schedule
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('templates')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  uploadTab === 'templates' ? 'bg-purple-800 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-200/60'
                }`}
              >
                ⚡ 1-Click Templates
              </button>
            </div>

            {/* Tab Body */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {fileError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* TAB 1: FILE UPLOAD */}
              {uploadTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer bg-purple-50/40 hover:bg-purple-50/80 transition-all space-y-2"
                  >
                    <Upload className="w-8 h-8 text-purple-600 mx-auto" />
                    <p className="text-xs font-bold text-purple-950">Click to select or drag and drop timetable file</p>
                    <p className="text-[11px] text-purple-600">Supports .json or .csv timetable exports</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv,text/csv,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200/80 text-[11px] text-purple-800 space-y-1">
                    <p className="font-bold">Supported CSV Column Format:</p>
                    <p className="font-mono text-[10px] text-purple-950">Day, Period, Subject, Code, StartTime, EndTime, Room, Instructor</p>
                    <p className="italic text-purple-600">Example: Monday, Period 1, Calculus II, MATH 201, 09:00, 10:15, Hall 3, Prof. Smith</p>
                  </div>
                </div>
              )}

              {/* TAB 2: PASTE */}
              {uploadTab === 'paste' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-purple-950">
                    Paste CSV or JSON Timetable Text:
                  </label>
                  <textarea
                    rows={7}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder={`Day, Period, Subject, Code, StartTime, EndTime, Room, Instructor\nMonday, Period 1, Data Structures, CS 301, 09:00, 10:15, Room 204, Prof. Anderson\nTuesday, Period 2, Linear Algebra, MATH 202, 10:30, 11:45, Hall B, Dr. Clark`}
                    className="w-full p-3 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-mono focus:ring-2 focus:ring-purple-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => processTimetableImport(pasteContent, pasteContent.trim().startsWith('[') ? 'json' : 'csv')}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Parse and Apply Timetable
                  </button>
                </div>
              )}

              {/* TAB 3: 1-CLICK TEMPLATES */}
              {uploadTab === 'templates' && (
                <div className="space-y-3">
                  <p className="text-xs text-purple-800">
                    Quickly load a pre-built full schedule to kickstart your weekly timetable:
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl border border-purple-200 bg-purple-50/70 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-purple-950">Engineering & Tech Schedule (5-Day)</h4>
                        <p className="text-[11px] text-purple-700">OS, Algorithms, Cybersecurity, Web Systems (Mon–Fri)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePeriods(PRESET_SCHEDULES.cs_5day as any);
                          setWorkDaysMode(5);
                          setIsUploadModalOpen(false);
                          if (soundEnabled) playSuccessChime();
                          onToast('Template Applied', 'Loaded 5-Day Engineering schedule template.', 'success');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        Load 5-Day
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl border border-purple-200 bg-purple-50/70 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-purple-950">Comprehensive College Schedule (6-Day)</h4>
                        <p className="text-[11px] text-purple-700">Math, Physics, Chemistry, English + Saturday Seminars (Mon–Sat)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePeriods(PRESET_SCHEDULES.college_6day as any);
                          setWorkDaysMode(6);
                          setIsUploadModalOpen(false);
                          if (soundEnabled) playSuccessChime();
                          onToast('Template Applied', 'Loaded 6-Day Comprehensive College schedule template.', 'success');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        Load 6-Day
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-purple-100 pt-3 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PERIOD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-purple-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <h3 className="text-base sm:text-lg font-bold font-classic text-purple-950">
                  {editingPeriodId ? 'Edit Class Period' : 'Add Class Period to Timetable'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-purple-400 hover:text-purple-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">Period Name / Slot</label>
                  <input
                    type="text"
                    value={formPeriodNumber}
                    onChange={(e) => setFormPeriodNumber(e.target.value)}
                    placeholder="e.g. Period 1, Slot A"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">Subject Title *</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Data Structures"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">Select Scheduled Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeDaysList.map(day => {
                    const isSelected = formDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleFormDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                            : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="Hall B - Rm 204"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">Instructor</label>
                  <input
                    type="text"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    placeholder="Prof. Anderson"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">Color Theme</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormColor(theme.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${theme.bg} ${theme.border} ${theme.text} ${
                        formColor === theme.id ? `ring-2 ${theme.ring} scale-105` : 'opacity-70'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {editingPeriodId ? 'Save Period Changes' : 'Add Period to Timetable'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-purple-100 text-purple-900 rounded-xl text-xs font-semibold"
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
