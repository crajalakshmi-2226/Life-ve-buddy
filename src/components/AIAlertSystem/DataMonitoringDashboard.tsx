import React, { useState } from 'react';
import { 
  Database, 
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  UserCheck, 
  GraduationCap,
  Edit3,
  Trash2,
  Sliders,
  RotateCcw,
  Check,
  X,
  History,
  Calculator,
  Shield,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { 
  StudentAcademicProfile, 
  StudentDeadlineItem, 
  SubjectAttendanceRecord, 
  DateWiseAttendanceEntry,
  AlertCategory, 
  AlertPriority 
} from '../../types';
import { 
  calculateClassesToRecover, 
  recomputeSubjectRecord, 
  recomputeOverallAttendance, 
  INITIAL_STUDENT_PROFILE 
} from '../../utils/aiRiskEngine';

interface DataMonitoringDashboardProps {
  profile: StudentAcademicProfile;
  onUpdateSubjects: (subjects: SubjectAttendanceRecord[]) => void;
  onUpdateDeadlines: (deadlines: StudentDeadlineItem[]) => void;
  onUpdateAttendanceLogs?: (logs: DateWiseAttendanceEntry[]) => void;
  onUpdateFullProfile?: (partial: Partial<StudentAcademicProfile>) => void;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const DataMonitoringDashboard: React.FC<DataMonitoringDashboardProps> = ({
  profile,
  onUpdateSubjects,
  onUpdateDeadlines,
  onUpdateAttendanceLogs,
  onUpdateFullProfile,
  onToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'date_logs' | 'bunk_planner' | 'deadlines' | 'analytics'>('attendance');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectAttendanceRecord | null>(null);

  // New Subject Form State
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubInstructor, setNewSubInstructor] = useState('');
  const [newSubAttended, setNewSubAttended] = useState<number>(20);
  const [newSubTotal, setNewSubTotal] = useState<number>(25);
  const [newSubTargetPct, setNewSubTargetPct] = useState<number>(75);

  // Edit Subject Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editInstructor, setEditInstructor] = useState('');
  const [editAttended, setEditAttended] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editTargetPct, setEditTargetPct] = useState<number>(75);

  // Date-Wise Log Form State
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [logSubjectId, setLogSubjectId] = useState<string>(() => profile.subjects[0]?.id || '');
  const [logStatus, setLogStatus] = useState<DateWiseAttendanceEntry['status']>('Present');
  const [logNote, setLogNote] = useState<string>('');

  // Bunk Planner State
  const [plannerSubjectId, setPlannerSubjectId] = useState<string>(() => profile.subjects[0]?.id || '');
  const [plannerMissDays, setPlannerMissDays] = useState<number>(2);
  const [plannerAttendDays, setPlannerAttendDays] = useState<number>(5);

  // New Deadline Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newCategory, setNewCategory] = useState<AlertCategory>('Academic');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<AlertPriority>('High');
  const [newDesc, setNewDesc] = useState('');

  // Default sample logs if empty
  const attendanceLogs: DateWiseAttendanceEntry[] = profile.attendanceLogs || [
    {
      id: "log-1",
      subjectId: "sub-1",
      subjectName: "Data Structures & Algorithms",
      subjectCode: "CS301",
      date: "2026-08-24",
      status: "Present",
      note: "Attended binary search trees lecture",
      timestamp: Date.now() - 86400000
    },
    {
      id: "log-2",
      subjectId: "sub-5",
      subjectName: "Digital Signal Processing",
      subjectCode: "CS305",
      date: "2026-08-23",
      status: "Absent",
      note: "Missed FFT frequency spectrum tutorial",
      timestamp: Date.now() - 172800000
    },
    {
      id: "log-3",
      subjectId: "sub-2",
      subjectName: "Operating Systems & Kernel Dev",
      subjectCode: "CS302",
      date: "2026-08-22",
      status: "Present",
      note: "Semaphore synchronization lab",
      timestamp: Date.now() - 259200000
    }
  ];

  // Aggregate stats across all subjects
  const totalAttendedClasses = profile.subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
  const totalConductedClasses = profile.subjects.reduce((sum, s) => sum + s.totalClasses, 0);
  const totalMissedClasses = Math.max(0, totalConductedClasses - totalAttendedClasses);
  const aggregatePct = totalConductedClasses > 0 
    ? Number(((totalAttendedClasses / totalConductedClasses) * 100).toFixed(1)) 
    : 100;
  const safeCount = profile.subjects.filter(s => s.status === 'Safe').length;
  const atRiskCount = profile.subjects.filter(s => s.status === 'Critical' || s.status === 'Warning').length;

  // 8-Week Historical Academic Risk Trend data
  const historicalRiskData = [
    { week: 'Wk 1', riskScore: 28, attendance: 92, safeCutoff: 35 },
    { week: 'Wk 2', riskScore: 32, attendance: 88, safeCutoff: 35 },
    { week: 'Wk 3', riskScore: 36, attendance: 85, safeCutoff: 35 },
    { week: 'Wk 4', riskScore: 48, attendance: 81, safeCutoff: 35 },
    { week: 'Wk 5', riskScore: 55, attendance: 78, safeCutoff: 35 },
    { week: 'Wk 6', riskScore: 68, attendance: 74, safeCutoff: 35 },
    { week: 'Wk 7', riskScore: 74, attendance: 73, safeCutoff: 35 },
    { week: 'Wk 8 (Now)', riskScore: profile.riskScore, attendance: aggregatePct, safeCutoff: 35 }
  ];

  // Subject Attendance Chart Data
  const subjectChartData = profile.subjects.map(s => ({
    name: s.code,
    fullName: s.subject,
    attendance: s.percentage,
    minCutoff: s.minRequiredPercent || 75,
    status: s.status
  }));

  // Direct Subject Attendance Steppers (User can increment/decrement attended days or total days)
  const handleModifyDays = (
    subId: string, 
    deltaAttended: number, 
    deltaTotal: number, 
    label: string
  ) => {
    const updated = profile.subjects.map(s => {
      if (s.id === subId) {
        const nextAttended = Math.max(0, s.attendedClasses + deltaAttended);
        const nextTotal = Math.max(nextAttended, s.totalClasses + deltaTotal);
        return recomputeSubjectRecord({
          ...s,
          attendedClasses: nextAttended,
          totalClasses: nextTotal,
          minRequiredPercent: s.minRequiredPercent
        });
      }
      return s;
    });

    onUpdateSubjects(updated);
    onToast("📊 Attendance Days Updated", `${label} for ${profile.subjects.find(s => s.id === subId)?.code || 'Subject'}`, "info");
  };

  // Open Edit Subject Modal
  const handleOpenEditModal = (sub: SubjectAttendanceRecord) => {
    setEditingSubject(sub);
    setEditTitle(sub.subject);
    setEditCode(sub.code);
    setEditInstructor(sub.instructor);
    setEditAttended(sub.attendedClasses);
    setEditTotal(sub.totalClasses);
    setEditTargetPct(sub.minRequiredPercent || 75);
  };

  // Save Subject Changes from Modal
  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    const updated = profile.subjects.map(s => {
      if (s.id === editingSubject.id) {
        return recomputeSubjectRecord({
          id: s.id,
          subject: editTitle.trim() || s.subject,
          code: editCode.trim().toUpperCase() || s.code,
          instructor: editInstructor.trim() || s.instructor,
          attendedClasses: Math.max(0, Number(editAttended)),
          totalClasses: Math.max(Number(editAttended), Number(editTotal)),
          minRequiredPercent: Number(editTargetPct) || 75
        });
      }
      return s;
    });

    onUpdateSubjects(updated);
    setEditingSubject(null);
    onToast("✅ Subject Attendance Saved", `Updated ${editCode || 'course'} attendance days.`, "success");
  };

  // Delete Subject
  const handleDeleteSubject = (subId: string) => {
    if (profile.subjects.length <= 1) {
      onToast("⚠️ Cannot Delete", "You must keep at least one subject in your profile.", "alert");
      return;
    }
    const updated = profile.subjects.filter(s => s.id !== subId);
    onUpdateSubjects(updated);
    setEditingSubject(null);
    onToast("🗑️ Subject Removed", "Deleted subject from tracking.", "info");
  };

  // Create New Subject
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTitle.trim() || !newSubCode.trim()) return;

    const newRecord = recomputeSubjectRecord({
      id: `sub-custom-${Date.now()}`,
      subject: newSubTitle.trim(),
      code: newSubCode.trim().toUpperCase(),
      instructor: newSubInstructor.trim() || "Faculty Instructor",
      attendedClasses: Math.max(0, Number(newSubAttended)),
      totalClasses: Math.max(Number(newSubAttended), Number(newSubTotal)),
      minRequiredPercent: Number(newSubTargetPct) || 75
    });

    onUpdateSubjects([...profile.subjects, newRecord]);
    setNewSubTitle('');
    setNewSubCode('');
    setNewSubInstructor('');
    setNewSubAttended(20);
    setNewSubTotal(25);
    setShowAddSubjectModal(false);
    onToast("✨ Subject Added", `Enrolled ${newRecord.code} in tracking list.`, "success");
  };

  // Reset to Default Sample Subjects
  const handleResetSubjects = () => {
    onUpdateSubjects(INITIAL_STUDENT_PROFILE.subjects);
    onToast("🔄 Restored Sample Subjects", "Reset to standard semester course catalogue.", "info");
  };

  // Date-Wise Attendance Logger Handler
  const handleLogDateAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSub = profile.subjects.find(s => s.id === logSubjectId);
    if (!targetSub) return;

    let deltaAttended = 0;
    let deltaTotal = 0;

    if (logStatus === 'Present') {
      deltaAttended = 1;
      deltaTotal = 1;
    } else if (logStatus === 'Absent') {
      deltaAttended = 0;
      deltaTotal = 1;
    } else if (logStatus === 'Duty Leave / Medical') {
      deltaAttended = 1;
      deltaTotal = 1;
    }
    // Cancelled = 0 change

    // Update subject counts
    if (deltaTotal > 0) {
      const updatedSubjects = profile.subjects.map(s => {
        if (s.id === logSubjectId) {
          return recomputeSubjectRecord({
            ...s,
            attendedClasses: s.attendedClasses + deltaAttended,
            totalClasses: s.totalClasses + deltaTotal,
            minRequiredPercent: s.minRequiredPercent
          });
        }
        return s;
      });
      onUpdateSubjects(updatedSubjects);
    }

    // Add new log entry
    const newEntry: DateWiseAttendanceEntry = {
      id: `log-${Date.now()}`,
      subjectId: targetSub.id,
      subjectName: targetSub.subject,
      subjectCode: targetSub.code,
      date: logDate,
      status: logStatus,
      note: logNote.trim() || undefined,
      timestamp: Date.now()
    };

    const nextLogs = [newEntry, ...attendanceLogs];
    if (onUpdateAttendanceLogs) {
      onUpdateAttendanceLogs(nextLogs);
    } else if (onUpdateFullProfile) {
      onUpdateFullProfile({ attendanceLogs: nextLogs });
    }

    setLogNote('');
    onToast("📅 Date Attendance Logged", `Marked ${logStatus} on ${logDate} for ${targetSub.code}.`, "success");
  };

  // Delete / Revert Date Log Entry
  const handleDeleteLogEntry = (logId: string) => {
    const entry = attendanceLogs.find(l => l.id === logId);
    if (!entry) return;

    // Intelligently revert subject days if needed
    if (entry.status === 'Present' || entry.status === 'Duty Leave / Medical') {
      const updated = profile.subjects.map(s => {
        if (s.id === entry.subjectId) {
          return recomputeSubjectRecord({
            ...s,
            attendedClasses: Math.max(0, s.attendedClasses - 1),
            totalClasses: Math.max(0, s.totalClasses - 1),
            minRequiredPercent: s.minRequiredPercent
          });
        }
        return s;
      });
      onUpdateSubjects(updated);
    } else if (entry.status === 'Absent') {
      const updated = profile.subjects.map(s => {
        if (s.id === entry.subjectId) {
          return recomputeSubjectRecord({
            ...s,
            attendedClasses: s.attendedClasses,
            totalClasses: Math.max(s.attendedClasses, s.totalClasses - 1),
            minRequiredPercent: s.minRequiredPercent
          });
        }
        return s;
      });
      onUpdateSubjects(updated);
    }

    const nextLogs = attendanceLogs.filter(l => l.id !== logId);
    if (onUpdateAttendanceLogs) {
      onUpdateAttendanceLogs(nextLogs);
    } else if (onUpdateFullProfile) {
      onUpdateFullProfile({ attendanceLogs: nextLogs });
    }

    onToast("↩️ Attendance Entry Reverted", "Adjusted subject days back.", "info");
  };

  // Toggle Deadline Completion
  const handleToggleDeadline = (id: string) => {
    const updated = profile.deadlines.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...d, status: nextStatus as any };
      }
      return d;
    });
    onUpdateDeadlines(updated);
    onToast("📌 Deadline Updated", "Task status synchronized.", "info");
  };

  // Add Custom Deadline
  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    const newItem: StudentDeadlineItem = {
      id: `dl-custom-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject,
      category: newCategory,
      dueDate: newDueDate,
      dueTime: "23:59",
      priority: newPriority,
      status: "Pending",
      description: newDesc
    };

    onUpdateDeadlines([newItem, ...profile.deadlines]);
    setNewTitle('');
    setNewDesc('');
    setShowAddDeadline(false);
    onToast("✨ Deadline Added", `Scheduled reminder for ${newItem.title}`, "success");
  };

  const filteredDeadlines = profile.deadlines.filter(d => {
    if (categoryFilter === 'All') return true;
    return d.category === categoryFilter;
  });

  // Selected Planner Subject Stats
  const selectedPlannerSub = profile.subjects.find(s => s.id === plannerSubjectId) || profile.subjects[0];
  
  // Safe bunk calculation: how many classes can a student miss before dropping below cutoff?
  const calculateSafeBunkAllowance = (attended: number, total: number, target: number = 75) => {
    if (total === 0) return 0;
    const ratio = target / 100;
    // attended / (total + y) >= ratio  =>  total + y <= attended / ratio  =>  y <= (attended / ratio) - total
    const maxTotal = attended / ratio;
    const maxBunk = Math.floor(maxTotal - total);
    return Math.max(0, maxBunk);
  };

  const safeBunkClasses = selectedPlannerSub 
    ? calculateSafeBunkAllowance(selectedPlannerSub.attendedClasses, selectedPlannerSub.totalClasses, selectedPlannerSub.minRequiredPercent || 75)
    : 0;

  // Forecast missing plannerMissDays
  const forecastMissPct = selectedPlannerSub
    ? Number(((selectedPlannerSub.attendedClasses / (selectedPlannerSub.totalClasses + plannerMissDays)) * 100).toFixed(1))
    : 0;

  // Forecast attending plannerAttendDays
  const forecastAttendPct = selectedPlannerSub
    ? Number((((selectedPlannerSub.attendedClasses + plannerAttendDays) / (selectedPlannerSub.totalClasses + plannerAttendDays)) * 100).toFixed(1))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200 shadow-sm space-y-5">
        
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-2xl border border-purple-200 shadow-2xs">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  Real-Time Attendance Engine
                </span>
                <span className="text-xs text-purple-600 font-semibold">User Editable Days & Records</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950 mt-0.5">
                Attendance Management & Academic Monitor
              </h2>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap bg-purple-50 p-1 rounded-2xl border border-purple-200 text-xs font-bold gap-1 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('attendance')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'attendance'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100/60'
              }`}
            >
              📚 Subject Days ({profile.subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('date_logs')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'date_logs'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100/60'
              }`}
            >
              📅 Date-Wise Logger
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('bunk_planner')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'bunk_planner'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100/60'
              }`}
            >
              🧮 Bunk & Recovery Planner
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('deadlines')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'deadlines'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100/60'
              }`}
            >
              📌 Deadlines ({profile.deadlines.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'analytics'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100/60'
              }`}
            >
              📈 Trends
            </button>
          </div>
        </div>

        {/* Global Attendance Stat Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500">Aggregate Attendance</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-extrabold ${aggregatePct < 75 ? 'text-rose-600' : 'text-purple-950'}`}>
                {aggregatePct}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">(Min: 75%)</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500">Days / Classes Attended</span>
            <div className="text-xl font-extrabold text-emerald-700">
              {totalAttendedClasses} <span className="text-xs text-slate-500 font-normal">Present</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500">Total Classes Conducted</span>
            <div className="text-xl font-extrabold text-purple-950">
              {totalConductedClasses} <span className="text-xs text-slate-500 font-normal">Held</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500">Absences / Leaves</span>
            <div className="text-xl font-extrabold text-rose-600">
              {totalMissedClasses} <span className="text-xs text-slate-500 font-normal">Missed</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SUBJECT ATTENDANCE (USER CAN EDIT/CHANGE DAYS)   */}
        {/* ======================================================== */}
        {activeSubTab === 'attendance' && (
          <div className="space-y-5">
            
            {/* Action Bar: Add Subject, Instructions & Quick Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 p-3 rounded-2xl border border-purple-200">
              <div className="text-xs text-purple-950 font-medium space-y-0.5">
                <span className="font-bold flex items-center gap-1.5 text-purple-900">
                  <Edit3 className="w-3.5 h-3.5" />
                  User-Editable Attendance Days:
                </span>
                <p className="text-[11px] text-slate-600">
                  Use the quick steppers (+1 / -1) or click <strong>“Edit Days & Details”</strong> to customize attended and total classes.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetSubjects}
                  title="Reset to default sample subjects"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.subjects.map((sub) => {
                const targetCutoff = sub.minRequiredPercent || 75;
                const isBelowCutoff = sub.percentage < targetCutoff;

                return (
                  <div
                    key={sub.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 shadow-2xs ${
                      sub.status === 'Critical'
                        ? 'bg-rose-50/80 border-rose-300'
                        : sub.status === 'Warning'
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-white border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Top Subject Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-extrabold tracking-wide">
                            {sub.code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Min: {targetCutoff}%
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-purple-950 mt-1 line-clamp-1">
                          {sub.subject}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">{sub.instructor}</p>
                      </div>

                      {/* Status Tag */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'Critical'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : sub.status === 'Warning'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                          : 'bg-emerald-600 text-white shadow-2xs'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    {/* Numerical Days Display & Progress Bar */}
                    <div className="space-y-1.5 bg-white/70 p-3 rounded-xl border border-purple-100">
                      <div className="flex justify-between items-baseline text-xs font-semibold">
                        <span className="text-slate-600">Attended / Total Days:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-extrabold text-sm text-purple-950">
                            {sub.attendedClasses} / {sub.totalClasses}
                          </span>
                          <span className={`text-xs font-extrabold ${isBelowCutoff ? 'text-rose-600' : 'text-emerald-700'}`}>
                            ({sub.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            sub.percentage < 65 ? 'bg-rose-500' : sub.percentage < targetCutoff ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        />
                        {/* 75% Cutoff Marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-700 z-10" 
                          style={{ left: `${targetCutoff}%` }}
                          title={`Target threshold: ${targetCutoff}%`}
                        />
                      </div>
                    </div>

                    {/* Debarment Calculation or Safe Buffer */}
                    {sub.classesNeededFor75 > 0 ? (
                      <div className="p-2.5 rounded-xl bg-rose-100/80 border border-rose-300 text-[11px] text-rose-900 font-semibold space-y-0.5">
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Debarment Warning</span>
                        </div>
                        <p>
                          Must attend <strong className="text-rose-950 underline">{sub.classesNeededFor75} consecutive classes</strong> to reach {targetCutoff}%.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Safe (≥ {targetCutoff}% Cutoff)</span>
                        </div>
                        <span className="text-[10px] text-emerald-900 font-semibold">
                          Buffer: +{calculateSafeBunkAllowance(sub.attendedClasses, sub.totalClasses, targetCutoff)} off
                        </span>
                      </div>
                    )}

                    {/* Quick Steppers: User can change attendance days directly */}
                    <div className="space-y-2 pt-1 border-t border-purple-100">
                      <div className="grid grid-cols-2 gap-2">
                        {/* +1 Present */}
                        <button
                          type="button"
                          onClick={() => handleModifyDays(sub.id, 1, 1, "+1 Day Present")}
                          className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                          <span>Present (+1)</span>
                        </button>

                        {/* +1 Absent */}
                        <button
                          type="button"
                          onClick={() => handleModifyDays(sub.id, 0, 1, "+1 Day Absent")}
                          className="py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <X className="w-3 h-3 text-rose-700" />
                          <span>Absent (+1)</span>
                        </button>
                      </div>

                      {/* Modal Open for Custom Days Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(sub)}
                        className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                        <span>Edit Days & Course Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DATE-WISE ATTENDANCE LOGGER                       */}
        {/* ======================================================== */}
        {activeSubTab === 'date_logs' && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 sm:p-5 rounded-2xl border border-purple-200 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-800" />
                <h3 className="text-xs sm:text-sm font-bold text-purple-950">
                  Log Attendance for a Specific Date
                </h3>
              </div>

              <form onSubmit={handleLogDateAttendance} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Date Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Date:</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl font-medium"
                    required
                  />
                </div>

                {/* Subject Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Select Subject:</label>
                  <select
                    value={logSubjectId}
                    onChange={(e) => setLogSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl font-medium"
                  >
                    {profile.subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.subject}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attendance Status */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Status:</label>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl font-medium"
                  >
                    <option value="Present">✅ Present (+1 Attended Day)</option>
                    <option value="Absent">❌ Absent (+1 Missed Day)</option>
                    <option value="Duty Leave / Medical">🏥 Duty Leave / Medical Exemption</option>
                    <option value="Cancelled">🚫 Class Cancelled / Holiday</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-slate-700 sm:invisible">Action:</label>
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    + Save Date Attendance
                  </button>
                </div>

                {/* Remarks / Note Input */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <input
                    type="text"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Optional remarks (e.g., 'Attended 2-hour lab workshop' or 'Submitted medical leave certificate')"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-xl"
                  />
                </div>
              </form>
            </div>

            {/* Attendance Timeline Records */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-purple-700" />
                  <span>Date-Wise Attendance History Log ({attendanceLogs.length} Records)</span>
                </h4>
                <span className="text-[10px] text-slate-500">
                  *Deleting an entry automatically restores previous day counts.
                </span>
              </div>

              <div className="divide-y divide-purple-100 bg-white border border-purple-200 rounded-2xl overflow-hidden shadow-2xs">
                {attendanceLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No custom date attendance logs recorded yet. Use the form above to log daily sessions.
                  </div>
                ) : (
                  attendanceLogs.map((log) => (
                    <div key={log.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-purple-50/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl text-xs font-bold mt-0.5 ${
                          log.status === 'Present' || log.status === 'Duty Leave / Medical'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : log.status === 'Absent'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.status === 'Present' ? '✓ Present' : log.status === 'Absent' ? '✕ Absent' : log.status}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded font-bold text-[10px]">
                              {log.subjectCode}
                            </span>
                            <span className="text-xs font-bold text-purple-950">
                              {log.subjectName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>📅 Date: <strong>{log.date}</strong></span>
                            {log.note && (
                              <>
                                <span>•</span>
                                <span className="italic text-slate-600">"{log.note}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLogEntry(log.id)}
                        title="Delete log and revert attendance days"
                        className="px-2.5 py-1 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        Undo / Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BUNK & RECOVERY PLANNER                           */}
        {/* ======================================================== */}
        {activeSubTab === 'bunk_planner' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-800" />
                    <h3 className="text-xs sm:text-sm font-bold text-purple-950">
                      Attendance What-If Calculator & Bunk Allowance
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Simulate how missing or attending upcoming days will impact your percentage and exam eligibility.
                  </p>
                </div>

                {/* Subject Dropdown */}
                <select
                  value={plannerSubjectId}
                  onChange={(e) => setPlannerSubjectId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-purple-300 rounded-xl text-purple-950"
                >
                  {profile.subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} ({s.percentage}%) - {s.subject}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlannerSub && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Card 1: Safe Bunk Allowance */}
                  <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Safe Bunk Allowance
                    </span>
                    <div className="text-2xl font-extrabold text-purple-900">
                      {safeBunkClasses} <span className="text-xs text-slate-500 font-normal">Classes / Days</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {safeBunkClasses > 0 
                        ? `You can take up to ${safeBunkClasses} leaves in ${selectedPlannerSub.code} before dropping below ${selectedPlannerSub.minRequiredPercent || 75}%.`
                        : `⚠️ No safe bunk allowance! You are already below ${selectedPlannerSub.minRequiredPercent || 75}% or on the exact edge.`
                      }
                    </p>
                  </div>

                  {/* Card 2: If you Miss Next X Days */}
                  <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                        If You Miss Next
                      </span>
                      <span className="text-xs font-bold text-rose-700">{plannerMissDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={plannerMissDays}
                      onChange={(e) => setPlannerMissDays(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Projected %:</span>
                      <span className="font-extrabold text-rose-600 text-sm">{forecastMissPct}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Attended {selectedPlannerSub.attendedClasses} / {selectedPlannerSub.totalClasses + plannerMissDays} classes
                    </div>
                  </div>

                  {/* Card 3: If you Attend Next Y Days */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        If You Attend Next
                      </span>
                      <span className="text-xs font-bold text-emerald-700">{plannerAttendDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={plannerAttendDays}
                      onChange={(e) => setPlannerAttendDays(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Projected %:</span>
                      <span className="font-extrabold text-emerald-600 text-sm">{forecastAttendPct}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Attended {selectedPlannerSub.attendedClasses + plannerAttendDays} / {selectedPlannerSub.totalClasses + plannerAttendDays} classes
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DEADLINE REMINDER SYSTEM                          */}
        {/* ======================================================== */}
        {activeSubTab === 'deadlines' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', 'Academic', 'Exam', 'Fee Payment', 'Project Review', 'College Event'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddDeadline(!showAddDeadline)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deadline</span>
              </button>
            </div>

            {/* Add Deadline Form */}
            {showAddDeadline && (
              <form onSubmit={handleCreateDeadline} className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                <h4 className="text-xs font-bold text-purple-950">Schedule New Student Milestone / Deadline</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Milestone title (e.g. OS Lab Report 4)"
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl"
                    required
                  />
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Subject / Department"
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl"
                    required
                  />
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AlertCategory)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl"
                  >
                    <option value="Academic">Academic / Assignment</option>
                    <option value="Exam">Examination</option>
                    <option value="Fee Payment">Fee Payment</option>
                    <option value="Project Review">Project Review</option>
                    <option value="College Event">College Event</option>
                  </select>

                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as AlertPriority)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 cursor-pointer"
                    >
                      Save Deadline
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddDeadline(false)}
                      className="px-3 py-2 bg-purple-100 text-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Deadlines List */}
            <div className="space-y-3">
              {filteredDeadlines.map((dl) => {
                const isCompleted = dl.status === 'Completed';

                return (
                  <div
                    key={dl.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isCompleted 
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-purple-200 hover:border-purple-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleDeadline(dl.id)}
                        className="mt-0.5 text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-purple-300 hover:border-purple-600 bg-purple-50" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs sm:text-sm font-bold ${isCompleted ? 'line-through text-slate-500' : 'text-purple-950'}`}>
                            {dl.title}
                          </h4>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            dl.priority === 'Emergency'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : dl.priority === 'High'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}>
                            {dl.priority}
                          </span>
                          <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {dl.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          {dl.description || `Subject: ${dl.subject}`}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-purple-900">
                            <Calendar className="w-3 h-3" />
                            Due: {dl.dueDate} {dl.dueTime && `(${dl.dueTime})`}
                          </span>
                          <span>•</span>
                          <span className="text-slate-600">{dl.subject}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleDeadline(dl.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
                      }`}
                    >
                      {isCompleted ? 'Done' : 'Mark Done'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: VISUAL TRENDS & RECHARTS                          */}
        {/* ======================================================== */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: 8-Week Risk Score Trajectory */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-purple-950">
                    8-Week Academic Risk Score Trend (0-100)
                  </h4>
                  <span className="text-[10px] text-rose-600 font-bold">Safe Cutoff &lt; 35</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalRiskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <ReferenceLine y={35} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Safe Limit', fill: '#10b981', fontSize: 10 }} />
                      <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                      <Line type="monotone" dataKey="riskScore" stroke="#7e22ce" strokeWidth={3} dot={{ r: 4 }} name="Risk Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500">
                  *Trajectory updates dynamically whenever you adjust subject attendance days or complete backlog items.
                </p>
              </div>

              {/* Chart 2: Subject Attendance vs 75% Cutoff */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-purple-950">
                    Subject Attendance vs Minimum Cutoff
                  </h4>
                  <span className="text-[10px] text-purple-700 font-bold">Cutoff = 75%</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <ReferenceLine y={75} stroke="#dc2626" strokeWidth={2} label={{ value: '75% Mandatory', fill: '#dc2626', fontSize: 10 }} />
                      <Bar dataKey="attendance" fill="#9333ea" radius={[6, 6, 0, 0]} name="Attendance %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500">
                  *Bar heights adjust immediately when you edit attended classes or log date sessions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDIT SUBJECT ATTENDANCE DAYS & DETAILS          */}
      {/* ======================================================== */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-purple-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  ✏️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-purple-950">
                    Edit Attendance Days: {editingSubject.code}
                  </h3>
                  <p className="text-xs text-slate-500">Modify attended classes and total held days</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Course Code:</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Target Min % Cutoff:</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={editTargetPct}
                    onChange={(e) => setEditTargetPct(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Subject Name:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Instructor / Faculty:</label>
                <input
                  type="text"
                  value={editInstructor}
                  onChange={(e) => setEditInstructor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-medium"
                />
              </div>

              {/* Attendance Days Stepper & Inputs */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
                <div>
                  <label className="text-[11px] font-extrabold text-emerald-900 block mb-1">
                    Attended Days (Present):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAttended}
                    onChange={(e) => setEditAttended(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-xl font-extrabold text-emerald-950"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-purple-900 block mb-1">
                    Total Classes Conducted:
                  </label>
                  <input
                    type="number"
                    min={Math.max(0, editAttended)}
                    value={editTotal}
                    onChange={(e) => setEditTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-purple-300 rounded-xl font-extrabold text-purple-950"
                    required
                  />
                </div>

                {/* Dynamic Calculated Summary */}
                <div className="col-span-2 text-xs font-semibold text-purple-950 pt-1 flex justify-between items-center border-t border-purple-200/60 mt-1">
                  <span>Calculated Attendance:</span>
                  <span className="text-sm font-extrabold text-purple-900">
                    {editTotal > 0 ? ((editAttended / editTotal) * 100).toFixed(1) : '100'}%
                  </span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(editingSubject.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Subject</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD NEW SUBJECT                                 */}
      {/* ======================================================== */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-purple-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  ➕
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-purple-950">
                    Add New Course / Subject
                  </h3>
                  <p className="text-xs text-slate-500">Track custom subject attendance and debarment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Course Code:</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="e.g. CS306"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Min % Cutoff:</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newSubTargetPct}
                    onChange={(e) => setNewSubTargetPct(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Course / Subject Name:</label>
                <input
                  type="text"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Instructor Name:</label>
                <input
                  type="text"
                  value={newSubInstructor}
                  onChange={(e) => setNewSubInstructor(e.target.value)}
                  placeholder="e.g. Prof. Emily Davis"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-purple-200 rounded-xl font-medium"
                />
              </div>

              {/* Initial Days Conducted */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
                <div>
                  <label className="text-[11px] font-extrabold text-emerald-900 block mb-1">
                    Initial Attended Days:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newSubAttended}
                    onChange={(e) => setNewSubAttended(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-xl font-extrabold text-emerald-950"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-purple-900 block mb-1">
                    Total Classes Held:
                  </label>
                  <input
                    type="number"
                    min={Math.max(0, newSubAttended)}
                    value={newSubTotal}
                    onChange={(e) => setNewSubTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-purple-300 rounded-xl font-extrabold text-purple-950"
                    required
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Enroll Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
