import {
  StudentAcademicProfile,
  AlertNotificationItem,
  RiskLevel,
  AlertPriority,
  AlertCategory,
  ActionRecommendation,
  MLModelEvaluation,
  MLModelType,
  SimulatorInput,
  SimulatorPredictionResult
} from '../types';

export const INITIAL_STUDENT_PROFILE: StudentAcademicProfile = {
  studentName: "Alex Vance",
  studentId: "CS2026-8842",
  branch: "Computer Science & Engineering",
  semester: "6th Semester (B.Tech)",
  overallAttendance: 76,
  riskScore: 78,
  riskLevel: "Critical",
  subjects: [
    {
      id: "sub-1",
      subject: "Data Structures & Algorithms",
      code: "CS301",
      instructor: "Prof. R. Sengupta",
      attendedClasses: 32,
      totalClasses: 38,
      percentage: 84.2,
      minRequiredPercent: 75,
      status: "Safe",
      classesNeededFor75: 0,
      lastUpdated: "2026-08-24"
    },
    {
      id: "sub-2",
      subject: "Operating Systems & Kernel Dev",
      code: "CS302",
      instructor: "Dr. Arvind Sharma",
      attendedClasses: 26,
      totalClasses: 36,
      percentage: 72.2,
      minRequiredPercent: 75,
      status: "Warning",
      classesNeededFor75: 4,
      lastUpdated: "2026-08-24"
    },
    {
      id: "sub-3",
      subject: "Database Management Systems",
      code: "CS303",
      instructor: "Dr. Maya Patil",
      attendedClasses: 30,
      totalClasses: 38,
      percentage: 78.9,
      minRequiredPercent: 75,
      status: "Safe",
      classesNeededFor75: 0,
      lastUpdated: "2026-08-24"
    },
    {
      id: "sub-4",
      subject: "Machine Learning & Neural Nets",
      code: "CS304",
      instructor: "Prof. K. Venkatesh",
      attendedClasses: 24,
      totalClasses: 32,
      percentage: 75.0,
      minRequiredPercent: 75,
      status: "Warning",
      classesNeededFor75: 1,
      lastUpdated: "2026-08-24"
    },
    {
      id: "sub-5",
      subject: "Digital Signal Processing",
      code: "CS305",
      instructor: "Dr. H. Roy",
      attendedClasses: 22,
      totalClasses: 34,
      percentage: 64.7,
      minRequiredPercent: 75,
      status: "Critical",
      classesNeededFor75: 14,
      lastUpdated: "2026-08-24"
    }
  ],
  academicTrend: "Declining",
  currentCGPA: 7.2,
  pendingAssignmentsCount: 3,
  missedDeadlinesCount: 2,
  engagementScore: 58,
  alertResponseRate: 64,
  feeDueStatus: {
    feeName: "Semester 6 Examination & Lab Fee",
    amount: 4500,
    dueDate: "2026-08-28",
    isPaid: false,
    gracePeriodDaysRemaining: 3
  },
  deadlines: [
    {
      id: "dl-1",
      title: "DSP Lab Assignment #3: FFT Analysis",
      subject: "Digital Signal Processing",
      category: "Academic",
      dueDate: "2026-08-26",
      dueTime: "23:59",
      priority: "High",
      status: "Pending",
      description: "Submit Matlab code and frequency spectrum plots for lab 3."
    },
    {
      id: "dl-2",
      title: "OS Process Scheduling Implementation",
      subject: "Operating Systems & Kernel Dev",
      category: "Deadline",
      dueDate: "2026-08-27",
      dueTime: "17:00",
      priority: "High",
      status: "Pending",
      description: "Complete round-robin and priority scheduling simulator."
    },
    {
      id: "dl-3",
      title: "Semester Exam Fee & Hall Ticket Dues",
      subject: "Administration / Examination Cell",
      category: "Fee Payment",
      dueDate: "2026-08-28",
      dueTime: "16:00",
      priority: "Emergency",
      status: "Pending",
      description: "Clear exam fees to avoid ₹500 late surcharge and portal lock."
    },
    {
      id: "dl-4",
      title: "Machine Learning Unit Test 2",
      subject: "Machine Learning & Neural Nets",
      category: "Exam",
      dueDate: "2026-08-30",
      dueTime: "10:00",
      priority: "High",
      status: "Pending",
      description: "Syllabus: Backpropagation, CNN layers, Loss optimizations."
    },
    {
      id: "dl-5",
      title: "Capstone Project Review Phase 1",
      subject: "Project Review",
      category: "Project Review",
      dueDate: "2026-09-02",
      dueTime: "14:00",
      priority: "Medium",
      status: "Pending",
      description: "Present architecture diagrams, database schema & sprint plan."
    },
    {
      id: "dl-6",
      title: "Annual University TechFest Hackathon",
      subject: "College Event",
      category: "College Event",
      dueDate: "2026-09-08",
      dueTime: "18:00",
      priority: "Low",
      status: "Pending",
      description: "Early team registration open for 36-hour hackathon."
    }
  ]
};

// Calculate classes needed to achieve 75% minimum attendance
export function calculateClassesToRecover(attended: number, total: number, targetPercent: number = 75): number {
  if (total === 0) return 0;
  const currentRatio = (attended / total) * 100;
  if (currentRatio >= targetPercent) return 0;
  
  // (attended + x) / (total + x) >= targetRatio
  // attended + x >= targetRatio * total + targetRatio * x
  // x * (1 - targetRatio) >= targetRatio * total - attended
  // x >= (targetRatio * total - attended) / (1 - targetRatio)
  const targetRatio = targetPercent / 100;
  const numerator = targetRatio * total - attended;
  const denominator = 1 - targetRatio;
  if (denominator <= 0) return 0;
  return Math.ceil(numerator / denominator);
}

// Recalculate full subject attendance object when days are modified by a user
export function recomputeSubjectRecord(
  record: {
    id?: string;
    subject?: string;
    code?: string;
    instructor?: string;
    attendedClasses: number;
    totalClasses: number;
    minRequiredPercent?: number;
  }
): {
  id: string;
  subject: string;
  code: string;
  instructor: string;
  attendedClasses: number;
  totalClasses: number;
  percentage: number;
  minRequiredPercent: number;
  status: 'Safe' | 'Warning' | 'Critical';
  classesNeededFor75: number;
  lastUpdated: string;
} {
  const attended = Math.max(0, record.attendedClasses);
  const total = Math.max(attended, record.totalClasses);
  const minPercent = record.minRequiredPercent ?? 75;
  const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100;
  
  let status: 'Safe' | 'Warning' | 'Critical' = 'Safe';
  if (percentage < 65) {
    status = 'Critical';
  } else if (percentage < minPercent) {
    status = 'Warning';
  }

  const needed = calculateClassesToRecover(attended, total, minPercent);

  return {
    id: record.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    subject: record.subject || 'General Course',
    code: record.code || 'GEN101',
    instructor: record.instructor || 'Faculty',
    attendedClasses: attended,
    totalClasses: total,
    percentage,
    minRequiredPercent: minPercent,
    status,
    classesNeededFor75: needed,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

// Compute aggregate attendance % across all subject records
export function recomputeOverallAttendance(subjects: { attendedClasses: number; totalClasses: number }[]): number {
  if (!subjects || subjects.length === 0) return 100;
  const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
  const totalHeld = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
  if (totalHeld === 0) return 100;
  return Number(((totalAttended / totalHeld) * 100).toFixed(1));
}

export const DEFAULT_STUDENT_PROFILE = INITIAL_STUDENT_PROFILE;

// Calculate Risk Level and Score from Student Metrics
export function evaluateStudentRisk(input: StudentAcademicProfile | {
  attendancePercent?: number;
  overallAttendance?: number;
  pendingAssignments?: number;
  pendingAssignmentsCount?: number;
  missedDeadlines?: number;
  missedDeadlinesCount?: number;
  academicTrend: string;
  engagementLevel?: number;
  engagementScore?: number;
  selectedModel?: MLModelType;
}): {
  riskScore: number;
  riskLevel: RiskLevel;
  overallAttendance: number;
  confidence: number;
  keyFactors: string[];
  positiveFactors: string[];
} {
  let score = 0;
  const factors: string[] = [];
  const positive: string[] = [];

  const raw = input as any;
  const att: number = raw.overallAttendance ?? raw.attendancePercent ?? 75;
  const targetThreshold: number = raw.targetAttendancePercentage ?? raw.targetThreshold ?? 75;
  const pending: number = raw.pendingAssignmentsCount ?? raw.pendingAssignments ?? 0;
  const missed: number = raw.missedDeadlinesCount ?? raw.missedDeadlines ?? 0;
  const engagement: number = raw.engagementScore ?? raw.engagementLevel ?? 60;
  const trend: string = raw.academicTrend || 'Stable';

  // Attendance Factor (Calculated STRICTLY relative to user's expected target percentage)
  // Only triggers warning penalty when actual attendance < user target percentage
  if (att < targetThreshold) {
    const gap = Number((targetThreshold - att).toFixed(1));
    if (gap > 8) {
      score += 35;
      factors.push(`Critical attendance shortage: ${att.toFixed(1)}% is ${gap}% below your ${targetThreshold}% target. Attend upcoming classes regularly.`);
    } else if (gap > 3) {
      score += 24;
      factors.push(`Attendance deficit: ${att.toFixed(1)}% is ${gap}% below your ${targetThreshold}% target. Attend upcoming classes regularly.`);
    } else {
      score += 12;
      factors.push(`Attendance warning: ${att.toFixed(1)}% is below your expected target of ${targetThreshold}% (-${gap}%). Attend upcoming classes regularly.`);
    }
  } else {
    // Attendance meets or exceeds target -> NO penalty, add positive signal
    score += 0;
    positive.push(`Attendance (${att.toFixed(1)}%) meets or exceeds your ${targetThreshold}% target.`);
  }

  // Pending Assignments (Weight: 25%)
  if (pending >= 4) {
    score += 25;
    factors.push(`Severe backlog with ${pending} pending assignments`);
  } else if (pending >= 2) {
    score += 18;
    factors.push(`Multiple pending coursework submissions (${pending} pending)`);
  } else if (pending === 1) {
    score += 8;
    factors.push(`1 pending assignment awaiting submission`);
  } else {
    positive.push(`All coursework assignments up to date`);
  }

  // Missed Deadlines (Weight: 20%)
  if (missed >= 3) {
    score += 20;
    factors.push(`High failure frequency: ${missed} missed deadlines in past 30 days`);
  } else if (missed >= 1) {
    score += 14;
    factors.push(`Recent missed deadline history (${missed} past due)`);
  } else {
    positive.push(`Zero missed deadlines in recent academic period`);
  }

  // Academic Trend (Weight: 15%)
  if (trend === 'Critical') {
    score += 15;
    factors.push(`Sharp downward internal test performance trajectory`);
  } else if (trend === 'Declining') {
    score += 12;
    factors.push(`Recent academic marks & quiz performances are declining`);
  } else if (trend === 'Stable') {
    score += 5;
    positive.push(`Consistent academic performance across subjects`);
  } else {
    positive.push(`Upward academic grade and quiz trajectory`);
  }

  // Engagement Factor (Weight: 5%)
  if (engagement < 45) {
    score += 5;
    factors.push(`Low LMS portal and study engagement index (${engagement}%)`);
  } else if (engagement >= 75) {
    positive.push(`High active engagement with study materials (${engagement}%)`);
  }

  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  let riskLevel: RiskLevel = 'Safe';
  if (normalizedScore >= 75) {
    riskLevel = 'Critical';
  } else if (normalizedScore >= 55) {
    riskLevel = 'Action Required';
  } else if (normalizedScore >= 35) {
    riskLevel = 'Warning';
  } else {
    riskLevel = 'Safe';
  }

  const confidence = 92 + (normalizedScore % 7);

  return {
    riskScore: normalizedScore,
    riskLevel,
    overallAttendance: att,
    confidence,
    keyFactors: factors,
    positiveFactors: positive
  };
}

// Generate Personalized Alert Feed from Student Profile
export function generatePersonalizedAlerts(profile: StudentAcademicProfile): AlertNotificationItem[] {
  const alerts: AlertNotificationItem[] = [];
  const now = Date.now();
  const targetThreshold: number = (profile as any).targetAttendancePercentage ?? (profile as any).targetThreshold ?? 75;
  const isAttendanceShortfall = profile.overallAttendance < targetThreshold;

  // 1. Attendance Warning Alert - Strictly fires ONLY when actual attendance is below user target
  if (isAttendanceShortfall) {
    const gap = Number((targetThreshold - profile.overallAttendance).toFixed(1));
    const isCritical = gap > 8;
    const isModerate = gap > 3;

    alerts.push({
      id: "alert-attendance-shortage",
      title: isCritical 
        ? `🚨 CRITICAL: Attendance Shortage (${profile.overallAttendance.toFixed(1)}%)`
        : `⚠️ Attendance Warning: Below ${targetThreshold}% Target`,
      message: `Your attendance is below your expected percentage. Current: ${profile.overallAttendance.toFixed(1)}% | Expected Target: ${targetThreshold}% | Deficit: -${gap}%. Attend upcoming classes regularly.`,
      category: "Attendance",
      priority: isCritical ? "Emergency" : isModerate ? "High" : "Medium",
      riskLevel: isCritical ? "Critical" : isModerate ? "Action Required" : "Warning",
      timestamp: now - 1000 * 60 * 15,
      dateStr: "Today, 10:15 AM",
      isRead: false,
      actionRequired: true,
      earlyWarning: true,
      recommendedActions: [
        `Attend upcoming consecutive classes without absence to reach ${targetThreshold}%`,
        `Check with course instructor regarding attendance registers and condonation rules`,
        `Submit medical/official proof for excused absences if available`
      ],
      dispatchedChannels: isCritical ? ["In-App", "Email", "SMS", "Push"] : ["In-App", "Push"]
    });
  }

  // 2. Academic Performance & Assignments Warning (Only fires if there are pending assignments or declining trend)
  if (profile.pendingAssignmentsCount >= 2 || profile.academicTrend === 'Declining') {
    alerts.push({
      id: "alert-core-1",
      title: "⚠️ Academic Early Warning",
      message: `Your recent performance indicates a possible decline with ${profile.pendingAssignmentsCount} pending assignments. Complete the pending assignments and attend upcoming classes regularly.`,
      category: "Academic",
      priority: profile.pendingAssignmentsCount >= 3 ? "High" : "Medium",
      riskLevel: profile.pendingAssignmentsCount >= 3 ? "Action Required" : "Warning",
      timestamp: now - 1000 * 60 * 60 * 2,
      dateStr: "Today, 08:30 AM",
      isRead: false,
      actionRequired: true,
      earlyWarning: true,
      recommendedActions: [
        "Review lecture recordings for pending coursework",
        "Submit pending assignments before upcoming deadlines",
        "Attend all upcoming lectures this week"
      ],
      dispatchedChannels: ["In-App", "Push"]
    });
  }

  // 3. Subject-wise Critical Attendance Alert (Only if subject is below target threshold)
  const criticalSub = profile.subjects.find(s => s.percentage < targetThreshold);
  if (criticalSub && isAttendanceShortfall) {
    alerts.push({
      id: "alert-att-dsp",
      title: `🚨 Attendance Shortage: ${criticalSub.subject} (${criticalSub.percentage.toFixed(1)}%)`,
      message: `Your attendance in ${criticalSub.code} is below your expected target of ${targetThreshold}%. Attend upcoming classes regularly.`,
      category: "Attendance",
      priority: "Emergency",
      riskLevel: "Critical",
      timestamp: now - 1000 * 60 * 60 * 5,
      dateStr: "Today, 05:00 AM",
      isRead: false,
      actionRequired: true,
      subject: criticalSub.subject,
      recommendedActions: [
        `Attend next ${criticalSub.classesNeededFor75 || 4} classes without missing any slot`,
        `Submit medical/official duty certificate to HOD if applicable`,
        `Meet Course Instructor ${criticalSub.instructor}`
      ],
      dispatchedChannels: ["In-App", "Email", "SMS"]
    });
  }

  // 4. Fee Payment Deadline Alert (Emergency)
  if (!profile.feeDueStatus.isPaid) {
    alerts.push({
      id: "alert-fee-1",
      title: `💰 Urgent: ${profile.feeDueStatus.feeName} Due in ${profile.feeDueStatus.gracePeriodDaysRemaining} Days`,
      message: `Outstanding fee amount of ₹${profile.feeDueStatus.amount.toLocaleString()} is due on ${profile.feeDueStatus.dueDate}. Late submissions will incur ₹500 fee surcharge and hall ticket generation will be frozen.`,
      category: "Fee Payment",
      priority: "Emergency",
      riskLevel: "Action Required",
      timestamp: now - 1000 * 60 * 60 * 18,
      dateStr: "Yesterday, 04:20 PM",
      isRead: true,
      actionRequired: true,
      deadlineCountdown: `${profile.feeDueStatus.gracePeriodDaysRemaining} days remaining`,
      recommendedActions: [
        "Pay fee online via University Payment Gateway",
        "Download digital receipt and verify exam registration status"
      ],
      dispatchedChannels: ["In-App", "SMS", "Email"],
      smsSnippet: {
        senderId: "UNIV-FEES",
        messageText: `Reminder: ₹${profile.feeDueStatus.amount} due for ${profile.feeDueStatus.feeName} by ${profile.feeDueStatus.dueDate}. Avoid late fines: pay.univ.edu`
      }
    });
  }

  // 5. Assignment Deadline Tomorrow Alert
  alerts.push({
    id: "alert-dl-dsp",
    title: "⏳ Assignment Due in 24 Hours: DSP Lab #3",
    message: "Digital Signal Processing Lab Assignment #3 (FFT Analysis) is due tomorrow at 23:59. Failure to submit will result in loss of 15 internal marks.",
    category: "Deadline",
    priority: "High",
    riskLevel: "Warning",
    timestamp: now - 1000 * 60 * 60 * 26,
    dateStr: "Yesterday, 08:00 AM",
    isRead: true,
    actionRequired: true,
    deadlineCountdown: "Due Tomorrow",
    recommendedActions: [
      "Finish Matlab simulation script",
      "Attach PDF report with spectrum graphs",
      "Upload to Course LMS portal before 23:59"
    ],
    dispatchedChannels: ["In-App", "Push"]
  });

  // 6. Upcoming Examination Reminder
  alerts.push({
    id: "alert-exam-ml",
    title: "📝 Examination Notice: ML Unit Test 2",
    message: "Machine Learning Unit Test 2 scheduled on August 30, 2026 (10:00 AM) in Room 304. Weightage: 20% of semester internal marks.",
    category: "Exam",
    priority: "Medium",
    riskLevel: "Safe",
    timestamp: now - 1000 * 60 * 60 * 48,
    dateStr: "2 days ago",
    isRead: true,
    actionRequired: false,
    deadlineCountdown: "In 5 days",
    recommendedActions: [
      "Review Chapter 4 (CNNs) & Chapter 5 (Backpropagation)",
      "Solve previous year question paper from department repository"
    ],
    dispatchedChannels: ["In-App", "Email"]
  });

  // 7. Capstone Project Review 1
  alerts.push({
    id: "alert-project-review",
    title: "👥 Project Milestone: Capstone Review Phase 1",
    message: "Faculty evaluation panel will review system design documentation and sprint deliverables on September 02, 2026.",
    category: "Project Review",
    priority: "Medium",
    riskLevel: "Safe",
    timestamp: now - 1000 * 60 * 60 * 72,
    dateStr: "3 days ago",
    isRead: true,
    actionRequired: false,
    deadlineCountdown: "In 8 days",
    recommendedActions: [
      "Sync with project teammates on sprint completion",
      "Prepare 10-minute presentation slides"
    ],
    dispatchedChannels: ["In-App"]
  });

  // 8. Campus Event Announcement
  alerts.push({
    id: "alert-event-hackathon",
    title: "🚀 College Activity: Annual University Hackathon",
    message: "Registration is open for the 36-hour Inter-College Hackathon with ₹1,00,000 prize pool. Early bird closes September 08.",
    category: "College Event",
    priority: "Low",
    riskLevel: "Safe",
    timestamp: now - 1000 * 60 * 60 * 96,
    dateStr: "4 days ago",
    isRead: true,
    actionRequired: false,
    recommendedActions: [
      "Form a team of 3-4 members",
      "Submit project idea draft on hackathon portal"
    ],
    dispatchedChannels: ["In-App"]
  });

  return alerts;
}

// Generate "What Should I Do Now?" Action Items
export function generateActionRecommendations(profile: StudentAcademicProfile): ActionRecommendation[] {
  return [
    {
      id: "act-1",
      title: "Submit DSP Lab Assignment #3 (FFT Analysis)",
      description: "Due tomorrow (23:59). Finishing this avoids losing 15 internal marks and directly reduces academic risk score.",
      urgency: "High",
      category: "Academic",
      targetSubject: "Digital Signal Processing",
      estimatedEffort: "45 mins",
      completed: false,
      actionType: "submit_assignment"
    },
    {
      id: "act-2",
      title: "Schedule Meeting with Faculty Advisor (Dr. Arvind Sharma)",
      description: "Discuss recovery strategy for declining test scores and request approval for extra tutorial credit.",
      urgency: "High",
      category: "Academic",
      targetSubject: "Operating Systems",
      estimatedEffort: "15 mins",
      completed: false,
      actionType: "contact_faculty"
    },
    {
      id: "act-3",
      title: "Attend Next 4 Consecutive Operating Systems Lectures",
      description: "Current OS attendance is 72.2%. Attending 4 continuous classes will lift your score to 76.1% (safely above the 75% debarment cutoff).",
      urgency: "High",
      category: "Attendance",
      targetSubject: "Operating Systems",
      estimatedEffort: "4 Hours (Spread across this week)",
      completed: false,
      actionType: "attend_classes"
    },
    {
      id: "act-4",
      title: "Pay Semester Exam Fee (₹4,500)",
      description: "Clear exam dues before August 28 to avoid ₹500 late surcharge and prevent exam hall ticket lock.",
      urgency: "Emergency",
      category: "Fee Payment",
      estimatedEffort: "3 mins",
      completed: false,
      actionType: "pay_fee"
    },
    {
      id: "act-5",
      title: "Start ML Unit Test 2 Revision (Backpropagation & CNNs)",
      description: "Exam is in 5 days. Complete 2 revision modules to ensure internal marks recovery.",
      urgency: "Medium",
      category: "Exam",
      targetSubject: "Machine Learning",
      estimatedEffort: "1.5 hours",
      completed: false,
      actionType: "schedule_study"
    }
  ];
}

// ML Model Evaluation Benchmark Dataset
export const ML_MODEL_BENCHMARKS: MLModelEvaluation[] = [
  {
    modelName: "Random Forest",
    accuracy: 94.8,
    precision: 93.6,
    recall: 95.2,
    f1Score: 94.4,
    latencyMs: 14,
    confusionMatrix: {
      truePositive: 95,
      falsePositive: 6,
      trueNegative: 94,
      falseNegative: 5
    },
    description: "Ensemble of 100 decision trees with feature bagging. Superior generalization across non-linear student behavior patterns.",
    keyStrengths: "Robust to outliers, handles multi-modal risk distributions, high F1 score on imbalanced student records."
  },
  {
    modelName: "XGBoost",
    accuracy: 95.6,
    precision: 94.9,
    recall: 96.0,
    f1Score: 95.4,
    latencyMs: 18,
    confusionMatrix: {
      truePositive: 96,
      falsePositive: 5,
      trueNegative: 95,
      falseNegative: 4
    },
    description: "Gradient boosted decision trees with second-order Taylor expansion loss minimization and L2 regularization.",
    keyStrengths: "Highest overall accuracy & recall; optimal for early identification of at-risk students before critical debarment."
  },
  {
    modelName: "Logistic Regression",
    accuracy: 89.2,
    precision: 88.5,
    recall: 90.1,
    f1Score: 89.3,
    latencyMs: 3,
    confusionMatrix: {
      truePositive: 90,
      falsePositive: 11,
      trueNegative: 89,
      falseNegative: 10
    },
    description: "Linear log-odds probability estimator with Sigmoid activation function and L1 Lasso feature selection.",
    keyStrengths: "Ultra-fast inference (3ms), highly interpretable regression coefficients for administrative reporting."
  },
  {
    modelName: "Decision Tree",
    accuracy: 91.4,
    precision: 90.2,
    recall: 92.4,
    f1Score: 91.3,
    latencyMs: 6,
    confusionMatrix: {
      truePositive: 92,
      falsePositive: 9,
      trueNegative: 91,
      falseNegative: 8
    },
    description: "CART tree with Gini impurity splitting criteria and cost-complexity pruning (ccp_alpha=0.015).",
    keyStrengths: "Direct transparent if-then decision paths; easily converted into human-readable compliance rules."
  }
];

// Interactive AI Alert Simulator Inference Engine
export function runSimulatorInference(input: SimulatorInput): SimulatorPredictionResult {
  let rawScore = 0;
  const keyRiskFactors: string[] = [];
  const positiveFactors: string[] = [];
  const featureWeights: { feature: string; impactScore: number; direction: 'increases_risk' | 'decreases_risk' }[] = [];

  // 1. Attendance Impact
  if (input.attendancePercent < 65) {
    rawScore += 38;
    keyRiskFactors.push(`Severe attendance crisis (${input.attendancePercent}% vs 75% minimum requirement)`);
    featureWeights.push({ feature: 'Attendance Rate', impactScore: 38, direction: 'increases_risk' });
  } else if (input.attendancePercent < 75) {
    rawScore += 26;
    keyRiskFactors.push(`Attendance deficit (${input.attendancePercent}% below mandatory 75% threshold)`);
    featureWeights.push({ feature: 'Attendance Rate', impactScore: 26, direction: 'increases_risk' });
  } else if (input.attendancePercent < 80) {
    rawScore += 12;
    keyRiskFactors.push(`Borderline attendance (${input.attendancePercent}%) with minimal absence cushion`);
    featureWeights.push({ feature: 'Attendance Rate', impactScore: 12, direction: 'increases_risk' });
  } else {
    positiveFactors.push(`Healthy attendance percentage (${input.attendancePercent}%)`);
    featureWeights.push({ feature: 'Attendance Rate', impactScore: -15, direction: 'decreases_risk' });
  }

  // 2. Pending Assignments
  if (input.pendingAssignments >= 4) {
    rawScore += 26;
    keyRiskFactors.push(`Significant coursework backlog (${input.pendingAssignments} pending assignments)`);
    featureWeights.push({ feature: 'Pending Tasks', impactScore: 26, direction: 'increases_risk' });
  } else if (input.pendingAssignments >= 2) {
    rawScore += 18;
    keyRiskFactors.push(`Multiple pending assignments (${input.pendingAssignments}) requiring immediate submission`);
    featureWeights.push({ feature: 'Pending Tasks', impactScore: 18, direction: 'increases_risk' });
  } else if (input.pendingAssignments === 1) {
    rawScore += 8;
    keyRiskFactors.push(`1 pending assignment awaiting review`);
    featureWeights.push({ feature: 'Pending Tasks', impactScore: 8, direction: 'increases_risk' });
  } else {
    positiveFactors.push(`Zero pending assignments`);
    featureWeights.push({ feature: 'Pending Tasks', impactScore: -10, direction: 'decreases_risk' });
  }

  // 3. Missed Deadlines
  if (input.missedDeadlines >= 3) {
    rawScore += 22;
    keyRiskFactors.push(`Chronic deadline breach history (${input.missedDeadlines} missed deadlines)`);
    featureWeights.push({ feature: 'Missed Deadlines', impactScore: 22, direction: 'increases_risk' });
  } else if (input.missedDeadlines >= 1) {
    rawScore += 14;
    keyRiskFactors.push(`Recent missed deadline record (${input.missedDeadlines} overdue tasks)`);
    featureWeights.push({ feature: 'Missed Deadlines', impactScore: 14, direction: 'increases_risk' });
  } else {
    positiveFactors.push(`Zero missed deadlines`);
    featureWeights.push({ feature: 'Missed Deadlines', impactScore: -10, direction: 'decreases_risk' });
  }

  // 4. Academic Trend
  if (input.academicTrend === 'Critical') {
    rawScore += 16;
    keyRiskFactors.push(`Critical downward trajectory in internal marks`);
    featureWeights.push({ feature: 'Academic Trend', impactScore: 16, direction: 'increases_risk' });
  } else if (input.academicTrend === 'Declining') {
    rawScore += 12;
    keyRiskFactors.push(`Recent academic marks & quiz scores declining`);
    featureWeights.push({ feature: 'Academic Trend', impactScore: 12, direction: 'increases_risk' });
  } else if (input.academicTrend === 'Stable') {
    rawScore += 4;
    positiveFactors.push(`Stable academic track record`);
    featureWeights.push({ feature: 'Academic Trend', impactScore: 4, direction: 'decreases_risk' });
  } else {
    positiveFactors.push(`Improving academic grade trajectory`);
    featureWeights.push({ feature: 'Academic Trend', impactScore: -12, direction: 'decreases_risk' });
  }

  // 5. Days Until Event / Deadline Proximity
  if (input.daysUntilDeadline <= 2) {
    rawScore += 12;
    keyRiskFactors.push(`Urgent timeline: Event/Deadline occurs in ${input.daysUntilDeadline} day(s)`);
    featureWeights.push({ feature: 'Deadline Proximity', impactScore: 12, direction: 'increases_risk' });
  } else if (input.daysUntilDeadline <= 5) {
    rawScore += 6;
    keyRiskFactors.push(`Approaching timeline (${input.daysUntilDeadline} days remaining)`);
    featureWeights.push({ feature: 'Deadline Proximity', impactScore: 6, direction: 'increases_risk' });
  } else {
    positiveFactors.push(`Adequate preparation window (${input.daysUntilDeadline} days)`);
    featureWeights.push({ feature: 'Deadline Proximity', impactScore: -5, direction: 'decreases_risk' });
  }

  // 6. Engagement Score
  if (input.engagementLevel < 40) {
    rawScore += 8;
    keyRiskFactors.push(`Low LMS portal engagement (${input.engagementLevel}%)`);
    featureWeights.push({ feature: 'Student Engagement', impactScore: 8, direction: 'increases_risk' });
  } else if (input.engagementLevel >= 80) {
    positiveFactors.push(`High active engagement with study portal (${input.engagementLevel}%)`);
    featureWeights.push({ feature: 'Student Engagement', impactScore: -8, direction: 'decreases_risk' });
  }

  // Model Specific Adjustments
  if (input.selectedModel === 'XGBoost') {
    rawScore = Math.round(rawScore * 1.02);
  } else if (input.selectedModel === 'Logistic Regression') {
    // Sigmoid compression simulation
    const z = (rawScore - 45) / 18;
    const sig = 1 / (1 + Math.exp(-z));
    rawScore = Math.round(sig * 100);
  }

  const finalScore = Math.min(100, Math.max(5, rawScore));

  let predictedRiskLevel: RiskLevel = 'Safe';
  let expectedOutcome = '';
  const recommendedActions: string[] = [];

  if (finalScore >= 75) {
    predictedRiskLevel = 'Critical';
    expectedOutcome = `High probability of examination debarment, severe internal mark loss, and academic probation for ${input.eventType}.`;
    recommendedActions.push(
      `Immediately complete all ${input.pendingAssignments} pending assignments within 24 hours.`,
      `Attend every upcoming lecture without missing any slot to recover attendance.`,
      `Contact course faculty and department advisor for emergency academic intervention.`
    );
  } else if (finalScore >= 52) {
    predictedRiskLevel = 'Action Required';
    expectedOutcome = `Possible academic difficulty or late submission penalty during ${input.eventType}.`;
    recommendedActions.push(
      `Submit pending coursework before the ${input.daysUntilDeadline}-day window expires.`,
      `Attend upcoming classes consistently to stabilize attendance above 78%.`,
      `Revise core syllabus topics and consult course teaching assistants.`
    );
  } else if (finalScore >= 32) {
    predictedRiskLevel = 'Warning';
    expectedOutcome = `Moderate risk: Performance is stable but vulnerable to future deadline slips.`;
    recommendedActions.push(
      `Clear any remaining pending items to maintain a safety buffer.`,
      `Keep attendance above 80% to protect against unexpected medical absences.`,
      `Follow weekly study schedule for ${input.eventType}.`
    );
  } else {
    predictedRiskLevel = 'Safe';
    expectedOutcome = `Excellent standing: Low probability of academic or administrative issues.`;
    recommendedActions.push(
      `Maintain current consistent attendance and study routine.`,
      `Continue timely submissions for upcoming semester milestones.`
    );
  }

  return {
    predictedRiskLevel,
    riskScore: finalScore,
    probabilityPercent: Math.min(99, Math.max(10, finalScore + (input.selectedModel === 'XGBoost' ? 2 : 0))),
    expectedOutcome,
    recommendedActions,
    keyRiskFactors,
    positiveFactors,
    featureWeights
  };
}
