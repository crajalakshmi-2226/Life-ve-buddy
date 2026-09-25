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
import { BottomOptionsMenu } from './components/BottomOptionsMenu';
import { AndroidFrame } from './components/AndroidFrame';
import { BirthdayModal } from './components/BirthdayModal';
import { AddReminderModal } from './components/AddReminderModal';
import { HistoryPage } from './components/HistoryPage';
import { AboutMePage } from './components/AboutMePage';
import { InstitutionAttendanceTracker } from './components/InstitutionAttendanceTracker';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PushNotificationModal } from './components/PushNotificationModal';
import { subscribeToPushNotifications, triggerBackgroundPush } from './utils/pushManager';
import { 
  fetchServerReminders, 
  saveScheduledReminder, 
  deleteScheduledReminder, 
  toggleCompleteScheduledReminder, 
  syncAllWithServer 
} from './utils/reminderSync';
import { 
  TodayData, 
  LabData, 
  ProjectData, 
  Habit, 
  DailyQuote, 
  ClassPeriod, 
  ExamItem, 
  HolidayItem,
  BirthdayData,
  InstitutionAttendanceConfig,
  HistoryRecordItem,
  UserProfile,
  AppTheme,
  QuickReminder
} from './types';
import { fetchDailyQuote } from './utils/quotes';
import { getTodayDateString, DEFAULT_EXAMS, getExamCountdown, DEFAULT_HOLIDAYS, getHolidayCountdown, isBirthdayToday } from './utils/helpers';
import { sendSystemNotification } from './utils/notifications';
import { 
  applyThemeColorToDocument, 
  DEFAULT_THEME_COLOR 
} from './utils/themeHelper';
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
  const attendanceSectionRef = useRef<HTMLDivElement>(null);
  const habitsSectionRef = useRef<HTMLDivElement>(null);
  const complaintsSectionRef = useRef<HTMLDivElement>(null);
  const labsSectionRef = useRef<HTMLDivElement>(null);

  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // Clean up any deactivated alert states
  useEffect(() => {
    localStorage.removeItem("customStudentAlerts");
  }, []);

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'holidays' | 'history' | 'aboutme'>('dashboard');

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return {
      name: 'Alex',
      hobby: 'Reading & Coding',
      college: 'Engineering & Science Institute',
      email: 'alex.student@campus.edu',
      customFields: [],
      theme: 'purple'
    };
  });

  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('app_theme') as AppTheme) || 'purple';
  });

  const [customThemeColor, setCustomThemeColor] = useState<string>(() => {
    return localStorage.getItem('custom_theme_color') || DEFAULT_THEME_COLOR;
  });

  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<QuickReminder | null>(null);

  const [quickReminders, setQuickReminders] = useState<QuickReminder[]>(() => {
    const saved = localStorage.getItem("quickReminders");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    const todayStr = getTodayDateString();
    return [
      {
        id: "rem_sample_1",
        subject: "Review lecture notes & study plan",
        date: todayStr,
        time: "17:00",
        remindMeAt: `${todayStr}T16:30`,
        createdAt: Date.now() - 3600000,
        completed: false,
        notified: false
      }
    ];
  });

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

  // Dynamic Theme Color Application
  useEffect(() => {
    applyThemeColorToDocument(customThemeColor);
    localStorage.setItem('custom_theme_color', customThemeColor);
  }, [customThemeColor]);

  // Persist quick reminders locally and sync with server
  useEffect(() => {
    localStorage.setItem('quickReminders', JSON.stringify(quickReminders));
  }, [quickReminders]);

  // Load and sync reminders with server-side scheduler on mount
  useEffect(() => {
    fetchServerReminders().then(serverReminders => {
      if (serverReminders && serverReminders.length > 0) {
        setQuickReminders(prev => {
          const map = new Map<string, QuickReminder>();
          prev.forEach(r => map.set(r.id, r));
          serverReminders.forEach(r => {
            const existing = map.get(r.id);
            map.set(r.id, existing ? { ...existing, ...r } : r);
          });
          return Array.from(map.values());
        });
      } else {
        const saved = localStorage.getItem("quickReminders");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              syncAllWithServer(parsed).catch(() => {});
            }
          } catch (_e) {}
        }
      }
    }).catch(err => console.warn('Reminders fetch notice:', err));
  }, []);

  // In-app visual notification banner (only shows in-app toast if user is actively in the tab)
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      setQuickReminders(prevReminders => {
        let hasChanges = false;
        const updated = prevReminders.map(rem => {
          if (!rem.completed && !rem.notified && rem.remindMeAt) {
            const reminderTime = rem.scheduledTime || new Date(rem.remindMeAt).getTime();
            if (!isNaN(reminderTime) && reminderTime <= now) {
              hasChanges = true;
              if (document.visibilityState === 'visible') {
                showToast(`🔔 Reminder: ${rem.subject}`, `Scheduled for ${rem.date} at ${rem.time}`, 'alert');
                if (soundEnabled) playSuccessChime();
              }
              return { ...rem, notified: true };
            }
          }
          return rem;
        });
        return hasChanges ? updated : prevReminders;
      });
    };

    checkReminders();
    const timer = setInterval(checkReminders, 15000);
    return () => clearInterval(timer);
  }, [soundEnabled, showToast]);

  const handleSaveReminder = async (reminder: QuickReminder) => {
    // 1. Optimistic UI update
    setQuickReminders(prev => {
      const exists = prev.some(r => r.id === reminder.id);
      if (exists) {
        return prev.map(r => r.id === reminder.id ? reminder : r);
      }
      return [reminder, ...prev];
    });

    logHistoryRecord(
      `Reminder: ${reminder.subject}`,
      'Reminders',
      'Active',
      `Scheduled for ${reminder.date} at ${reminder.time} (Alert: ${reminder.remindMeAt.replace('T', ' ')})`
    );

    // 2. Ensure device is subscribed to Web Push so Android system panel wakes up
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        await subscribeToPushNotifications();
      } catch (_e) {}
    }

    // 3. Save to server-side persistent scheduler
    try {
      const res = await saveScheduledReminder(reminder);
      if (res.success && res.reminder) {
        setQuickReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, ...res.reminder } : r));
      }
    } catch (err) {
      console.warn('Server reminder scheduling notice:', err);
    }
  };

  const handleDeleteReminder = (id: string) => {
    const rem = quickReminders.find(r => r.id === id);
    setQuickReminders(prev => prev.filter(r => r.id !== id));
    deleteScheduledReminder(id).catch(e => console.warn(e));
    if (rem) {
      logHistoryRecord(`Reminder Removed: ${rem.subject}`, 'Reminders', 'Deleted');
    }
    showToast("Reminder Deleted", "Scheduled reminder removed from server.", "info");
  };

  const handleToggleReminderComplete = (id: string) => {
    setQuickReminders(prev => {
      return prev.map(r => {
        if (r.id === id) {
          const next = !r.completed;
          toggleCompleteScheduledReminder(id, next).catch(e => console.warn(e));
          if (next) {
            logHistoryRecord(
              `Reminder Done: ${r.subject}`,
              'Reminders',
              'Completed',
              `Completed on ${getTodayDateString()}`
            );
            showToast("Reminder Completed! 🎉", `Marked "${r.subject}" as done.`, "success");
          }
          return { ...r, completed: next };
        }
        return r;
      });
    });
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

  // Smooth scroll to Attendance section
  const scrollToAttendance = () => {
    setActiveTab('dashboard');
    setTimeout(() => {
      attendanceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Smooth scroll to Habits section
  const scrollToHabits = () => {
    setActiveTab('dashboard');
    setTimeout(() => {
      habitsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Smooth scroll to Complaints section
  const scrollToComplaints = () => {
    setActiveTab('dashboard');
    setTimeout(() => {
      complaintsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

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

  // Check notification permission support & sync push subscription
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        subscribeToPushNotifications().catch(() => {});
      }
    } else {
      setNotifPermission('unsupported');
    }
  }, []);

  // Deep linking and Service Worker notification click navigation
  const handleNavigateToDestination = useCallback((targetUrlOrSearch: string) => {
    if (!targetUrlOrSearch) return;

    let tabParam = '';
    try {
      if (targetUrlOrSearch.includes('?')) {
        const query = targetUrlOrSearch.split('?')[1];
        const params = new URLSearchParams(query);
        tabParam = params.get('tab') || '';
      } else if (targetUrlOrSearch.startsWith('/')) {
        tabParam = targetUrlOrSearch.replace('/', '').replace('?tab=', '');
      } else {
        tabParam = targetUrlOrSearch;
      }
    } catch (_e) {
      tabParam = targetUrlOrSearch;
    }

    if (!tabParam) return;

    // Full page views
    if (tabParam === 'holidays') {
      setActiveTab('holidays');
      return;
    }
    if (tabParam === 'history') {
      setActiveTab('history');
      return;
    }
    if (tabParam === 'aboutme') {
      setActiveTab('aboutme');
      return;
    }

    // Modals
    if (tabParam === 'reminders') {
      setIsReminderModalOpen(true);
      return;
    }
    if (tabParam === 'stretch') {
      setIsStretchOpen(true);
      return;
    }
    if (tabParam === 'timer') {
      setIsTimerOpen(true);
      return;
    }
    if (tabParam === 'birthday') {
      setIsBirthdayModalOpen(true);
      return;
    }

    // Dashboard sections
    setActiveTab('dashboard');
    setTimeout(() => {
      switch (tabParam) {
        case 'labs':
          labsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'schedule':
          scheduleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'exams':
          examSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'attendance':
          attendanceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'habits':
          habitsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'complaints':
          complaintsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
      }
    }, 150);
  }, []);

  // Listen for initial URL search query on app launch
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      handleNavigateToDestination(window.location.search);
    }
  }, [handleNavigateToDestination]);

  // Listen for Service Worker click navigation message
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_NAVIGATE') {
        handleNavigateToDestination(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener('message', onSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onSWMessage);
    };
  }, [handleNavigateToDestination]);

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

  useEffect(() => {
    localStorage.setItem("user_profile_data", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("app_theme", appTheme);
    document.documentElement.setAttribute('data-theme', appTheme);
    if (appTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appTheme]);

  // Real System Notification for Birthday (with deduplication per year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();

    // 1. User's personal birthday check
    if (birthdayData.birthdayDate && isBirthdayToday(birthdayData.birthdayDate)) {
      const bdayKey = `bday_system_notif_sent_${currentYear}_${birthdayData.birthdayDate}`;
      if (!localStorage.getItem(bdayKey)) {
        localStorage.setItem(bdayKey, 'sent');
        sendSystemNotification({
          title: `🎂 Happy Birthday, ${todayData.userName || userProfile.name || 'Alex'}! 🎉`,
          body: birthdayData.customWishNote || "Wishing you an extraordinary year of learning, breakthrough achievements, and joy!",
          tag: `birthday-${currentYear}`,
          requireInteraction: true
        });
      }
    }

    // 2. Extra birthdays check (friends, family, classmates)
    if (birthdayData.extraBirthdays && birthdayData.extraBirthdays.length > 0) {
      birthdayData.extraBirthdays.forEach(extra => {
        if (extra.birthdayDate && isBirthdayToday(extra.birthdayDate)) {
          const extraKey = `extra_bday_notif_${currentYear}_${extra.id}_${extra.birthdayDate}`;
          if (!localStorage.getItem(extraKey)) {
            localStorage.setItem(extraKey, 'sent');
            sendSystemNotification({
              title: `🎂 Today is ${extra.name}'s Birthday! 🎉`,
              body: extra.customWishNote 
                ? `Don't forget to wish ${extra.name} (${extra.relationship}): "${extra.customWishNote}"`
                : `Today is ${extra.name}'s (${extra.relationship}) special day! Send them your warmest wishes.`,
              tag: `extra-bday-${extra.id}-${currentYear}`,
              requireInteraction: true
            });
          }
        }
      });
    }
  }, [birthdayData, todayData.userName, userProfile.name]);

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

  // Request browser notification and subscribe to background Web Push
  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const subResult = await subscribeToPushNotifications();
        const perm = Notification.permission;
        setNotifPermission(perm);
        if (perm === 'granted') {
          showToast("🔔 Background Push Enabled!", "You will receive system-level alerts even when Chrome is in the background or closed.", "success");
          if (soundEnabled) playSuccessChime();
          sendSystemNotification({
            title: "✨ LifeBuddy Active",
            body: "Study, Class & Lab Reminders are now connected to Android push notifications!",
            icon: "/pwa-192x192.png",
            tag: "lifebuddy-active",
            data: { url: "/?tab=schedule" },
            soundEnabled: false
          });
        } else if (perm === 'denied') {
          showToast("⚠️ Permission Blocked", "Chrome blocked notifications. Tap 'Settings' on the banner for Android unblock steps.", "alert");
        }
      } catch (e: any) {
        console.warn("Notification permission error", e);
        showToast("Notice", e.message || "Permission error", "alert");
      }
    } else {
      showToast("🔔 Reminders Enabled (In-App)", "In-app banner notifications are active.", "info");
    }
  };

  const handleTestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      await sendSystemNotification({
        title: "🧪 Class & Lab Alert Test",
        body: "Your next period is coming up soon. Tap to view your timetable!",
        icon: "/pwa-192x192.png",
        tag: `timetable-test-${Date.now()}`,
        data: { url: "/?tab=schedule" },
        soundEnabled
      });
      showToast("📅 Timetable Alert", "Class schedule reminder dispatched to Android notification panel!", "info");
    } else {
      setIsPushModalOpen(true);
    }
  };

  const handleDelayedPush = async (seconds: number = 10) => {
    showToast(
      `⏳ Background Push Scheduled (${seconds}s)`,
      "CLOSE CHROME NOW or switch apps! The alert will ring in Android's notification drawer.",
      "info"
    );
    await triggerBackgroundPush({
      title: "🔔 LifeBuddy Background Alert",
      body: "Delivered while Chrome was in the background or closed!",
      url: "/?tab=labs",
      tag: `bg-alert-${Date.now()}`,
      delaySeconds: seconds
    });
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

  // Birthday indicators for header badge
  const hasBirthdayToday = (birthdayData.birthdayDate ? isBirthdayToday(birthdayData.birthdayDate) : false) ||
    (birthdayData.extraBirthdays ? birthdayData.extraBirthdays.some(b => isBirthdayToday(b.birthdayDate)) : false);
  const extraBirthdaysCount = birthdayData.extraBirthdays?.length || 0;

  const getThemeClass = (theme: AppTheme) => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-50/50 text-slate-900';
      case 'green':
        return 'bg-emerald-50/50 text-slate-900';
      case 'pink':
        return 'bg-pink-50/50 text-slate-900';
      case 'amber':
        return 'bg-amber-50/50 text-slate-900';
      case 'dark':
        return 'bg-slate-950 text-slate-100';
      case 'purple':
      default:
        return 'bg-[#faf5ff] text-slate-900';
    }
  };

  return (
    <AndroidFrame isAndroidView={isAndroidView}>
      <div className={`min-h-screen ${getThemeClass(appTheme)} pb-28 sm:pb-32 transition-colors duration-300`}>
        {/* Floating Header */}
        <Header
          userName={todayData.userName || userProfile.name || 'Alex'}
          onUpdateUserName={(name) => {
            setTodayData(prev => ({ ...prev, userName: name }));
            setUserProfile(prev => ({ ...prev, name }));
          }}
          onOpenAboutMe={() => setActiveTab('aboutme')}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isAndroidView={isAndroidView}
          onToggleAndroidView={() => setIsAndroidView(!isAndroidView)}
          onOpenTimer={() => setIsTimerOpen(true)}
          onOpenStretchRelief={() => setIsStretchOpen(true)}
          onOpenSchedule={scrollToSchedule}
          onOpenExams={scrollToExams}
          onOpenHolidays={() => setActiveTab('holidays')}
          onOpenBirthday={() => setIsBirthdayModalOpen(true)}
          hasBirthdayToday={hasBirthdayToday}
          extraBirthdaysCount={extraBirthdaysCount}
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          upcomingExamsCount={upcomingExamsCount}
          upcomingHolidaysCount={upcomingHolidaysCount}
          totalStreak={totalStreak}
          onOpenPushSettings={() => setIsPushModalOpen(true)}
        />

        {/* Browser Notification Banner */}
        <NotificationBanner
          permission={notifPermission}
          dismissed={notifDismissed}
          onRequestPermission={handleRequestNotification}
          onDismiss={() => setNotifDismissed(true)}
          soundEnabled={soundEnabled}
          onSendTestNotification={handleTestNotification}
          onOpenPushSettings={() => setIsPushModalOpen(true)}
          onSendDelayedTest={handleDelayedPush}
        />

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
          {/* TAB 0: ABOUT ME & THEME PROFILE PAGE */}
          {activeTab === 'aboutme' && (
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
                  <span className="text-xs font-bold text-purple-950 bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-300 shadow-2xs flex items-center gap-1.5">
                    👤 Profile & Theme Studio
                  </span>
                </div>
              </div>

              <AboutMePage
                profile={userProfile}
                onUpdateProfile={(updated) => {
                  setUserProfile(updated);
                  if (updated.name && updated.name !== todayData.userName) {
                    setTodayData(prev => ({ ...prev, userName: updated.name }));
                  }
                }}
                onClose={() => setActiveTab('dashboard')}
                soundEnabled={soundEnabled}
                onToast={showToast}
                onThemeChange={(newTheme) => {
                  setAppTheme(newTheme);
                  showToast("🎨 Theme Customization", `Theme set to ${newTheme.toUpperCase()}.`, "success");
                }}
                customThemeColor={customThemeColor}
                onCustomThemeColorChange={(newHex) => {
                  setCustomThemeColor(newHex);
                  showToast("🎨 Color Customizer", `Applied theme color ${newHex} across app.`, "success");
                }}
              />
            </div>
          )}
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
                attendanceConfig={attendanceConfig}
                onOpenStretchRelief={() => setIsStretchOpen(true)}
                onOpenClassSchedule={scrollToSchedule}
                onOpenExamSchedule={scrollToExams}
                onOpenAttendance={scrollToAttendance}
                onOpenHolidays={() => setActiveTab('holidays')}
                onOpenComplaints={scrollToComplaints}
                onOpenQuickReminder={() => {
                  setEditingReminder(null);
                  setIsReminderModalOpen(true);
                }}
              />

              {/* SECTION 2: Institutional Attendance Tracker (Days Can Change By User & Daily Prompt) */}
              <div ref={attendanceSectionRef}>
                <InstitutionAttendanceTracker
                  config={attendanceConfig}
                  onUpdateConfig={(newCfg) => {
                    setAttendanceConfig(newCfg);
                  }}
                  soundEnabled={soundEnabled}
                  onToast={showToast}
                  onLogHistoryRecord={logHistoryRecord}
                />
              </div>

              {/* SECTION 3: Exam Schedule & Daily Countdown Tracker */}
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
              <section ref={labsSectionRef} className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-5">
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
                    onToast={showToast}
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
              <div ref={habitsSectionRef}>
                <HabitsSection
                  habits={habits}
                  onToggleHabit={handleToggleHabit}
                  onAddHabit={handleAddHabit}
                  onDeleteHabit={handleDeleteHabit}
                  soundEnabled={soundEnabled}
                  onOpenStretchRelief={() => setIsStretchOpen(true)}
                />
              </div>

              {/* SECTION 8: Complaints & Issues Box (Private / Owner-Only Access) */}
              <div ref={complaintsSectionRef}>
                <ComplaintsBox
                  soundEnabled={soundEnabled}
                  onToast={showToast}
                />
              </div>
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
          onToast={showToast}
          onLogHistory={logHistoryRecord}
        />

        {/* Birthday Celebrations & Reminder Modal */}
        <BirthdayModal
          isOpen={isBirthdayModalOpen}
          onClose={() => setIsBirthdayModalOpen(false)}
          birthdayData={birthdayData}
          userName={todayData.userName || 'Alex'}
          onSaveBirthday={(newBday) => {
            setBirthdayData(newBday);
            if (newBday.birthdayDate) {
              logHistoryRecord(`Birthday Settings Updated: ${newBday.birthdayDate}`, 'Habits', 'Configured', `Remind advance: ${newBday.reminderTiming.value} ${newBday.reminderTiming.unit} | Extra Birthdays: ${newBday.extraBirthdays?.length || 0}`);
            } else {
              logHistoryRecord('Personal Birthday Cleared', 'Habits', 'Deleted', `Extra Birthdays remaining: ${newBday.extraBirthdays?.length || 0}`);
            }
          }}
          soundEnabled={soundEnabled}
          onToast={showToast}
        />

        {/* Quick Reminder Modal with Date, Time, Remind Me At and Background Alerts */}
        <AddReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setEditingReminder(null);
          }}
          reminders={quickReminders}
          onSaveReminder={handleSaveReminder}
          onDeleteReminder={handleDeleteReminder}
          onToggleComplete={handleToggleReminderComplete}
          soundEnabled={soundEnabled}
          onToast={showToast}
          initialEditReminder={editingReminder}
        />

        {/* Bottom Options Menu (Customizable Dock with Add/Delete custom items) */}
        <BottomOptionsMenu
          onOpenTimer={() => setIsTimerOpen(true)}
          onOpenStretch={() => setIsStretchOpen(true)}
          onOpenSchedule={scrollToSchedule}
          onOpenExams={scrollToExams}
          onOpenHolidays={() => setActiveTab('holidays')}
          onOpenHistory={() => setActiveTab('history')}
          onOpenBirthday={() => setIsBirthdayModalOpen(true)}
          onOpenAttendance={scrollToAttendance}
          onOpenHabits={scrollToHabits}
          onOpenComplaints={scrollToComplaints}
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

        {/* Android Background Push Notification Modal & Settings */}
        <PushNotificationModal
          isOpen={isPushModalOpen}
          onClose={() => setIsPushModalOpen(false)}
          onToast={showToast}
          soundEnabled={soundEnabled}
          onNavigateToTab={handleNavigateToDestination}
        />

        {/* Network Offline Indicator */}
        <OfflineIndicator />
      </div>
    </AndroidFrame>
  );
}

