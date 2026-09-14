import { 
  LabData, 
  ProjectData, 
  ClassPeriod, 
  DayOfWeek, 
  ExamItem, 
  HolidayItem, 
  HolidayCountdownInfo, 
  HolidayCategory,
  BirthdayData,
  InstitutionAttendanceConfig,
  CustomReminderTiming,
  HistoryRecordItem
} from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHeaderDate(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  return DAYS_OF_WEEK[dayIndex];
}

export function formatTime12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  if (isNaN(hours)) return time24;
  const dummy = new Date();
  dummy.setHours(hours, minutes, 0, 0);
  return dummy.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export interface CurrentClassStatus {
  activePeriod: ClassPeriod | null;
  nextPeriod: ClassPeriod | null;
  progressPercent: number;
  minutesRemaining: number;
  minutesUntilNext: number;
  statusType: 'in-session' | 'upcoming-soon' | 'later-today' | 'done-today' | 'no-classes';
  badgeText: string;
}

export function getCurrentClassStatus(periods: ClassPeriod[]): CurrentClassStatus {
  const today = getTodayDayOfWeek();
  const todayPeriods = periods
    .filter(p => p.days.includes(today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todayPeriods.length === 0) {
    return {
      activePeriod: null,
      nextPeriod: null,
      progressPercent: 0,
      minutesRemaining: 0,
      minutesUntilNext: 0,
      statusType: 'no-classes',
      badgeText: 'No classes scheduled for today'
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const period of todayPeriods) {
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    // Is currently in session
    if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
      const duration = endTotal - startTotal || 1;
      const elapsed = currentMinutes - startTotal;
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
      const minutesRemaining = endTotal - currentMinutes;

      return {
        activePeriod: period,
        nextPeriod: null,
        progressPercent,
        minutesRemaining,
        minutesUntilNext: 0,
        statusType: 'in-session',
        badgeText: `In Session: ${period.subject} (${minutesRemaining}m left)`
      };
    }
  }

  // Check upcoming next period today
  const upcomingPeriods = todayPeriods.filter(period => {
    const [startH, startM] = period.startTime.split(':').map(Number);
    return (startH * 60 + startM) > currentMinutes;
  });

  if (upcomingPeriods.length > 0) {
    const nextPeriod = upcomingPeriods[0];
    const [startH, startM] = nextPeriod.startTime.split(':').map(Number);
    const minutesUntilNext = (startH * 60 + startM) - currentMinutes;

    return {
      activePeriod: null,
      nextPeriod,
      progressPercent: 0,
      minutesRemaining: 0,
      minutesUntilNext,
      statusType: minutesUntilNext <= 30 ? 'upcoming-soon' : 'later-today',
      badgeText: minutesUntilNext <= 30 
        ? `Upcoming in ${minutesUntilNext}m: ${nextPeriod.subject}`
        : `Next: ${nextPeriod.subject} at ${formatTime12(nextPeriod.startTime)}`
    };
  }

  return {
    activePeriod: null,
    nextPeriod: null,
    progressPercent: 100,
    minutesRemaining: 0,
    minutesUntilNext: 0,
    statusType: 'done-today',
    badgeText: 'All class periods completed for today! 🎉'
  };
}

export function getNextLabInfo(labData: LabData): {
  isToday: boolean;
  isTomorrow: boolean;
  daysRemaining: number;
  displayText: string;
  formattedTime: string;
  isSoon: boolean;
} {
  if (labData.hasLab === 'no') {
    return {
      isToday: false,
      isTomorrow: false,
      daysRemaining: -1,
      displayText: 'No active lab scheduled',
      formattedTime: '',
      isSoon: false
    };
  }

  const now = new Date();
  const currentDayIndex = now.getDay();
  const targetDayIndex = DAYS_OF_WEEK.indexOf(labData.labDay);

  let daysDiff = targetDayIndex - currentDayIndex;
  
  const [labHours, labMinutes] = (labData.labTime || '09:00').split(':').map(Number);
  const labTimeToday = new Date(now);
  labTimeToday.setHours(labHours, labMinutes, 0, 0);

  if (daysDiff < 0 || (daysDiff === 0 && now.getTime() > labTimeToday.getTime())) {
    daysDiff += 7;
  }

  // Format 12-hour time
  const dummyDate = new Date();
  dummyDate.setHours(labHours, labMinutes);
  const formattedTime = dummyDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const isToday = daysDiff === 0;
  const isTomorrow = daysDiff === 1;
  const isSoon = daysDiff <= 1;

  let displayText = '';
  if (isToday) {
    displayText = `Today at ${formattedTime}`;
  } else if (isTomorrow) {
    displayText = `Tomorrow at ${formattedTime}`;
  } else {
    displayText = `${labData.labDay} at ${formattedTime} (${daysDiff} days)`;
  }

  return {
    isToday,
    isTomorrow,
    daysRemaining: daysDiff,
    displayText,
    formattedTime,
    isSoon
  };
}

export function getProjectDeadlineInfo(project: ProjectData): {
  daysLeft: number;
  statusText: string;
  urgency: 'overdue' | 'today' | 'tomorrow' | 'urgent' | 'normal' | 'relaxed';
  badgeColor: string;
} {
  if (!project.deadlineDate) {
    return {
      daysLeft: 0,
      statusText: 'No deadline set',
      urgency: 'normal',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = project.deadlineDate.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      daysLeft,
      statusText: `Overdue by ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'day' : 'days'}`,
      urgency: 'overdue',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    };
  } else if (daysLeft === 0) {
    return {
      daysLeft,
      statusText: 'Due Today!',
      urgency: 'today',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
    };
  } else if (daysLeft === 1) {
    return {
      daysLeft,
      statusText: 'Due Tomorrow',
      urgency: 'tomorrow',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    };
  } else if (daysLeft <= 3) {
    return {
      daysLeft,
      statusText: `${daysLeft} days left`,
      urgency: 'urgent',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  } else if (daysLeft <= 7) {
    return {
      daysLeft,
      statusText: `${daysLeft} days left`,
      urgency: 'normal',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  } else {
    return {
      daysLeft,
      statusText: `${daysLeft} days left`,
      urgency: 'relaxed',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
}

export function formatExamDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export interface ExamCountdownInfo {
  diffDays: number;
  isToday: boolean;
  isTomorrow: boolean;
  isYesterday: boolean;
  isPast: boolean;
  countdownBadge: string;
  relativeText: string;
  urgency: 'today' | 'tomorrow' | 'urgent' | 'upcoming' | 'past';
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
}

export function getExamCountdown(exam: ExamItem): ExamCountdownInfo {
  if (!exam.examDate) {
    return {
      diffDays: 0,
      isToday: false,
      isTomorrow: false,
      isYesterday: false,
      isPast: false,
      countdownBadge: 'No date set',
      relativeText: 'No date set',
      urgency: 'upcoming',
      badgeStyle: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' }
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = exam.examDate.split('-').map(Number);
  const examDay = new Date(year, month - 1, day);
  examDay.setHours(0, 0, 0, 0);

  const diffTime = examDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;
  const isYesterday = diffDays === -1;
  const isPast = diffDays < 0;

  let countdownBadge = '';
  let relativeText = '';
  let urgency: 'today' | 'tomorrow' | 'urgent' | 'upcoming' | 'past' = 'upcoming';
  let badgeStyle = { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' };

  if (isToday) {
    urgency = 'today';
    countdownBadge = '🔥 TODAY!';
    relativeText = `Exam is scheduled for TODAY at ${formatTime12(exam.startTime)}`;
    badgeStyle = { bg: 'bg-rose-600 animate-pulse text-white', text: 'text-white', border: 'border-rose-700' };
  } else if (isTomorrow) {
    urgency = 'tomorrow';
    countdownBadge = '⏰ Tomorrow (in 1 day)';
    relativeText = `Tomorrow at ${formatTime12(exam.startTime)}`;
    badgeStyle = { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };
  } else if (diffDays > 1) {
    if (diffDays <= 3) {
      urgency = 'urgent';
      badgeStyle = { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
    } else {
      urgency = 'upcoming';
      badgeStyle = { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' };
    }
    countdownBadge = `⏳ In ${diffDays} days`;
    relativeText = `${diffDays} days to come`;
  } else if (isYesterday) {
    urgency = 'past';
    countdownBadge = '⏮️ Yesterday (1 day ago)';
    relativeText = 'Held yesterday';
    badgeStyle = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
  } else {
    // Past days (e.g. 3 days ago)
    const positiveDays = Math.abs(diffDays);
    urgency = 'past';
    countdownBadge = `⏮️ ${positiveDays} days ago`;
    relativeText = `Completed ${positiveDays} days ago`;
    badgeStyle = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  }

  return {
    diffDays,
    isToday,
    isTomorrow,
    isYesterday,
    isPast,
    countdownBadge,
    relativeText,
    urgency,
    badgeStyle
  };
}

export function generateDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_EXAMS: ExamItem[] = [
  {
    id: 'exam_1',
    subject: 'Data Structures & Algorithms',
    code: 'CS 301',
    examDate: generateDateOffset(2), // 2 days to come
    startTime: '09:30',
    endTime: '12:30',
    room: 'Hall B - Room 204',
    seatNumber: 'Seat #34',
    examType: 'Midterm',
    syllabus: 'Binary Trees, AVL Trees, Heaps, Graph BFS/DFS, Dynamic Programming',
    colorTheme: 'purple',
    priority: 'High',
    completed: false,
    targetScore: '90%+',
    notes: 'Bring student ID card and approved scientific calculator.',
    checklist: [
      { id: 'c1', title: 'Revise AVL Tree rotations & Heapify complexity', done: true },
      { id: 'c2', title: 'Practice Graph Dijkstra & Topological Sort algorithms', done: true },
      { id: 'c3', title: 'Solve 2024 Past Year Question Paper', done: false },
      { id: 'c4', title: 'Prepare Formula & Complexity Cheat Sheet', done: false }
    ]
  },
  {
    id: 'exam_2',
    subject: 'Linear Algebra & Matrix Theory',
    code: 'MATH 202',
    examDate: generateDateOffset(5), // 5 days to come
    startTime: '14:00',
    endTime: '16:00',
    room: 'Science Complex - Hall 1',
    seatNumber: 'Seat #12',
    examType: 'Unit Test',
    syllabus: 'Eigenvalues, Eigenvectors, Diagonalization, Orthogonal Projections',
    colorTheme: 'indigo',
    priority: 'Medium',
    completed: false,
    targetScore: '85%',
    notes: 'Formula sheet will be provided with the question paper.',
    checklist: [
      { id: 'c5', title: 'Review Gram-Schmidt orthogonalization steps', done: true },
      { id: 'c6', title: 'Practice 3x3 Matrix determinant & Characteristic equation', done: false }
    ]
  },
  {
    id: 'exam_3',
    subject: 'Applied Physics & Wave Mechanics',
    code: 'PHYS 102',
    examDate: generateDateOffset(12), // 12 days to come
    startTime: '10:00',
    endTime: '13:00',
    room: 'Auditorium - Block 4',
    seatNumber: 'Seat #88',
    examType: 'Final Exam',
    syllabus: 'Thermodynamics, Wave Optics, Quantum Mechanics, Maxwell Equations',
    colorTheme: 'emerald',
    priority: 'High',
    completed: false,
    targetScore: '95%',
    notes: 'Comprehensive 100-mark university final exam.',
    checklist: [
      { id: 'c7', title: 'Derive Carnot cycle efficiency equations', done: false },
      { id: 'c8', title: 'Memorize de Broglie wavelength & photoelectric formulas', done: false }
    ]
  },
  {
    id: 'exam_4',
    subject: 'Computer Architecture Quiz',
    code: 'CS 310',
    examDate: generateDateOffset(-3), // 3 days ago
    startTime: '11:00',
    endTime: '11:45',
    room: 'Tech Hub - Lab 3',
    examType: 'Quiz',
    syllabus: 'RISC-V Instruction Set, 5-stage Pipelining & Hazard resolution',
    colorTheme: 'violet',
    priority: 'Standard',
    completed: true,
    targetScore: '92%',
    notes: 'Score: 19/20 scored! Good performance.',
    checklist: [
      { id: 'c9', title: 'Review Data & Control hazards', done: true },
      { id: 'c10', title: 'Practice branch prediction tables', done: true }
    ]
  }
];

// ==========================================
// HOLIDAY HELPERS & COUNTDOWN CALCULATOR
// ==========================================

/**
 * Calculates and confirms the exact calendar weekday name (e.g. "Monday", "Tuesday")
 * directly from the YYYY-MM-DD date string by evaluating at local noon, avoiding
 * any midnight UTC or daylight-savings timezone boundary shifts.
 */
export function getConfirmedDayName(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return '';
  const [year, month, day] = parts;
  if (!year || !month || !day) return '';

  const targetDate = new Date(year, month - 1, day, 12, 0, 0);
  const confirmedDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return confirmedDays[targetDate.getDay()];
}

export function formatHolidayDate(startDate: string, endDate?: string): string {
  if (!startDate) return '';
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const confirmedStartDay = getConfirmedDayName(startDate);
  const startObj = new Date(sy, sm - 1, sd, 12, 0, 0);
  const monthName = startObj.toLocaleDateString('en-US', { month: 'short' });

  if (!endDate || endDate === startDate) {
    return `${confirmedStartDay}, ${monthName} ${sd}, ${sy}`;
  }

  const [ey, em, ed] = endDate.split('-').map(Number);
  const confirmedEndDay = getConfirmedDayName(endDate);
  const endObj = new Date(ey, em - 1, ed, 12, 0, 0);
  const endMonthName = endObj.toLocaleDateString('en-US', { month: 'short' });

  return `${confirmedStartDay}, ${monthName} ${sd} – ${confirmedEndDay}, ${endMonthName} ${ed}, ${ey}`;
}

export function getHolidayCountdown(holiday: HolidayItem): HolidayCountdownInfo {
  if (!holiday.startDate) {
    return {
      diffDays: 0,
      isToday: false,
      isTomorrow: false,
      isOngoing: false,
      isPast: false,
      totalDuration: 1,
      countdownText: 'No date set',
      countdownBadge: 'No date set',
      relativeDateRange: '',
      urgency: 'upcoming',
      badgeStyle: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' }
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sy, sm, sd] = holiday.startDate.split('-').map(Number);
  const startDay = new Date(sy, sm - 1, sd);
  startDay.setHours(0, 0, 0, 0);

  let endDay = startDay;
  if (holiday.endDate) {
    const [ey, em, ed] = holiday.endDate.split('-').map(Number);
    endDay = new Date(ey, em - 1, ed);
    endDay.setHours(0, 0, 0, 0);
  }

  const durationMs = endDay.getTime() - startDay.getTime();
  const totalDuration = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1);

  const diffTimeStart = startDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTimeStart / (1000 * 60 * 60 * 24));

  const diffTimeEnd = endDay.getTime() - today.getTime();
  const diffDaysToEnd = Math.round(diffTimeEnd / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;
  const isPast = diffDaysToEnd < 0;
  const isOngoing = diffDays <= 0 && diffDaysToEnd >= 0;

  let currentDayOfVacation: number | undefined = undefined;
  if (isOngoing) {
    const elapsedMs = today.getTime() - startDay.getTime();
    currentDayOfVacation = Math.min(totalDuration, Math.round(elapsedMs / (1000 * 60 * 60 * 24)) + 1);
  }

  let countdownText = '';
  let countdownBadge = '';
  let urgency: 'ongoing' | 'today' | 'tomorrow' | 'soon' | 'upcoming' | 'past' = 'upcoming';
  let badgeStyle = { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' };

  if (isOngoing) {
    urgency = 'ongoing';
    if (totalDuration > 1) {
      countdownBadge = `🌴 Ongoing Vacation (Day ${currentDayOfVacation} of ${totalDuration})`;
      countdownText = `Ongoing vacation! ${diffDaysToEnd === 0 ? 'Last day today' : `${diffDaysToEnd} days remaining`}`;
    } else {
      countdownBadge = '🎉 Today is Holiday!';
      countdownText = 'Enjoy your holiday today!';
    }
    badgeStyle = { bg: 'bg-emerald-600 text-white', text: 'text-white', border: 'border-emerald-700' };
  } else if (isTomorrow) {
    urgency = 'tomorrow';
    countdownBadge = '🏖️ Tomorrow (in 1 day)';
    countdownText = `Holiday starts tomorrow! (${totalDuration} ${totalDuration === 1 ? 'day' : 'days'})`;
    badgeStyle = { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };
  } else if (diffDays > 1) {
    if (diffDays <= 3) {
      urgency = 'soon';
      countdownBadge = `⏰ In ${diffDays} days`;
      countdownText = `Coming in ${diffDays} days (${formatHolidayDate(holiday.startDate, holiday.endDate)})`;
      badgeStyle = { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
    } else if (diffDays <= 7) {
      urgency = 'soon';
      countdownBadge = `🌴 In ${diffDays} days`;
      countdownText = `Coming next week (in ${diffDays} days)`;
      badgeStyle = { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' };
    } else {
      urgency = 'upcoming';
      countdownBadge = `📅 In ${diffDays} days`;
      countdownText = `Coming in ${diffDays} days (${totalDuration} ${totalDuration === 1 ? 'day' : 'days break'})`;
      badgeStyle = { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' };
    }
  } else {
    // Past
    const positiveDays = Math.abs(diffDaysToEnd);
    urgency = 'past';
    countdownBadge = `⏮️ ${positiveDays === 0 ? 'Ended yesterday' : `${positiveDays}d ago`}`;
    countdownText = `Concluded ${positiveDays} days ago`;
    badgeStyle = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  }

  const relativeDateRange = formatHolidayDate(holiday.startDate, holiday.endDate);

  return {
    diffDays,
    isToday,
    isTomorrow,
    isOngoing,
    isPast,
    totalDuration,
    currentDayOfVacation,
    countdownText,
    countdownBadge,
    relativeDateRange,
    urgency,
    badgeStyle
  };
}

export function getHolidaysComingInDays(holidays: HolidayItem[], thresholdDays: number): HolidayItem[] {
  return holidays.filter(h => {
    const info = getHolidayCountdown(h);
    if (info.isOngoing) return true;
    if (!info.isPast && info.diffDays >= 0 && info.diffDays <= thresholdDays) return true;
    return false;
  }).sort((a, b) => {
    const aInfo = getHolidayCountdown(a);
    const bInfo = getHolidayCountdown(b);
    return aInfo.diffDays - bInfo.diffDays;
  });
}

export const DEFAULT_HOLIDAYS: HolidayItem[] = [
  {
    id: 'hol_1',
    name: "Labor Day / Worker's Holiday",
    startDate: generateDateOffset(13), // 13 days away
    category: 'National Holiday',
    totalDays: 1,
    reminderEnabled: true,
    reminderDaysBefore: [14, 7, 3, 1],
    colorTheme: 'purple',
    description: 'National holiday honoring the contributions of the workforce. College offices and lecture halls closed.',
    studyCatchUpGoal: 'Complete DSA Assignment 3 and review physics problem sets before class resumes.'
  },
  {
    id: 'hol_2',
    name: 'Autumn Mid-Semester Break',
    startDate: generateDateOffset(27), // 27 days away
    endDate: generateDateOffset(31), // 5 days break
    category: 'Academic Break',
    totalDays: 5,
    reminderEnabled: true,
    reminderDaysBefore: [30, 14, 7, 3],
    colorTheme: 'amber',
    description: 'Fall midterm recess for campus students to recharge, study for upcoming unit tests, or travel.',
    studyCatchUpGoal: 'Finish 2 chapters of Operating Systems and draft the final project architecture report.'
  },
  {
    id: 'hol_3',
    name: "Indigenous Peoples' / Heritage Day",
    startDate: generateDateOffset(48),
    category: 'National Holiday',
    totalDays: 1,
    reminderEnabled: true,
    reminderDaysBefore: [7, 3, 1],
    colorTheme: 'sky',
    description: 'Campus closed in observance of cultural heritage and regional historical reflections.',
    studyCatchUpGoal: 'Relax, catch up on sleep, and spend 1 hour organizing notebook notes.'
  },
  {
    id: 'hol_4',
    name: 'Veterans & Campus Memorial Day',
    startDate: generateDateOffset(78),
    category: 'Institutional / Optional',
    totalDays: 1,
    reminderEnabled: true,
    reminderDaysBefore: [7, 1],
    colorTheme: 'indigo',
    description: 'Campus holiday honoring service personnel. Library remains open for quiet self-study.',
    studyCatchUpGoal: 'Study in the central library for 3 focused Pomodoro intervals.'
  },
  {
    id: 'hol_5',
    name: 'Thanksgiving & Fall Vacation Break',
    startDate: generateDateOffset(92),
    endDate: generateDateOffset(96),
    category: 'Semester Vacation',
    totalDays: 5,
    reminderEnabled: true,
    reminderDaysBefore: [30, 14, 7, 3, 1],
    colorTheme: 'emerald',
    description: 'Annual Fall Thanksgiving vacation week. No scheduled exams or lab submissions during this period.',
    studyCatchUpGoal: 'Enjoy family time and complete final semester group presentation slides.'
  },
  {
    id: 'hol_6',
    name: 'Winter Semester Recess & New Year Break',
    startDate: generateDateOffset(118),
    endDate: generateDateOffset(133),
    category: 'Semester Vacation',
    totalDays: 16,
    reminderEnabled: true,
    reminderDaysBefore: [30, 14, 7],
    colorTheme: 'rose',
    description: 'Winter inter-semester recess spanning Christmas, New Year celebrations, and semester transition.',
    studyCatchUpGoal: 'Read 1 tech book, build a personal portfolio project, and refresh coding fundamentals.'
  }
];

// ==========================================
// BIRTHDAY REMINDER HELPERS & WISH GENERATOR
// ==========================================

export const DEFAULT_BIRTHDAY_DATA: BirthdayData = {
  birthdayDate: '',
  userName: 'Friend',
  wishesEnabled: true,
  reminderTiming: {
    value: 1,
    unit: 'days'
  },
  customWishNote: ''
};

export const WARM_BIRTHDAY_WISHES = [
  "🎉 Happy Birthday! Today we celebrate you and everything you bring to the world. May this year be filled with remarkable breakthroughs, unshakable confidence, deep wisdom, and joyful milestones. You're building an incredible future—keep shining bright!",
  "🎂 Wishing you the happiest of birthdays! Take a moment today to reflect on how far you've come, the grit you've shown, and the boundless potential ahead of you. May every goal you chase this year turn into a triumphant victory!",
  "✨ Happy Birthday, champion! Another trip around the sun, and another chapter to write your greatest story. Enjoy every single second of your special day, celebrate with those you love, and let yourself feel truly appreciated!",
  "🌟 A warm and heartfelt Happy Birthday to you! May this upcoming year grant you peace of mind, sharp focus, vibrant health, and unforgettable joy. You deserve the absolute best!"
];

export function getBirthdayCountdown(birthdayDate: string): {
  diffDays: number;
  isToday: boolean;
  isUpcomingSoon: boolean;
  daysUntil: number;
  nextAge?: number;
  formattedDate: string;
  confirmedDayName: string;
  wishMessage: string;
} {
  if (!birthdayDate) {
    return {
      diffDays: -1,
      isToday: false,
      isUpcomingSoon: false,
      daysUntil: -1,
      formattedDate: 'Not set',
      confirmedDayName: '',
      wishMessage: ''
    };
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const [bYear, bMonth, bDay] = birthdayDate.split('-').map(Number);
  const thisYear = today.getFullYear();

  // Target birthday this year
  let target = new Date(thisYear, bMonth - 1, bDay, 12, 0, 0);
  
  // If already passed this year, look at next year
  if (target.getTime() < today.getTime() && !(target.getMonth() === today.getMonth() && target.getDate() === today.getDate())) {
    target = new Date(thisYear + 1, bMonth - 1, bDay, 12, 0, 0);
  }

  const isToday = today.getMonth() === (bMonth - 1) && today.getDate() === bDay;
  const diffTime = target.getTime() - today.getTime();
  const daysUntil = isToday ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffDays = daysUntil;
  const isUpcomingSoon = daysUntil > 0 && daysUntil <= 7;

  const nextAge = bYear ? target.getFullYear() - bYear : undefined;
  const confirmedDayName = getConfirmedDayName(`${target.getFullYear()}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`);
  const monthName = target.toLocaleDateString('en-US', { month: 'long' });
  const formattedDate = `${monthName} ${bDay}`;

  // Pick wish
  const wishMessage = WARM_BIRTHDAY_WISHES[(bDay || 1) % WARM_BIRTHDAY_WISHES.length];

  return {
    diffDays,
    isToday,
    isUpcomingSoon,
    daysUntil,
    nextAge,
    formattedDate,
    confirmedDayName,
    wishMessage
  };
}

// ==========================================
// INSTITUTION ATTENDANCE TRACKER DEFAULTS
// ==========================================

export const DEFAULT_ATTENDANCE_CONFIG: InstitutionAttendanceConfig = {
  institutionType: 'college',
  institutionName: 'Campus / College',
  workingDaysMode: 'weekly',
  daysPerWeek: 5, // 5 days a week (Mon-Fri)
  workingDaysPerMonth: 22,
  totalWorkingDays: 90,
  conductedDays: 45,
  attendedDays: 38,
  leaveDays: 7,
  attendancePercentage: 84.4, // (38 / 45) * 100
  lastWorkingDayAttended: '2026-09-12',
  checkInLogs: [
    {
      date: '2026-09-12',
      attended: true,
      calculatedPercentage: 84.4,
      note: 'Attended full session',
      timestamp: Date.now() - 86400000 * 2
    },
    {
      date: '2026-09-11',
      attended: true,
      calculatedPercentage: 84.1,
      note: 'Attended lab & lectures',
      timestamp: Date.now() - 86400000 * 3
    },
    {
      date: '2026-09-10',
      attended: false,
      calculatedPercentage: 83.7,
      note: 'Medical appointment leave',
      timestamp: Date.now() - 86400000 * 4
    }
  ]
};

// ==========================================
// MOTIVATIONAL "DAILY SMALL WIN" MESSAGES
// ==========================================

export const DAILY_SMALL_WINS = [
  "Daily Small Win: Massive respect! Every assignment finished is momentum gained towards your dream career.",
  "Daily Small Win: Boom! Task crushed. Consistency is the secret sauce that separates high achievers.",
  "Daily Small Win: Proud of you! Checking off milestones clears mental clutter and keeps you in full control.",
  "Daily Small Win: Great job! Small daily wins compound into unstoppable academic excellence.",
  "Daily Small Win: You showed up, put in the focus, and finished what you started. Keep that energy going!",
  "Daily Small Win: One step closer to mastery. Take a quick stretch and acknowledge your steady progress."
];

export function getRandomSmallWin(): string {
  const index = Math.floor(Math.random() * DAILY_SMALL_WINS.length);
  return DAILY_SMALL_WINS[index];
}

// ==========================================
// CUSTOM REMINDER TIMING FORMATTER
// ==========================================

export function formatCustomReminderTiming(timing: CustomReminderTiming): string {
  const { value, unit } = timing;
  if (value === 1) {
    if (unit === 'hours') return '1 Hour before';
    if (unit === 'days') return '1 Day before';
    if (unit === 'months') return '1 Month before';
  }
  const unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1);
  return `${value} ${unitLabel} before`;
}

// ==========================================
// BIRTHDAY HELPERS
// ==========================================

export function getDaysUntilBirthday(birthdayDateStr: string): {
  daysRemaining: number;
  isToday: boolean;
  nextBirthdayDate: Date | null;
  formattedDisplay: string;
} {
  if (!birthdayDateStr) {
    return { daysRemaining: -1, isToday: false, nextBirthdayDate: null, formattedDisplay: 'Not set' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = birthdayDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[1]) || isNaN(parts[2])) {
    return { daysRemaining: -1, isToday: false, nextBirthdayDate: null, formattedDisplay: 'Invalid date' };
  }

  const birthMonth = parts[1] - 1;
  const birthDay = parts[2];

  let nextYear = today.getFullYear();
  let candidate = new Date(nextYear, birthMonth, birthDay);
  candidate.setHours(0, 0, 0, 0);

  if (candidate.getTime() < today.getTime()) {
    nextYear += 1;
    candidate = new Date(nextYear, birthMonth, birthDay);
    candidate.setHours(0, 0, 0, 0);
  }

  const diffMs = candidate.getTime() - today.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const isToday = daysRemaining === 0;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDisplay = isToday 
    ? "Today! 🎉" 
    : daysRemaining === 1 
    ? "Tomorrow! 🎂" 
    : `in ${daysRemaining} days (${monthNames[birthMonth]} ${birthDay})`;

  return {
    daysRemaining,
    isToday,
    nextBirthdayDate: candidate,
    formattedDisplay
  };
}

export function isBirthdayToday(birthdayDateStr: string): boolean {
  return getDaysUntilBirthday(birthdayDateStr).isToday;
}



