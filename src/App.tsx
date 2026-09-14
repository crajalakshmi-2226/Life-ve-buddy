/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { NotificationBanner } from './components/NotificationBanner';
import { TodaySection } from './components/TodaySection';
import { ClassScheduleTracker, DEFAULT_CLASS_PERIODS } from './components/ClassScheduleTracker';
import { ExamScheduleTracker } from './components/ExamScheduleTracker';
import { HolidayReminderTracker } from './components/HolidayReminderTracker';
import { LabTracker } from './components/LabTracker';
import { ProjectTracker } from './components/ProjectTracker';
import { HabitsSection } from './components/HabitsSection';
import { ComplaintsBox } from './components/ComplaintsBox';
import { FocusTimerModal } from './components/FocusTimerModal';
import { BodyStretchRelief } from './components/BodyStretchRelief';
import { AndroidFrame } from './components/AndroidFrame';
import { AIAlertSystemContainer } from './components/AIAlertSystem/AIAlertSystemContainer';
import { BirthdayModal } from './components/BirthdayModal';
import { HistoryPage } from './components/HistoryPage';
import { InstitutionAttendanceTracker } from './components/InstitutionAttendanceTracker';
import { 
  TodayData, 
  LabData, 
  ProjectData, 
  Habit, 
  DailyQuote, 
  ClassPeriod, 
  ExamItem, 
  HolidayItem,
  StudentAcademicProfile, 
  AlertNotificationItem, 
  ActionRecommendation,
  BirthdayData,
  InstitutionAttendanceConfig,
  HistoryRecordItem
} from './types';
import { fetchDailyQuote } from './utils/quotes';
import { getTodayDateString, DEFAULT_EXAMS, getExamCountdown, DEFAULT_HOLIDAYS, getHolidayCountdown } from './utils/helpers';
import { 
  DEFAULT_STUDENT_PROFILE, 
  evaluateStudentRisk, 
  generatePersonalizedAlerts, 
  generateActionRecommendations,
  recomputeOverallAttendance
} from './utils/aiRiskEngine';
import { playSuccessChime } from './utils/audio';
import { Check, Info, ShieldCheck, Sparkles, ArrowLeft, Palmtree, History, Cake } from 'lucide-react';

const DEFAULT_HABITS: Habit[] = [
  { id: 1, name: "Drink 2L Water", category: "Health", streak: 3, doneToday: false, isCustom: false },
  { id: 2, name: "1 Hour Deep Study", category: "Study", streak: 5, doneToday: false, isCustom: false },
  { id: 3, name: "Desk Stretch & Body Relief", category: "Health", streak: 4, doneToday: false, isCustom: false },
  { id: 4, name: "Review Lab / Class Notes", category: "Study", streak: 2, doneToday: false, isCustom: false },
  { id: 5, name: "One Photo a Day", category: "Personal", streak: 12, doneToday: false, isCustom: false }
];

interface ToastMessage {
  id: number;
  title: string;
  body: string;
  type: 'info' | 'success' | 'alert';
}

export default function App() {
  const scheduleSectionRef = useRef<HTMLDivElement>(null);
  const examSectionRef = useRef<HTMLDivElement>(null);
  const holidaySectionRef = useRef<HTMLDivElement>(null);
  const aiAlertSectionRef = useRef<HTMLDivElement>(null);

  // State Initialization
  const [quote, setQuote] = useState<DailyQuote>({
    quote: "Excellence is not an act, but a habit. Small daily rituals shape extraordinary intellect.",
    author: "Aristotle",
    timestamp: Date.now()
  });
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [todayData, setTodayData] = useState<TodayData>(() => {
    const saved = localStorage.getItem("todayData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          userName: parsed.userName || "Alex",
          ...parsed
        };
      } catch (e) { console.warn(e); }
    }
    return {
      userName: "Alex",
      focusWord: "Persistence",
      mood: "Calm",
      smallWin: "",
      lastActiveDate: getTodayDateString()
    };
  });

  // AI-Based Alert System State
  const [studentProfile, setStudentProfile] = useState<StudentAcademicProfile>(() => {
    const saved = localStorage.getItem("studentProfileData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STUDENT_PROFILE,
          ...parsed
        };
      } catch (e) { console.warn(e); }
    }
    return DEFAULT_STUDENT_PROFILE;
  });

  const [studentAlerts, setStudentAlerts] = useState<AlertNotificationItem[]>(() => {
    const saved = localStorage.getItem("studentAlertsData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return generatePersonalizedAlerts(DEFAULT_STUDENT_PROFILE);
  });

  const [studentRecommendations, setStudentRecommendations] = useState<ActionRecommendation[]>(() => {
    const saved = localStorage.getItem("studentRecommendationsData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return generateActionRecommendations(DEFAULT_STUDENT_PROFILE);
  });

  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>(() => {
    const saved = localStorage.getItem("classPeriods");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return DEFAULT_CLASS_PERIODS;
  });

  const [exams, setExams] = useState<ExamItem[]>(() => {
    const saved = localStorage.getItem("examsData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return DEFAULT_EXAMS;
  });

  const [holidays, setHolidays] = useState<HolidayItem[]>(() => {
    const saved = localStorage.getItem("holidaysData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return DEFAULT_HOLIDAYS;
  });

  const [holidayReminderThreshold, setHolidayReminderThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("holidayReminderThreshold");
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num)) return num;
    }
    return 30; // Default: Remind holidays coming in 30 days
  });

  const [labData, setLabData] = useState<LabData>(() => {
    const saved = localStorage.getItem("labData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return {
      hasLab: "yes",
      labDay: "Monday",
      labTime: "09:00",
      labName: "Physics / Computer Engineering Lab",
      labLocation: "Science Block B - Room 204",
      equipment: [
        { id: '1', name: 'Lab Coat 🥼', checked: true },
        { id: '2', name: 'Safety Goggles 👓', checked: false },
        { id: '3', name: 'Lab Manual / Notebook 📓', checked: true },
        { id: '4', name: 'Scientific Calculator 🧮', checked: false }
      ]
    };
  });

  const [projectData, setProjectData] = useState<ProjectData>(() => {
    const saved = localStorage.getItem("projectData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    const deadlineStr = defaultDeadline.toISOString().split("T")[0];
    return {
      projectName: "Semester Capstone Project",
      deadlineDate: deadlineStr,
      tasks: [
        { id: 1, text: "Literature Review & Problem Statement", done: true },
        { id: 2, text: "System Architecture Design", done: false },
        { id: 3, text: "Implementation & Core Modules", done: false },
        { id: 4, text: "Final Report & Presentation Slides", done: false }
      ]
    };
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("habitsData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return DEFAULT_HABITS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("soundEnabled") !== "false";
  });

  const [isAndroidView, setIsAndroidView] = useState<boolean>(false);
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [isStretchOpen, setIsStretchOpen] = useState<boolean>(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'holidays' | 'history'>('dashboard');

  const [birthdayData, setBirthdayData] = useState<BirthdayData>(() => {
    const saved = localStorage.getItem("birthdayData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return {
      birthdayDate: "",
      userName: "Alex",
      wishesEnabled: true,
      reminderTiming: { value: 1, unit: 'days' },
      customWishNote: "Wishing you an extraordinary year of learning, breakthrough achievements, and joy! 🎂🎉"
    };
  });

  const [attendanceConfig, setAttendanceConfig] = useState<InstitutionAttendanceConfig>(() => {
    const saved = localStorage.getItem("attendanceConfig");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return {
      institutionType: 'college',
      institutionName: "Engineering & Science Institute",
      workingDaysMode: 'total',
      daysPerWeek: 5,
      workingDaysPerMonth: 22,
      totalWorkingDays: 90,
      conductedDays: 45,
      attendedDays: 39,
      leaveDays: 6,
      attendancePercentage: 86.7,
      checkInLogs: []
    };
  });

  const [historyRecords, setHistoryRecords] = useState<HistoryRecordItem[]>(() => {
    const saved = localStorage.getItem("historyRecords");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return [
      {
        id: "hist_1",
        category: "Assignments",
        title: "Literature Review & Problem Statement",
        date: getTodayDateString(),
        status: "Completed",
        details: "Finalized references and problem formulation with faculty advisor.",
        timestamp: Date.now() - 86400000 * 2
      },
      {
        id: "hist_2",
        category: "Attendance & Leaves",
        title: "Daily Attendance Check-in",
        date: getTodayDateString(),
        status: "Present",
        details: "Attended full working day classes. Maintained >85% attendance.",
        timestamp: Date.now() - 86400000
      },
      {
        id: "hist_3",
        category: "Habits",
        title: "1 Hour Deep Study",
        date: getTodayDateString(),
        status: "Done",
        details: "Completed 5-day study consistency streak.",
        timestamp: Date.now() - 86400000 * 3
      }
    ];
  });

  const [notifPermission, setNotifPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [notifDismissed, setNotifDismissed] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Log a record into centralized history
  const logHistoryRecord = useCallback((title: string, category: HistoryRecordItem['category'], status: string, details?: string) => {
    const newItem: HistoryRecordItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      title,
      date: getTodayDateString(),
      status,
      details,
      timestamp: Date.now()
    };
    setHistoryRecords(prev => [newItem, ...prev]);
  }, []);

  // Show in-app toast
  const showToast = useCallback((title: string, body: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, body, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Smooth scroll to AI Alert System section
  const scrollToAlerts = () => {
    if (aiAlertSectionRef.current) {
      aiAlertSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Smooth scroll to Class Schedule section
  const scrollToSchedule = () => {
    if (scheduleSectionRef.current) {
      scheduleSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Smooth scroll to Exam Schedule section
  const scrollToExams = () => {
    if (examSectionRef.current) {
      examSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Smooth scroll to Holiday Reminders section
  const scrollToHolidays = () => {
    if (holidaySectionRef.current) {
      holidaySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Sync Student Profile changes with AI Risk Engine & Local Storage
  const handleUpdateStudentProfile = (partial: Partial<StudentAcademicProfile>) => {
    setStudentProfile(prev => {
      const merged: StudentAcademicProfile = { ...prev, ...partial };
      
      // If subjects were updated, dynamically recompute overall aggregate attendance %
      if (partial.subjects && partial.subjects.length > 0) {
        merged.overallAttendance = recomputeOverallAttendance(merged.subjects);
      }

      // Recalculate risk evaluation
      const evalRes = evaluateStudentRisk(merged);
      merged.riskScore = evalRes.riskScore;
      merged.riskLevel = evalRes.riskLevel;
      if (!partial.subjects && evalRes.overallAttendance !== undefined) {
        merged.overallAttendance = evalRes.overallAttendance;
      }

      // Regenerate alerts and recommendations
      const newAlerts = generatePersonalizedAlerts(merged);
      const newRecs = generateActionRecommendations(merged);
      setStudentAlerts(newAlerts);
      setStudentRecommendations(newRecs);

      return merged;
    });
  };

  // Sync User Name with Student Academic Profile
  useEffect(() => {
    if (todayData.userName && todayData.userName !== studentProfile.studentName) {
      setStudentProfile(prev => ({ ...prev, studentName: todayData.userName }));
    }
  }, [todayData.userName]);

  // Persist AI Alert System state
  useEffect(() => {
    localStorage.setItem("studentProfileData", JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem("studentAlertsData", JSON.stringify(studentAlerts));
  }, [studentAlerts]);

  useEffect(() => {
    localStorage.setItem("studentRecommendationsData", JSON.stringify(studentRecommendations));
  }, [studentRecommendations]);

  // Check and perform midnight reset
  useEffect(() => {
    const currentToday = getTodayDateString();
    const lastActiveDate = todayData.lastActiveDate || currentToday;

    if (lastActiveDate !== currentToday) {
      setHabits(prevHabits =>
        prevHabits.map(h => ({
          ...h,
          streak: h.doneToday ? h.streak : 0,
          doneToday: false
        }))
      );
      setClassPeriods(prevPeriods =>
        prevPeriods.map(p => ({
          ...p,
          attendedToday: false
        }))
      );
      setTodayData(prev => ({
        ...prev,
        focusWord: "",
        smallWin: "",
        lastActiveDate: currentToday
      }));
    }
  }, [todayData.lastActiveDate]);

  // Load Daily Quote
  useEffect(() => {
    setLoadingQuote(true);
    fetchDailyQuote(false)
      .then(q => setQuote(q))
      .catch(console.error)
      .finally(() => setLoadingQuote(false));
  }, []);

  // Check notification permission support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission('unsupported');
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("todayData", JSON.stringify(todayData));
  }, [todayData]);

  useEffect(() => {
    localStorage.setItem("classPeriods", JSON.stringify(classPeriods));
  }, [classPeriods]);

  useEffect(() => {
    localStorage.setItem("examsData", JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem("holidaysData", JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem("holidayReminderThreshold", String(holidayReminderThreshold));
  }, [holidayReminderThreshold]);

  useEffect(() => {
    localStorage.setItem("labData", JSON.stringify(labData));
  }, [labData]);

  useEffect(() => {
    localStorage.setItem("projectData", JSON.stringify(projectData));
  }, [projectData]);

  useEffect(() => {
    localStorage.setItem("habitsData", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("soundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("birthdayData", JSON.stringify(birthdayData));
  }, [birthdayData]);

  useEffect(() => {
    localStorage.setItem("attendanceConfig", JSON.stringify(attendanceConfig));
  }, [attendanceConfig]);

  useEffect(() => {
    localStorage.setItem("historyRecords", JSON.stringify(historyRecords));
  }, [historyRecords]);

  // Refresh quote handler
  const handleRefreshQuote = () => {
    setLoadingQuote(true);
    fetchDailyQuote(true)
      .then(q => {
        setQuote(q);
        showToast("💡 Inspiration Refreshed", `"${q.quote.slice(0, 45)}..."`, "info");
      })
      .catch(console.error)
      .finally(() => setLoadingQuote(false));
  };

  // Request browser notification
  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          showToast("🔔 Reminders Enabled!", "You will receive timely alerts for class periods, lab sessions and project milestones.", "success");
          if (soundEnabled) playSuccessChime();
          new Notification("✨ LifeBuddy Active", {
            body: "Study, Class & Lab Reminders are now configured!",
            icon: "✨"
          });
        }
      } catch (e) {
        console.warn("Notification permission error", e);
      }
    } else {
      showToast("🔔 Reminders Enabled (In-App)", "In-app banner notifications are active.", "info");
    }
  };

  const handleTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification("🧪 Class & Lab Alert Test", {
        body: "Your next period is coming up soon. Check your timetable!",
        icon: "📅"
      });
    }
    showToast("📅 Timetable Alert", "Class schedule reminder test sent successfully!", "info");
  };

  // Habit toggling
  const handleToggleHabit = (id: number | string) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id === id) {
          const willBeDone = !h.doneToday;
          return {
            ...h,
            doneToday: willBeDone,
            streak: willBeDone ? h.streak + 1 : Math.max(0, h.streak - 1)
          };
        }
        return h;
      })
    );
  };

  // Add custom habit
  const handleAddHabit = (name: string, category: 'Health' | 'Study' | 'Personal' | 'Mindset') => {
    const newHabit: Habit = {
      id: Date.now(),
      name,
      category,
      streak: 0,
      doneToday: false,
      isCustom: true
    };
    setHabits(prev => [...prev, newHabit]);
    showToast("✨ Habit Added", `Added "${name}" to ${category} habits`, "success");
  };

  // Delete habit
  const handleDeleteHabit = (id: number | string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Total habit streak for header
  const totalStreak = habits.reduce((acc, h) => acc + (h.streak > 0 ? h.streak : 0), 0);

  // Upcoming exams count for header badge
  const upcomingExamsCount = exams.filter(e => {
    const countdown = getExamCountdown(e);
    return !countdown.isPast || countdown.isToday;
  }).length;

  // Upcoming holidays count for header badge
  const upcomingHolidaysCount = holidays.filter(h => {
    const countdown = getHolidayCountdown(h);
    return !countdown.isPast || countdown.isToday || countdown.isOngoing;
  }).length;

  // Unread & critical alerts count for header & badges
  const unreadAlertsCount = studentAlerts.filter(a => !a.isRead).length;
  const criticalAlertsCount = studentAlerts.filter(a => a.priority === 'Emergency' || a.priority === 'High' || a.riskLevel === 'Critical').length;

  return (
    <AndroidFrame isAndroidView={isAndroidView}>
      <div className="min-h-screen bg-[#faf5ff] text-slate-900 pb-16">
        {/* Floating Header */}
        <Header
          userName={todayData.userName || 'Alex'}
          onUpdateUserName={(name) => setTodayData(prev => ({ ...prev, userName: name }))}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isAndroidView={isAndroidView}
          onToggleAndroidView={() => setIsAndroidView(!isAndroidView)}
          onOpenTimer={() => setIsTimerOpen(true)}
          onOpenStretchRelief={() => setIsStretchOpen(true)}
          onOpenSchedule={scrollToSchedule}
          onOpenExams={scrollToExams}
          onOpenAlerts={scrollToAlerts}
          onOpenHolidays={() => setActiveTab('holidays')}
          onOpenBirthday={() => setIsBirthdayModalOpen(true)}
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          upcomingExamsCount={upcomingExamsCount}
          upcomingHolidaysCount={upcomingHolidaysCount}
          unreadAlertsCount={unreadAlertsCount}
          criticalAlertsCount={criticalAlertsCount}
          riskLevel={studentProfile.riskLevel}
          totalStreak={totalStreak}
        />

        {/* Browser Notification Banner */}
        <NotificationBanner
          permission={notifPermission}
          dismissed={notifDismissed}
          onRequestPermission={handleRequestNotification}
          onDismiss={() => setNotifDismissed(true)}
          soundEnabled={soundEnabled}
          onSendTestNotification={handleTestNotification}
        />

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
          {/* TAB 1: DEDICATED HOLIDAY PAGE */}
          {activeTab === 'holidays' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-2xl border border-purple-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-purple-700" />
                  <span>Back to Dashboard</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-950 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs flex items-center gap-1.5">
                    <Palmtree className="w-4 h-4 text-amber-700" />
                    <span className="hidden sm:inline">Dedicated</span> Holiday Hub
                  </span>
                </div>
              </div>

              <div ref={holidaySectionRef}>
                <HolidayReminderTracker
                  holidays={holidays}
                  onUpdateHolidays={setHolidays}
                  reminderThresholdDays={holidayReminderThreshold}
                  onUpdateReminderThreshold={setHolidayReminderThreshold}
                  soundEnabled={soundEnabled}
                  onToast={showToast}
                />
              </div>
            </div>
          )}

          {/* TAB 2: DEDICATED CENTRALIZED HISTORY PAGE */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-2xl border border-purple-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-purple-700" />
                  <span>Back to Dashboard</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-950 bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300 shadow-2xs flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-700" />
                    <span className="hidden sm:inline">Centralized</span> Past Records & History
                  </span>
                </div>
              </div>

              <HistoryPage
                records={historyRecords}
                onClearHistory={() => {
                  setHistoryRecords([]);
                  showToast("History Cleared", "All logged records have been reset.", "info");
                }}
                onToast={showToast}
              />
            </div>
          )}

          {/* TAB 3: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* SECTION 1: Today Section */}
              <TodaySection
                quote={quote}
                loadingQuote={loadingQuote}
                onRefreshQuote={handleRefreshQuote}
                todayData={todayData}
                onUpdateTodayData={(partial) => setTodayData(prev => ({ ...prev, ...partial }))}
                labData={labData}
                projectData={projectData}
                classPeriods={classPeriods}
                exams={exams}
                holidays={holidays}
                soundEnabled={soundEnabled}
                onOpenStretchRelief={() => setIsStretchOpen(true)}
                onOpenClassSchedule={scrollToSchedule}
                onOpenExamSchedule={scrollToExams}
                onOpenAlerts={scrollToAlerts}
                onOpenHolidays={() => setActiveTab('holidays')}
                criticalAlertsCount={criticalAlertsCount}
              />

              {/* SECTION 2: Institutional Attendance Tracker (Days Can Change By User & Daily Prompt) */}
              <InstitutionAttendanceTracker
                config={attendanceConfig}
                onUpdateConfig={(newCfg) => {
                  setAttendanceConfig(newCfg);
                  handleUpdateStudentProfile({ overallAttendance: newCfg.attendancePercentage });
                }}
                soundEnabled={soundEnabled}
                onToast={showToast}
                onLogHistoryRecord={logHistoryRecord}
              />

              {/* SECTION 3: AI-BASED ALERT SYSTEM (Continuous Data Monitoring, Risk Detection & Simulator) */}
              <div ref={aiAlertSectionRef}>
                <AIAlertSystemContainer
                  profile={studentProfile}
                  alerts={studentAlerts}
                  recommendations={studentRecommendations}
                  onUpdateProfile={handleUpdateStudentProfile}
                  onUpdateAlerts={setStudentAlerts}
                  onUpdateRecommendations={setStudentRecommendations}
                  soundEnabled={soundEnabled}
                  onToast={showToast}
                />
              </div>

              {/* SECTION 4: Exam Schedule & Daily Countdown Tracker */}
              <div ref={examSectionRef}>
                <ExamScheduleTracker
                  exams={exams}
                  onUpdateExams={setExams}
                  soundEnabled={soundEnabled}
                  onToast={showToast}
                />
              </div>

              {/* SECTION 5: Custom Class Time Periods & Schedule */}
              <div ref={scheduleSectionRef}>
                <ClassScheduleTracker
                  periods={classPeriods}
                  onUpdatePeriods={setClassPeriods}
                  soundEnabled={soundEnabled}
                  onToast={showToast}
                />
              </div>

              {/* SECTION 6: Lab & Project Tracker */}
              <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-5">
                <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200">
                      🧪
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                        Academic Trackers & Milestones
                      </h2>
                      <p className="text-xs text-purple-700/80 font-medium">
                        Manage lab preparations, safety equipment, and major semester deliverables
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Sub-card 1: Lab Reminder */}
                  <LabTracker
                    labData={labData}
                    onUpdateLabData={setLabData}
                    soundEnabled={soundEnabled}
                    onOpenStretchRelief={() => setIsStretchOpen(true)}
                  />

                  {/* Sub-card 2: Project Tracker */}
                  <ProjectTracker
                    projectData={projectData}
                    onUpdateProjectData={setProjectData}
                    soundEnabled={soundEnabled}
                    onToast={showToast}
                    onSetSmallWin={(win) => setTodayData(prev => ({ ...prev, smallWin: win }))}
                    onLogHistory={(title, cat, stat, det) => logHistoryRecord(title, cat, stat, det)}
                  />
                </div>
              </section>

              {/* SECTION 7: Daily Habits & Streaks (with 7-day Recharts Line Chart) */}
              <HabitsSection
                habits={habits}
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
                soundEnabled={soundEnabled}
                onOpenStretchRelief={() => setIsStretchOpen(true)}
              />

              {/* SECTION 8: Complaints & Issues Box (Private / Owner-Only Access) */}
              <ComplaintsBox
                soundEnabled={soundEnabled}
                onToast={showToast}
              />
            </>
          )}

          {/* Footer Note */}
          <footer className="text-center pt-4 pb-8 text-xs text-purple-400 space-y-1">
            <p className="flex items-center justify-center gap-1.5 font-medium">
              <span>✨</span>
              <span className="font-bold text-purple-900 font-classic">LifeBuddy Companion</span>
              <span>— Crafted for focused student discipline, custom class schedules & physical well-being</span>
            </p>
            <p className="text-[11px] text-purple-600/70">
              Encrypted Local Storage • Custom Class Time Periods • 7-Day Visual Analytics • Android WebView PWA
            </p>
          </footer>
        </main>

        {/* Focus Timer Modal */}
        <FocusTimerModal
          isOpen={isTimerOpen}
          onClose={() => setIsTimerOpen(false)}
          soundEnabled={soundEnabled}
          onOpenStretchRelief={() => {
            setIsTimerOpen(false);
            setIsStretchOpen(true);
          }}
        />

        {/* Interactive Body Stretch & Relief Guide Modal */}
        <BodyStretchRelief
          isOpen={isStretchOpen}
          onClose={() => setIsStretchOpen(false)}
          soundEnabled={soundEnabled}
        />

        {/* Birthday Celebrations & Reminder Modal */}
        <BirthdayModal
          isOpen={isBirthdayModalOpen}
          onClose={() => setIsBirthdayModalOpen(false)}
          birthdayData={birthdayData}
          userName={todayData.userName || 'Alex'}
          onSaveBirthday={(newBday) => {
            setBirthdayData(newBday);
            logHistoryRecord(`Birthday Reminder Configured: ${newBday.birthdayDate}`, 'Habits', 'Configured', `Remind advance: ${newBday.reminderTiming.value} ${newBday.reminderTiming.unit}`);
          }}
          soundEnabled={soundEnabled}
          onToast={showToast}
        />

        {/* Floating Toast Notification Center */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-2xl shadow-xl border text-xs pointer-events-auto flex items-start gap-2.5 transition-all transform animate-fadeIn ${
                toast.type === 'alert'
                  ? 'bg-purple-950 text-white border-purple-800'
                  : toast.type === 'success'
                  ? 'bg-purple-900 text-white border-purple-700'
                  : 'bg-indigo-950 text-purple-100 border-purple-800'
              }`}
            >
              <div className="mt-0.5">
                {toast.type === 'alert' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                ) : toast.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Info className="w-4 h-4 text-purple-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white leading-tight font-classic">{toast.title}</div>
                <div className="text-purple-200 mt-0.5 text-[11px] leading-relaxed">{toast.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AndroidFrame>
  );
}

