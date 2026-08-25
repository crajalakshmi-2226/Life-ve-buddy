import React, { useState } from 'react';
import { 
  GraduationCap, 
  Clock, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Target, 
  SlidersHorizontal, 
  X,
  FileCheck,
  ChevronDown,
  ChevronUp,
  History,
  Timer
} from 'lucide-react';
import { ExamItem, ExamType, ExamChecklistItem } from '../types';
import { 
  formatExamDate, 
  formatTime12, 
  getExamCountdown, 
  DEFAULT_EXAMS,
  generateDateOffset 
} from '../utils/helpers';
import { playSuccessChime, playAlertChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ExamScheduleTrackerProps {
  exams: ExamItem[];
  onUpdateExams: (exams: ExamItem[]) => void;
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

const EXAM_TYPES: ExamType[] = [
  'Midterm',
  'Final Exam',
  'Quiz',
  'Unit Test',
  'Practical / Lab',
  'Oral / Viva',
  'Other'
];

export const ExamScheduleTracker: React.FC<ExamScheduleTrackerProps> = ({
  exams,
  onUpdateExams,
  soundEnabled,
  onToast
}) => {
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form Fields
  const [formSubject, setFormSubject] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDate, setFormDate] = useState(generateDateOffset(3));
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formType, setFormType] = useState<ExamType>('Midterm');
  const [formRoom, setFormRoom] = useState('');
  const [formSeat, setFormSeat] = useState('');
  const [formSyllabus, setFormSyllabus] = useState('');
  const [formTargetScore, setFormTargetScore] = useState('90%+');
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Standard'>('High');
  const [formColor, setFormColor] = useState<ExamItem['colorTheme']>('purple');
  const [formNotes, setFormNotes] = useState('');
  const [formChecklist, setFormChecklist] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // Sorted exam counts
  const upcomingExams = exams
    .filter(e => {
      const countdown = getExamCountdown(e);
      return !countdown.isPast || countdown.isToday;
    })
    .sort((a, b) => a.examDate.localeCompare(b.examDate));

  const pastExams = exams
    .filter(e => {
      const countdown = getExamCountdown(e);
      return countdown.isPast && !countdown.isToday;
    })
    .sort((a, b) => b.examDate.localeCompare(a.examDate)); // most recent past first

  const todayExams = exams.filter(e => getExamCountdown(e).isToday);

  // Filtered displayed list
  let displayedExams: ExamItem[] = [];
  if (filterTab === 'UPCOMING') {
    displayedExams = upcomingExams;
  } else if (filterTab === 'PAST') {
    displayedExams = pastExams;
  } else {
    displayedExams = [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate));
  }

  if (selectedTypeFilter !== 'ALL') {
    displayedExams = displayedExams.filter(e => e.examType === selectedTypeFilter);
  }

  const openAddModal = (initialOffset: number = 3) => {
    setEditingExamId(null);
    setFormSubject('');
    setFormCode('');
    setFormDate(generateDateOffset(initialOffset));
    setFormStartTime('09:00');
    setFormEndTime('12:00');
    setFormType('Midterm');
    setFormRoom('');
    setFormSeat('');
    setFormSyllabus('');
    setFormTargetScore('90%+');
    setFormPriority('High');
    setFormColor('purple');
    setFormNotes('');
    setFormChecklist([
      { id: `c_${Date.now()}_1`, title: 'Revise main theory formulas & concepts', done: false },
      { id: `c_${Date.now()}_2`, title: 'Solve 2 previous year question papers', done: false }
    ]);
    setNewChecklistInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (exam: ExamItem) => {
    setEditingExamId(exam.id);
    setFormSubject(exam.subject);
    setFormCode(exam.code || '');
    setFormDate(exam.examDate);
    setFormStartTime(exam.startTime);
    setFormEndTime(exam.endTime || '');
    setFormType(exam.examType);
    setFormRoom(exam.room || '');
    setFormSeat(exam.seatNumber || '');
    setFormSyllabus(exam.syllabus || '');
    setFormTargetScore(exam.targetScore || '');
    setFormPriority(exam.priority || 'Standard');
    setFormColor(exam.colorTheme || 'purple');
    setFormNotes(exam.notes || '');
    setFormChecklist(exam.checklist || []);
    setNewChecklistInput('');
    setIsModalOpen(true);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistInput.trim()) return;
    setFormChecklist([
      ...formChecklist,
      {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newChecklistInput.trim(),
        done: false
      }
    ]);
    setNewChecklistInput('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklist(formChecklist.filter(item => item.id !== id));
  };

  const handleToggleChecklistItem = (examId: string, itemId: string) => {
    const updated = exams.map(exam => {
      if (exam.id === examId && exam.checklist) {
        const updatedChecklist = exam.checklist.map(item =>
          item.id === itemId ? { ...item, done: !item.done } : item
        );
        return { ...exam, checklist: updatedChecklist };
      }
      return exam;
    });
    onUpdateExams(updated);
    if (soundEnabled) playSuccessChime();
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      onToast("Subject Required", "Please enter an exam subject name.", "alert");
      return;
    }
    if (!formDate) {
      onToast("Date Required", "Please choose an exam date.", "alert");
      return;
    }

    if (editingExamId) {
      const updated = exams.map(exam => {
        if (exam.id === editingExamId) {
          return {
            ...exam,
            subject: formSubject.trim(),
            code: formCode.trim(),
            examDate: formDate,
            startTime: formStartTime,
            endTime: formEndTime,
            examType: formType,
            room: formRoom.trim(),
            seatNumber: formSeat.trim(),
            syllabus: formSyllabus.trim(),
            targetScore: formTargetScore.trim(),
            priority: formPriority,
            colorTheme: formColor,
            notes: formNotes.trim(),
            checklist: formChecklist
          };
        }
        return exam;
      });
      onUpdateExams(updated);
      onToast("Exam Schedule Updated", `Updated ${formSubject} (${formType})`, "success");
    } else {
      const newExam: ExamItem = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subject: formSubject.trim(),
        code: formCode.trim(),
        examDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        examType: formType,
        room: formRoom.trim(),
        seatNumber: formSeat.trim(),
        syllabus: formSyllabus.trim(),
        targetScore: formTargetScore.trim(),
        priority: formPriority,
        colorTheme: formColor,
        completed: false,
        notes: formNotes.trim(),
        checklist: formChecklist
      };
      onUpdateExams([...exams, newExam]);
      onToast("Exam Scheduled", `Scheduled ${formSubject} on ${formatExamDate(formDate)}`, "success");
    }

    if (soundEnabled) playSuccessChime();
    setIsModalOpen(false);
  };

  const handleDeleteExam = (id: string, subject: string) => {
    onUpdateExams(exams.filter(e => e.id !== id));
    onToast("Exam Removed", `Removed ${subject} from exam schedule`, "info");
  };

  const handleDuplicateExam = (exam: ExamItem) => {
    const duplicated: ExamItem = {
      ...exam,
      id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subject: `${exam.subject} (Copy)`,
      completed: false
    };
    onUpdateExams([...exams, duplicated]);
    onToast("Exam Duplicated", `Created copy of ${exam.subject}`, "success");
    if (soundEnabled) playSuccessChime();
  };

  const toggleExamCompleted = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    const willBeCompleted = !exam?.completed;
    const updated = exams.map(e => e.id === examId ? { ...e, completed: willBeCompleted } : e);
    onUpdateExams(updated);

    if (willBeCompleted) {
      if (soundEnabled) playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.debug(e);
      }
      onToast("Exam Completed 🎓", `Congratulations on completing ${exam?.subject}!`, "success");
    }
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                Exam Schedule & Countdown
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                {upcomingExams.length} Upcoming
              </span>
            </div>
            <p className="text-xs text-purple-700/80 font-medium">
              Track days to come (In X days / Tomorrow / Today) and past exam history (...days ago)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal(3)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Exam</span>
          </button>
        </div>
      </div>

      {/* Hero Exam Countdown Banner */}
      {upcomingExams.length > 0 ? (
        (() => {
          const nextExam = upcomingExams[0];
          const countdown = getExamCountdown(nextExam);
          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-white shadow-md border border-purple-800/60 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      <Timer className="w-3 h-3 text-purple-300" />
                      NEXT UPCOMING EXAM
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-800/90 text-purple-200 border border-purple-600/50">
                      {nextExam.examType}
                    </span>
                    {nextExam.code && (
                      <span className="text-xs font-mono font-semibold text-purple-300">
                        [{nextExam.code}]
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-xl font-bold font-classic text-purple-50">
                    {nextExam.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {formatExamDate(nextExam.examDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {formatTime12(nextExam.startTime)} {nextExam.endTime ? `– ${formatTime12(nextExam.endTime)}` : ''}
                    </span>
                    {nextExam.room && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          {nextExam.room}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Prominent Relative Days Pill */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-purple-800/60 pt-3 md:pt-0 md:pl-6">
                  <span className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                    Countdown Status
                  </span>
                  <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight flex items-center gap-1.5">
                    <span>{countdown.countdownBadge}</span>
                  </div>
                  <span className="text-[11px] text-purple-300/90 italic">
                    {countdown.relativeText}
                  </span>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between text-xs text-purple-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">No upcoming exams scheduled right now! Great time for deep revisions.</span>
          </div>
          <button
            type="button"
            onClick={() => openAddModal(3)}
            className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition-colors shadow-2xs"
          >
            + Add Exam
          </button>
        </div>
      )}

      {/* Filter Tabs: Upcoming (Days to come), Past (Days ago), All */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Main Time Range Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterTab('UPCOMING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'UPCOMING'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/70'
              }`}
            >
              <span>⏳ Upcoming (Days to come)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === 'UPCOMING' ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {upcomingExams.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('PAST')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'PAST'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/70'
              }`}
            >
              <span>⏮️ Past & Done (...days ago)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === 'PAST' ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {pastExams.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'ALL'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/70'
              }`}
            >
              <span>All Exam Records</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === 'ALL' ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {exams.length}
              </span>
            </button>
          </div>

          {/* Exam Type Selector Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-purple-700 font-medium">Type:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-purple-950 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">All Types</option>
              {EXAM_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="space-y-3.5">
        {displayedExams.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-purple-50/50 border border-dashed border-purple-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mx-auto">
              📝
            </div>
            <div>
              <h4 className="text-sm font-bold font-classic text-purple-950">
                No exams found in this view
              </h4>
              <p className="text-xs text-purple-700/80 mt-0.5">
                {filterTab === 'UPCOMING'
                  ? 'You have no upcoming tests or exams on the schedule.'
                  : 'No past exam history found in this category.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddModal(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Exam</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedExams.map(exam => {
              const countdown = getExamCountdown(exam);
              const theme = COLOR_THEMES.find(t => t.id === exam.colorTheme) || COLOR_THEMES[0];
              const isExpanded = expandedExamId === exam.id;

              const totalChecklist = exam.checklist?.length || 0;
              const completedChecklist = exam.checklist?.filter(c => c.done).length || 0;
              const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

              return (
                <div
                  key={exam.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all ${theme.bg} ${theme.border} hover:shadow-xs flex flex-col justify-between space-y-3.5 group`}
                >
                  {/* Top Bar: Relative Countdown Tag & Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* High-visibility Relative Days Badge */}
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-2xs ${countdown.badgeStyle.bg} ${countdown.badgeStyle.text} border ${countdown.badgeStyle.border}`}>
                        {countdown.countdownBadge}
                      </span>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${theme.badge}`}>
                        {exam.examType}
                      </span>

                      {exam.priority === 'High' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                          🔥 High Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleDuplicateExam(exam)}
                        className="p-1.5 rounded-lg text-purple-700 hover:text-purple-950 hover:bg-white/60 transition-colors"
                        title="Duplicate Exam"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(exam)}
                        className="p-1.5 rounded-lg text-purple-700 hover:text-purple-950 hover:bg-white/60 transition-colors"
                        title="Edit Exam"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id, exam.subject)}
                        className="p-1.5 rounded-lg text-purple-400 hover:text-rose-600 hover:bg-white/60 transition-colors"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Content: Subject, Code, Date, Time & Venue */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold font-classic text-purple-950 leading-tight">
                          {exam.subject}
                        </h3>
                        {exam.code && (
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white/70 text-purple-900 border border-purple-200/60">
                            {exam.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-purple-700 font-semibold mt-0.5">
                        {countdown.relativeText}
                      </p>
                    </div>

                    {/* Date & Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-purple-900 bg-white/50 p-2 rounded-xl border border-purple-200/50">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span>{formatExamDate(exam.examDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span>{formatTime12(exam.startTime)} {exam.endTime ? `– ${formatTime12(exam.endTime)}` : ''}</span>
                      </div>
                    </div>

                    {/* Room & Seat info */}
                    {(exam.room || exam.seatNumber || exam.targetScore) && (
                      <div className="flex flex-wrap gap-2 text-[11px] text-purple-800">
                        {exam.room && (
                          <span className="flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-lg border border-purple-200/50">
                            <MapPin className="w-3 h-3 text-purple-500" />
                            <span>{exam.room}</span>
                          </span>
                        )}
                        {exam.seatNumber && (
                          <span className="bg-white/60 px-2 py-0.5 rounded-lg border border-purple-200/50 font-mono">
                            🪑 {exam.seatNumber}
                          </span>
                        )}
                        {exam.targetScore && (
                          <span className="flex items-center gap-1 bg-purple-100/90 text-purple-900 px-2 py-0.5 rounded-lg font-bold">
                            <Target className="w-3 h-3 text-purple-600" />
                            <span>Target: {exam.targetScore}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Syllabus preview */}
                    {exam.syllabus && (
                      <div className="text-xs text-purple-900/90 bg-white/40 p-2 rounded-xl border border-purple-200/40">
                        <span className="font-bold text-purple-950">📚 Syllabus: </span>
                        <span>{exam.syllabus}</span>
                      </div>
                    )}

                    {/* Revision Checklist Mini Tracker */}
                    {totalChecklist > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-purple-900 font-semibold">
                          <span>Revision Topics ({completedChecklist}/{totalChecklist})</span>
                          <button
                            type="button"
                            onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                            className="text-purple-700 hover:text-purple-950 flex items-center gap-0.5 font-bold cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Review Checklist'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden border border-purple-200">
                          <div
                            className="h-full bg-purple-700 rounded-full transition-all duration-300"
                            style={{ width: `${checklistPercent}%` }}
                          />
                        </div>

                        {/* Expandable Checklist Items */}
                        {isExpanded && (
                          <div className="space-y-1 pt-1 bg-white/70 p-2.5 rounded-xl border border-purple-200/70 animate-fadeIn">
                            {exam.checklist?.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleChecklistItem(exam.id, item.id)}
                                className="w-full flex items-start gap-2 text-left text-xs p-1 rounded-lg hover:bg-purple-100/60 transition-colors cursor-pointer"
                              >
                                {item.done ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-purple-700 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                                )}
                                <span className={item.done ? 'line-through text-purple-600/70 font-normal' : 'text-purple-950 font-medium'}>
                                  {item.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {exam.notes && (
                      <p className="text-[11px] text-purple-700 italic bg-white/50 p-1.5 rounded-lg border border-purple-200/50">
                        💡 {exam.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Exam Completed Status Button */}
                  <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-purple-700 font-semibold">
                      {countdown.isPast ? 'Past Exam Record' : 'Scheduled Assessment'}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleExamCompleted(exam.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        exam.completed
                          ? 'bg-purple-800 text-white shadow-xs'
                          : 'bg-white/90 hover:bg-white text-purple-900 border border-purple-300 hover:border-purple-400'
                      }`}
                    >
                      {exam.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-200" />
                          <span>Completed 🎓</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-purple-400" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preset Helper Bar */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-purple-900 font-medium">
          <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span>Exam Schedule Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              onUpdateExams(DEFAULT_EXAMS);
              onToast("Exam Schedule Loaded", "Loaded 4 Standard University Exams with countdowns & revision topics", "success");
              if (soundEnabled) playSuccessChime();
            }}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-100 text-purple-950 font-bold border border-purple-200 transition-colors shadow-2xs"
          >
            Load Sample Exams (Midterm, Finals, Quiz)
          </button>
          <button
            type="button"
            onClick={() => openAddModal(2)}
            className="px-2.5 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-2xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Custom Exam</span>
          </button>
        </div>
      </div>

      {/* Customizable Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-200 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
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
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-classic text-purple-950 leading-tight">
                  {editingExamId ? 'Edit Exam Details' : 'Schedule New Exam / Test'}
                </h3>
                <p className="text-xs text-purple-700/80">
                  Set exam date, start time, syllabus topics & preparation checklist
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              {/* Subject & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Exam Subject / Course *
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

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Course Code
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

              {/* Date, Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Exam Date *</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>

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
                    <span>End Time</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Exam Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Exam Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ExamType)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  >
                    {EXAM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Priority / Importance
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="High">🔥 High Priority</option>
                    <option value="Medium">⚡ Medium Priority</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* Room, Seat & Target Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>Hall / Room</span>
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. Hall B - Room 204"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Seat / Roll No.
                  </label>
                  <input
                    type="text"
                    value={formSeat}
                    onChange={(e) => setFormSeat(e.target.value)}
                    placeholder="e.g. Seat #34"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-purple-600" />
                    <span>Target Score</span>
                  </label>
                  <input
                    type="text"
                    value={formTargetScore}
                    onChange={(e) => setFormTargetScore(e.target.value)}
                    placeholder="e.g. 90%+, Grade A"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Syllabus */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Syllabus / Topics Covered
                </label>
                <input
                  type="text"
                  value={formSyllabus}
                  onChange={(e) => setFormSyllabus(e.target.value)}
                  placeholder="e.g. Binary Trees, Graphs, Dynamic Programming"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-medium text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Revision Checklist Builder */}
              <div className="space-y-2 bg-purple-50/40 p-3 rounded-2xl border border-purple-200/60">
                <label className="block text-xs font-bold text-purple-950">
                  Revision Checklist Items
                </label>

                {formChecklist.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {formChecklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-xl border border-purple-100">
                        <span className="text-purple-950 truncate">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newChecklistInput}
                    onChange={(e) => setNewChecklistInput(e.target.value)}
                    placeholder="Add topic / paper to revise..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs text-purple-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Add
                  </button>
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
                  Notes & Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Bring scientific calculator & admit card"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs font-medium text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-purple-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {editingExamId ? 'Save Exam Changes' : 'Schedule Exam'}
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
