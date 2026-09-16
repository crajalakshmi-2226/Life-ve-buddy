export type MoodType = 'Calm' | 'Happy' | 'Stress' | 'Tired' | 'Energized' | 'Focused';

export type HabitCategory = 'Health' | 'Study' | 'Personal' | 'Mindset' | 'All';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ClassPeriod {
  id: string;
  periodNumber: string; // e.g. "Period 1", "Slot A", "Morning Lecture"
  subject: string;
  code?: string;
  days: DayOfWeek[];
  startTime: string; // "09:00" (24-hour format)
  endTime: string; // "10:15" (24-hour format)
  room?: string;
  instructor?: string;
  colorTheme?: 'purple' | 'indigo' | 'fuchsia' | 'violet' | 'emerald' | 'amber' | 'sky' | 'rose';
  notes?: string;
  attendedToday?: boolean;
  reminderMinutesBefore?: number;
}

export interface TodayData {
  userName?: string;
  focusWord?: string;
  mood: MoodType;
  smallWin: string;
  whatIDidToday?: string;
  lastActiveDate: string;
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface LabEntry {
  id: string;
  labName: string;
  labDay: DayOfWeek;
  labTime: string; // e.g. "09:00"
  labEndTime?: string; // e.g. "11:00"
  labLocation?: string;
  reminderLeadTimeHours?: number; // e.g. 24 (evening before/1 day), 2, 1
  equipment: EquipmentItem[];
  labNotes?: string;
  colorTheme?: string;
}

export interface LabData {
  hasLab: 'yes' | 'no';
  // Legacy single lab fields retained for backwards compatibility
  labName?: string;
  labDay: DayOfWeek;
  labTime: string;
  labLocation?: string;
  equipment: EquipmentItem[];
  labNotes?: string;
  // Multiple weekly labs support
  labs?: LabEntry[];
  reminderLeadTimeHours?: number;
}

export type AppTheme = 'purple' | 'blue' | 'green' | 'pink' | 'amber' | 'dark';

export interface UserProfileField {
  id: string;
  label: string;
  value: string;
  isMandatory?: boolean;
  isCustom?: boolean;
}

export interface UserProfile {
  name: string;
  hobby: string;
  college: string;
  email: string;
  profilePhoto?: string; // Base64 data URL for private local storage
  customFields: UserProfileField[];
  theme: AppTheme;
  firstSignupSent?: boolean;
}

export interface UserMilestoneAlert {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: number;
}

export interface ProjectMilestone {
  id: number;
  text: string;
  done: boolean;
  dueDate?: string;
}

export interface ProjectData {
  projectName: string;
  deadlineDate: string;
  description?: string;
  tasks: ProjectMilestone[];
}

export interface Habit {
  id: number;
  name: string;
  category: 'Health' | 'Study' | 'Personal' | 'Mindset';
  streak: number;
  doneToday: boolean;
  isCustom: boolean;
  history?: string[]; // array of 'YYYY-MM-DD' dates completed
}

export interface DailyQuote {
  quote: string;
  author: string;
  timestamp: number;
}

export interface NotificationState {
  permission: 'default' | 'granted' | 'denied' | 'unsupported';
  dismissed: boolean;
  enabled: boolean;
}

export interface ComplaintReport {
  id: string;
  timestamp: number;
  dateStr: string;
  category: 'Bug/Error' | 'Feature Request' | 'Lab Reminder Issue' | 'Habit Tracker' | 'Design/UI' | 'Other';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  userEmail?: string;
  deviceInfo?: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  ownerNotes?: string;
}

export interface HabitDayStat {
  date: string;
  dayLabel: string;
  fullDate: string;
  completed: number;
  total: number;
  completionRate: number;
  studyHabits: number;
  healthHabits: number;
}

export interface StretchExercise {
  id: string;
  title: string;
  target: string;
  durationSec: number;
  icon: string;
  description: string;
  benefit: string;
  animationType: 'full-stretch' | 'neck-roll' | 'shoulder-shrug' | 'back-arch' | 'wrist-flex';
}

export type ExamType = 'Midterm' | 'Final Exam' | 'Quiz' | 'Unit Test' | 'Practical / Lab' | 'Oral / Viva' | 'Other';

export interface ExamChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface ExamItem {
  id: string;
  subject: string;
  code?: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  room?: string;
  seatNumber?: string;
  examType: ExamType;
  syllabus?: string;
  colorTheme?: 'purple' | 'indigo' | 'fuchsia' | 'violet' | 'emerald' | 'amber' | 'sky' | 'rose';
  completed?: boolean;
  priority?: 'High' | 'Medium' | 'Standard';
  checklist?: ExamChecklistItem[];
  targetScore?: string;
  notes?: string;
  reminderTiming?: CustomReminderTiming;
}

// ==========================================
// AI-BASED ALERT SYSTEM & ML PREDICTION TYPES
// ==========================================

export type RiskLevel = 'Safe' | 'Warning' | 'Critical' | 'Action Required';

export type AlertPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export type AlertCategory = 
  | 'Academic'
  | 'Attendance'
  | 'Deadline'
  | 'Exam'
  | 'Administrative'
  | 'Fee Payment'
  | 'Project Review'
  | 'College Event';

export type NotificationChannel = 'In-App' | 'Email' | 'SMS' | 'Push';

export type MLModelType = 'Random Forest' | 'Logistic Regression' | 'Decision Tree' | 'XGBoost';

export type AcademicTrend = 'Improving' | 'Stable' | 'Declining' | 'Critical';

export interface SubjectAttendanceRecord {
  id: string;
  subject: string;
  code: string;
  instructor: string;
  attendedClasses: number;
  totalClasses: number;
  percentage: number;
  minRequiredPercent: number; // usually 75%
  status: 'Safe' | 'Warning' | 'Critical';
  classesNeededFor75: number;
  lastUpdated: string;
}

export interface DateWiseAttendanceEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Duty Leave / Medical' | 'Cancelled';
  note?: string;
  timestamp: number;
}

export interface StudentDeadlineItem {
  id: string;
  title: string;
  subject: string;
  category: AlertCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: AlertPriority;
  status: 'Pending' | 'Completed' | 'Overdue';
  description?: string;
  actionUrlOrText?: string;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  urgency: AlertPriority;
  category: AlertCategory;
  targetSubject?: string;
  estimatedEffort: string; // e.g. "15 mins", "2 hours"
  completed: boolean;
  actionType: 'contact_faculty' | 'submit_assignment' | 'attend_classes' | 'pay_fee' | 'schedule_study' | 'general';
}

export interface AlertNotificationItem {
  id: string;
  title: string;
  message: string;
  category: AlertCategory;
  priority: AlertPriority;
  riskLevel: RiskLevel;
  timestamp: number;
  dateStr: string;
  isRead: boolean;
  actionRequired: boolean;
  recommendedActions: string[];
  earlyWarning?: boolean;
  subject?: string;
  deadlineCountdown?: string;
  dispatchedChannels: NotificationChannel[];
  emailSnippet?: {
    from: string;
    to: string;
    subject: string;
    body: string;
  };
  smsSnippet?: {
    senderId: string;
    messageText: string;
  };
}

export interface StudentAcademicProfile {
  studentName: string;
  studentId: string;
  branch: string;
  semester: string;
  overallAttendance: number; // e.g. 76%
  subjects: SubjectAttendanceRecord[];
  academicTrend: AcademicTrend;
  currentCGPA: number; // e.g. 7.4 / 10
  pendingAssignmentsCount: number;
  missedDeadlinesCount: number;
  engagementScore: number; // 0 - 100%
  alertResponseRate: number; // 0 - 100%
  feeDueStatus: {
    feeName: string;
    amount: number;
    dueDate: string;
    isPaid: boolean;
    gracePeriodDaysRemaining: number;
  };
  deadlines: StudentDeadlineItem[];
  attendanceLogs?: DateWiseAttendanceEntry[];
  semesterWorkingDays?: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
}

export interface MLModelEvaluation {
  modelName: MLModelType;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latencyMs: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  description: string;
  keyStrengths: string;
}

export interface SimulatorInput {
  eventType: 'Upcoming Examination' | 'Project Review' | 'Fee Payment' | 'Regular Class Cycle' | 'Midterm Test';
  attendancePercent: number; // 50 - 100
  pendingAssignments: number; // 0 - 10
  missedDeadlines: number; // 0 - 6
  academicTrend: AcademicTrend;
  daysUntilDeadline: number; // 1 - 30
  engagementLevel: number; // 20 - 100
  selectedModel: MLModelType;
}

export interface SimulatorPredictionResult {
  predictedRiskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  probabilityPercent: number;
  expectedOutcome: string;
  recommendedActions: string[];
  keyRiskFactors: string[];
  positiveFactors: string[];
  featureWeights: { feature: string; impactScore: number; direction: 'increases_risk' | 'decreases_risk' }[];
}

// ==========================================
// HOLIDAYS & VACATIONS REMINDER TYPES
// ==========================================

export type HolidayCategory = 
  | 'National Holiday' 
  | 'Academic Break' 
  | 'Festival / Cultural' 
  | 'Semester Vacation' 
  | 'Institutional / Optional';

export interface HolidayItem {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (inclusive, for multi-day breaks)
  category: HolidayCategory;
  description?: string;
  totalDays: number; // Duration in days (e.g., 1 day or 5 days)
  reminderEnabled?: boolean;
  reminderDaysBefore: number[]; // e.g. [14, 7, 3, 1]
  isCustom?: boolean;
  colorTheme?: 'purple' | 'emerald' | 'amber' | 'sky' | 'rose' | 'indigo' | 'fuchsia' | 'violet';
  studyCatchUpGoal?: string;
  notes?: string;
}

export interface HolidayCountdownInfo {
  diffDays: number; // Days until start (0 = today, 1 = tomorrow, negative = started or ended)
  isToday: boolean;
  isTomorrow: boolean;
  isOngoing: boolean;
  isPast: boolean;
  totalDuration: number;
  currentDayOfVacation?: number;
  countdownText: string;
  countdownBadge: string;
  relativeDateRange: string;
  urgency: 'ongoing' | 'today' | 'tomorrow' | 'soon' | 'upcoming' | 'past';
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface HolidayReminderConfig {
  defaultReminderDays: number; // e.g. 7 (remind when holiday is within 7 days)
  soundAlert: boolean;
  browserNotification: boolean;
  showOnDashboard: boolean;
}

// ==========================================
// CUSTOM REMINDER TIMING (HOURS / DAYS / MONTHS)
// ==========================================

export type ReminderTimingUnit = 'hours' | 'days' | 'months';

export interface CustomReminderTiming {
  value: number;
  unit: ReminderTimingUnit;
}

// ==========================================
// BIRTHDAY REMINDER TYPES (WITH EXTRA BIRTHDAYS ADD/DELETE)
// ==========================================

export type RelationshipType = 'Friend' | 'Family' | 'Classmate' | 'Colleague' | 'Mentor' | 'Other';

export interface ExtraBirthdayItem {
  id: string;
  name: string;
  relationship: RelationshipType;
  birthdayDate: string; // YYYY-MM-DD
  customWishNote?: string;
  reminderTiming: CustomReminderTiming;
  colorTheme?: 'rose' | 'purple' | 'amber' | 'emerald' | 'sky' | 'indigo';
}

export interface BirthdayData {
  birthdayDate: string; // YYYY-MM-DD (User's personal birthday)
  userName?: string;
  wishesEnabled: boolean;
  reminderTiming: CustomReminderTiming;
  customWishNote?: string;
  lastCelebratedYear?: number;
  extraBirthdays?: ExtraBirthdayItem[]; // List of extra birthdays (friends, family, classmates)
}

// ==========================================
// INSTITUTION ATTENDANCE TRACKER TYPES
// ==========================================

export type InstitutionType = 'college' | 'office' | 'school';

export interface AttendanceDailyCheckIn {
  date: string; // YYYY-MM-DD
  attended: boolean; // true = Yes (Present), false = No (Leave/Absence)
  isHoliday?: boolean;
  note?: string;
  calculatedPercentage: number;
  timestamp: number;
}

export type WorkingDaysPattern = '5_day' | '6_day' | 'custom_weekly' | 'custom_total';

export interface InstitutionAttendanceConfig {
  institutionType: InstitutionType;
  institutionName: string;
  workingDaysPattern?: WorkingDaysPattern; // 5_day, 6_day, custom_weekly, custom_total
  workingDaysMode: 'weekly' | 'monthly' | 'total'; // e.g. 5 days/week or 22 days/month or 90 total days
  daysPerWeek: number; // e.g. 5 or 6 days/week, or custom 1-7
  weeksInSemester?: number; // e.g. 15, 16, 18 weeks
  workingDaysPerMonth: number; // e.g. 22
  totalWorkingDays: number; // User-selected total working days (e.g. 75, 90, 108, or any number user sets)
  conductedDays: number; // How many working days conducted so far
  attendedDays: number; // How many attended
  leaveDays: number; // How many leaves taken
  targetThreshold?: number; // User-selected minimum attendance target (e.g. 75% or 80%)
  attendancePercentage: number; // automatically calculated: (attendedDays / conductedDays) * 100
  lastCheckInDate?: string; // YYYY-MM-DD
  lastWorkingDayAttended?: string; // e.g. "2026-09-12"
  checkInLogs: AttendanceDailyCheckIn[];
}

// ==========================================
// UNIFIED HISTORY PAGE RECORD TYPES
// ==========================================

export type HistoryCategory = 'All' | 'Attendance & Leaves' | 'Habits' | 'Exams' | 'Holidays' | 'Assignments' | 'Physical Activities' | 'Reminders';

export interface HistoryRecordItem {
  id: string;
  category: 'Attendance & Leaves' | 'Habits' | 'Exams' | 'Holidays' | 'Assignments' | 'Physical Activities' | 'Reminders';
  title: string;
  date: string;
  status: string;
  details?: string;
  badge?: string;
  colorTheme?: string;
  timestamp: number;
}

// ==========================================
// BOTTOM OPTIONS MENU TYPES (CUSTOMIZABLE)
// ==========================================

export type BottomOptionAction = 
  | 'timer' 
  | 'stretch' 
  | 'schedule' 
  | 'exams' 
  | 'alerts' 
  | 'holidays' 
  | 'history' 
  | 'birthday' 
  | 'attendance' 
  | 'habits' 
  | 'complaints' 
  | 'custom-link' 
  | 'custom-note';

export interface BottomOptionItem {
  id: string;
  label: string;
  icon: string;
  actionType: BottomOptionAction;
  targetUrl?: string;
  customNote?: string;
  colorTheme?: 'purple' | 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'rose' | 'sky';
  isDefault?: boolean;
}

// ==========================================
// PHYSICAL ACTIVITY REMINDERS (RECURRING)
// ==========================================

export type PhysicalActivityType = 'stretch' | 'walking' | 'water' | 'eye-rest' | 'posture' | 'custom';

export interface PhysicalActivityReminder {
  id: string;
  title: string;
  type: PhysicalActivityType;
  icon: string;
  intervalMinutes: number; // default: 60 mins (1 hour)
  enabled: boolean;
  lastTriggeredAt?: number;
  nextTriggerAt: number; // timestamp in ms
  customMessage?: string;
  dailyCompletedCount: number;
  isDefault?: boolean;
}

// ==========================================
// CLASS SCHEDULE TOMORROW CONFIRMATION
// ==========================================

export interface TomorrowConfirmationRecord {
  dateStr: string; // YYYY-MM-DD for tomorrow
  dayOfWeek: DayOfWeek;
  confirmedAt: number;
  activePeriodIds: string[];
  skippedPeriodIds: string[];
  notes?: string;
}

export interface QuickReminder {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  remindMeAt: string; // YYYY-MM-DDTHH:mm
  createdAt: number;
  completed?: boolean;
  notified?: boolean;
}






