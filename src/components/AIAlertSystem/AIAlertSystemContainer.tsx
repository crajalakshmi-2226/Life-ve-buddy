import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Cpu, 
  Database, 
  Sliders, 
  Calendar, 
  BarChart2, 
  TrendingDown, 
  TrendingUp, 
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { 
  StudentAcademicProfile, 
  AlertNotificationItem, 
  ActionRecommendation, 
  SubjectAttendanceRecord, 
  StudentDeadlineItem,
  RiskLevel
} from '../../types';
import { AlertsFeed } from './AlertsFeed';
import { WhatShouldIDoNow } from './WhatShouldIDoNow';
import { AIAlertSimulator } from './AIAlertSimulator';
import { DataMonitoringDashboard } from './DataMonitoringDashboard';
import { MLModelComparison } from './MLModelComparison';
import { MultiChannelModal } from './MultiChannelModal';

interface AIAlertSystemContainerProps {
  profile: StudentAcademicProfile;
  alerts: AlertNotificationItem[];
  recommendations: ActionRecommendation[];
  onUpdateProfile: (profile: Partial<StudentAcademicProfile>) => void;
  onUpdateAlerts: (alerts: AlertNotificationItem[]) => void;
  onUpdateRecommendations: (recommendations: ActionRecommendation[]) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const AIAlertSystemContainer: React.FC<AIAlertSystemContainerProps> = ({
  profile,
  alerts,
  recommendations,
  onUpdateProfile,
  onUpdateAlerts,
  onUpdateRecommendations,
  soundEnabled,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'action_plan' | 'simulator' | 'data_monitoring' | 'ml_benchmarks'>('feed');
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertNotificationItem | null>(null);

  // Computed Counters
  const totalAlerts = alerts.length;
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const criticalCount = alerts.filter(a => a.priority === 'Emergency' || a.priority === 'High' || a.riskLevel === 'Critical').length;
  const upcomingDeadlinesCount = profile.deadlines.filter(d => d.status === 'Pending').length;

  const handleMarkAsRead = (alertId: string) => {
    onUpdateAlerts(alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const handleMarkAllAsRead = () => {
    onUpdateAlerts(alerts.map(a => ({ ...a, isRead: true })));
    onToast("✅ All Alerts Read", "Marked all active notifications as acknowledged.", "info");
  };

  const handleToggleAction = (actionId: string) => {
    onUpdateRecommendations(recommendations.map(r => {
      if (r.id === actionId) {
        return { ...r, completed: !r.completed };
      }
      return r;
    }));
  };

  const handleAddAction = (title: string, category: ActionRecommendation['category'], urgency: any, effort: string) => {
    const newAction: ActionRecommendation = {
      id: `act-custom-${Date.now()}`,
      title,
      description: "User-defined preventive academic step",
      urgency,
      category,
      estimatedEffort: effort,
      completed: false,
      actionType: 'general'
    };
    onUpdateRecommendations([newAction, ...recommendations]);
  };

  const getRiskBadgeStyles = (risk: RiskLevel) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-600 text-white border-rose-700 shadow-rose-200';
      case 'Action Required':
        return 'bg-amber-500 text-slate-950 border-amber-600 shadow-amber-200';
      case 'Warning':
        return 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-yellow-100';
      default:
        return 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-100';
    }
  };

  return (
    <section id="ai-alert-system" className="space-y-6">
      {/* SECTION BANNER: AI-Based Alert System */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-white rounded-3xl p-6 sm:p-7 border border-purple-800 shadow-lg space-y-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white text-2xl shadow-inner">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-purple-950 uppercase tracking-wider">
                  AI-Based Alert System
                </span>
                <span className="text-xs text-purple-300 font-medium">Continuous Risk Inference Engine</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-classic text-white mt-0.5">
                Personalized Student Alerts & Predictive Risk Defense
              </h1>
            </div>
          </div>

          {/* Student Badge & Risk Status */}
          <div className="flex items-center gap-3 bg-purple-900/70 p-3 rounded-2xl border border-purple-700 text-xs self-start md:self-auto">
            <div>
              <div className="font-bold text-white">{profile.studentName}</div>
              <div className="text-[11px] text-purple-300 font-mono">{profile.studentId} • {profile.branch}</div>
            </div>
            <div className="h-7 w-px bg-purple-700 mx-1" />
            <div className="text-center">
              <div className="text-[10px] text-purple-300 uppercase font-bold">Risk Level</div>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getRiskBadgeStyles(profile.riskLevel)}`}>
                {profile.riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Total Alerts */}
          <div className="p-3.5 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
            <div className="text-xs text-purple-300 font-medium flex items-center justify-between">
              <span>Active Alerts</span>
              <Bell className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {totalAlerts}
            </div>
            <div className="text-[10px] text-amber-300 font-semibold">
              {unreadAlerts} unread notification{unreadAlerts !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Card 2: Critical Alerts */}
          <div className="p-3.5 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
            <div className="text-xs text-purple-300 font-medium flex items-center justify-between">
              <span>Critical Issues</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-300">
              {criticalCount}
            </div>
            <div className="text-[10px] text-rose-200 font-semibold">
              Needs immediate action
            </div>
          </div>

          {/* Card 3: Upcoming Deadlines */}
          <div className="p-3.5 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
            <div className="text-xs text-purple-300 font-medium flex items-center justify-between">
              <span>Upcoming Deadlines</span>
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {upcomingDeadlinesCount}
            </div>
            <div className="text-[10px] text-purple-300 font-semibold">
              Exams, assignments & fees
            </div>
          </div>

          {/* Card 4: Overall Attendance */}
          <div className="p-3.5 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
            <div className="text-xs text-purple-300 font-medium flex items-center justify-between">
              <span>Attendance Rate</span>
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-300">
              {profile.overallAttendance}%
            </div>
            <div className="text-[10px] text-purple-300 font-semibold">
              Cutoff: 75% • Risk: {profile.riskScore}/100
            </div>
          </div>
        </div>

        {/* EARLY WARNING SYSTEM BANNER (Prompt Core Feature 9 Example) */}
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
              <span>⚠️ Academic Warning</span>
              <span className="text-[10px] bg-amber-400 text-purple-950 font-bold px-1.5 py-0.2 rounded-sm">Early Signal</span>
            </div>
            <p className="text-xs sm:text-sm text-white leading-relaxed font-medium">
              «⚠️ Academic Warning: Your recent performance indicates a possible decline. Complete the pending assignments and attend upcoming classes regularly.»
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-purple-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'feed'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts & Notifications ({unreadAlerts} Unread)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('action_plan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'action_plan'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>“What Should I Do Now?”</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>AI Alert Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data_monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'data_monitoring'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Real-Time Data & Deadlines</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ml_benchmarks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ml_benchmarks'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>ML Model Benchmarks</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'feed' && (
        <AlertsFeed
          alerts={alerts}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onOpenMultiChannelModal={(alert) => setSelectedAlertForModal(alert)}
          onToast={onToast}
        />
      )}

      {activeTab === 'action_plan' && (
        <WhatShouldIDoNow
          profile={profile}
          recommendations={recommendations}
          onToggleAction={handleToggleAction}
          onAddAction={handleAddAction}
          soundEnabled={soundEnabled}
          onToast={onToast}
        />
      )}

      {activeTab === 'simulator' && (
        <AIAlertSimulator
          currentProfile={profile}
          onApplyToProfile={(partial) => onUpdateProfile(partial)}
          onToast={onToast}
        />
      )}

      {activeTab === 'data_monitoring' && (
        <DataMonitoringDashboard
          profile={profile}
          onUpdateSubjects={(subs) => onUpdateProfile({ subjects: subs })}
          onUpdateDeadlines={(dls) => onUpdateProfile({ deadlines: dls })}
          onUpdateAttendanceLogs={(logs) => onUpdateProfile({ attendanceLogs: logs })}
          onUpdateFullProfile={onUpdateProfile}
          onToast={onToast}
        />
      )}

      {activeTab === 'ml_benchmarks' && (
        <MLModelComparison />
      )}

      {/* Multi-Channel Modal Preview */}
      <MultiChannelModal
        alert={selectedAlertForModal}
        isOpen={Boolean(selectedAlertForModal)}
        onClose={() => setSelectedAlertForModal(null)}
        studentName={profile.studentName}
      />
    </section>
  );
};
