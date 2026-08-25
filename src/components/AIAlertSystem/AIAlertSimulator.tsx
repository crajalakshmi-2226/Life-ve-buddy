import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Cpu, 
  BarChart2, 
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Zap
} from 'lucide-react';
import { SimulatorInput, MLModelType, AcademicTrend, StudentAcademicProfile } from '../../types';
import { runSimulatorInference } from '../../utils/aiRiskEngine';

interface AIAlertSimulatorProps {
  currentProfile: StudentAcademicProfile;
  onApplyToProfile?: (updatedFields: Partial<StudentAcademicProfile>) => void;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const AIAlertSimulator: React.FC<AIAlertSimulatorProps> = ({
  currentProfile,
  onApplyToProfile,
  onToast
}) => {
  const [simulatorState, setSimulatorState] = useState<SimulatorInput>({
    eventType: 'Upcoming Examination',
    attendancePercent: 76,
    pendingAssignments: 3,
    missedDeadlines: 2,
    academicTrend: 'Declining',
    daysUntilDeadline: 4,
    engagementLevel: 58,
    selectedModel: 'Random Forest'
  });

  // Real-time ML Inference calculation
  const prediction = useMemo(() => {
    return runSimulatorInference(simulatorState);
  }, [simulatorState]);

  // Preset Scenario Handlers
  const handleApplyPreset = (type: 'prompt_example' | 'critical_debarment' | 'ideal_safe' | 'fee_emergency') => {
    switch (type) {
      case 'prompt_example':
        setSimulatorState({
          eventType: 'Upcoming Examination',
          attendancePercent: 76,
          pendingAssignments: 3,
          missedDeadlines: 2,
          academicTrend: 'Declining',
          daysUntilDeadline: 3,
          engagementLevel: 55,
          selectedModel: 'Random Forest'
        });
        onToast("🎯 Benchmark Loaded", "Loaded standard prompt test case: 76% Att + 3 Pending + 2 Missed.", "info");
        break;

      case 'critical_debarment':
        setSimulatorState({
          eventType: 'Upcoming Examination',
          attendancePercent: 62,
          pendingAssignments: 5,
          missedDeadlines: 4,
          academicTrend: 'Critical',
          daysUntilDeadline: 2,
          engagementLevel: 35,
          selectedModel: 'XGBoost'
        });
        onToast("🚨 Critical Debarment Scenario", "Loaded severe attendance crisis simulation.", "alert");
        break;

      case 'ideal_safe':
        setSimulatorState({
          eventType: 'Normal Class Week' as any,
          attendancePercent: 91,
          pendingAssignments: 0,
          missedDeadlines: 0,
          academicTrend: 'Improving',
          daysUntilDeadline: 14,
          engagementLevel: 88,
          selectedModel: 'Random Forest'
        });
        onToast("✨ Ideal Safe Scenario", "Loaded honors student trajectory.", "success");
        break;

      case 'fee_emergency':
        setSimulatorState({
          eventType: 'Fee Payment',
          attendancePercent: 82,
          pendingAssignments: 1,
          missedDeadlines: 1,
          academicTrend: 'Stable',
          daysUntilDeadline: 1,
          engagementLevel: 65,
          selectedModel: 'Logistic Regression'
        });
        onToast("💰 Fee Emergency Scenario", "Loaded immediate fee deadline scenario.", "info");
        break;
    }
  };

  const handleSyncToLiveProfile = () => {
    if (onApplyToProfile) {
      onApplyToProfile({
        overallAttendance: simulatorState.attendancePercent,
        pendingAssignmentsCount: simulatorState.pendingAssignments,
        missedDeadlinesCount: simulatorState.missedDeadlines,
        academicTrend: simulatorState.academicTrend,
        engagementScore: simulatorState.engagementLevel,
        riskLevel: prediction.predictedRiskLevel,
        riskScore: prediction.riskScore
      });
      onToast("🔄 Profile Synced", "Applied simulated variables to live student academic dashboard.", "success");
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-600 text-white border-rose-700';
      case 'Action Required':
        return 'bg-amber-500 text-slate-950 border-amber-600';
      case 'Warning':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      default:
        return 'bg-emerald-600 text-white border-emerald-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulator Header & Presets */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl border border-purple-200">
              🧪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                  Interactive Sandbox
                </span>
                <span className="text-xs text-purple-600 font-medium">Predictive Risk Modeling</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950 mt-0.5">
                AI Alert & Predictive Risk Simulator
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleApplyPreset('prompt_example')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            <span>Reset to Standard Benchmark</span>
          </button>
        </div>

        {/* Quick Scenario Preset Buttons */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700">Quick Simulation Presets:</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('prompt_example')}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 transition-all cursor-pointer shadow-2xs"
            >
              📌 Prompt Benchmark (76% Att, 3 Pending, Declining)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('critical_debarment')}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 transition-all cursor-pointer shadow-2xs"
            >
              🚨 Critical Debarment Crisis
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ideal_safe')}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            >
              🌟 Safe Honors Student (91% Att)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('fee_emergency')}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer shadow-2xs"
            >
              💰 Fee Payment Deadline (1 Day)
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulator Grid: Controls (Left) & Real-Time ML Inference (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders & Parameters */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-purple-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <h3 className="text-sm font-bold font-classic text-purple-950 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-700" />
              <span>Input Simulation Features</span>
            </h3>

            {/* Model Selector */}
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <select
                value={simulatorState.selectedModel}
                onChange={(e) => setSimulatorState(prev => ({ ...prev, selectedModel: e.target.value as MLModelType }))}
                className="text-xs font-bold text-purple-950 bg-purple-50 border border-purple-300 rounded-lg px-2 py-1 focus:outline-hidden"
              >
                <option value="Random Forest">Random Forest</option>
                <option value="XGBoost">XGBoost (Boosted)</option>
                <option value="Logistic Regression">Logistic Regression</option>
                <option value="Decision Tree">Decision Tree</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Event Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Simulated Academic / Campus Event</label>
              <select
                value={simulatorState.eventType}
                onChange={(e) => setSimulatorState(prev => ({ ...prev, eventType: e.target.value as any }))}
                className="w-full px-3 py-2 bg-purple-50/70 border border-purple-300 rounded-xl font-medium text-purple-950 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                <option value="Upcoming Examination">Upcoming Examination / Unit Test</option>
                <option value="Project Review">Capstone Project Review Milestone</option>
                <option value="Fee Payment">Semester Fee Payment Deadline</option>
                <option value="Midterm Test">Midterm Assessment</option>
                <option value="Normal Class Week">Regular Class Routine</option>
              </select>
            </div>

            {/* Attendance Percentage Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Recent Attendance Rate</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  simulatorState.attendancePercent < 75 
                    ? 'bg-rose-100 text-rose-900 border border-rose-200' 
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  {simulatorState.attendancePercent}% {simulatorState.attendancePercent < 75 ? '(Below 75% Cutoff)' : '(Safe)'}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={simulatorState.attendancePercent}
                onChange={(e) => setSimulatorState(prev => ({ ...prev, attendancePercent: Number(e.target.value) }))}
                className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>50% (Critical)</span>
                <span className="text-rose-500 font-bold">75% (Mandatory Cutoff)</span>
                <span>100% (Perfect)</span>
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Pending Coursework Assignments</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 text-xs font-bold">
                  {simulatorState.pendingAssignments} tasks pending
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={simulatorState.pendingAssignments}
                onChange={(e) => setSimulatorState(prev => ({ ...prev, pendingAssignments: Number(e.target.value) }))}
                className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-700"
              />
            </div>

            {/* Missed Deadlines */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Missed Deadlines (Past 30 Days)</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 text-xs font-bold">
                  {simulatorState.missedDeadlines} missed
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={simulatorState.missedDeadlines}
                onChange={(e) => setSimulatorState(prev => ({ ...prev, missedDeadlines: Number(e.target.value) }))}
                className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-700"
              />
            </div>

            {/* Academic Trend & Days Left */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Recent Academic Trend</label>
                <select
                  value={simulatorState.academicTrend}
                  onChange={(e) => setSimulatorState(prev => ({ ...prev, academicTrend: e.target.value as AcademicTrend }))}
                  className="w-full px-3 py-2 bg-purple-50/70 border border-purple-300 rounded-xl font-medium text-purple-950 focus:outline-hidden"
                >
                  <option value="Improving">Improving (Upward Grades)</option>
                  <option value="Stable">Stable (Consistent)</option>
                  <option value="Declining">Declining (Down 10-15%)</option>
                  <option value="Critical">Critical (Multiple Backlogs)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">Days Until Deadline</span>
                  <span className="text-purple-900 font-bold">{simulatorState.daysUntilDeadline} days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simulatorState.daysUntilDeadline}
                  onChange={(e) => setSimulatorState(prev => ({ ...prev, daysUntilDeadline: Number(e.target.value) }))}
                  className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-700 mt-2"
                />
              </div>
            </div>

            {/* Student Engagement */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Student Portal Engagement Index</span>
                <span className="text-purple-900 font-bold">{simulatorState.engagementLevel}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={simulatorState.engagementLevel}
                onChange={(e) => setSimulatorState(prev => ({ ...prev, engagementLevel: Number(e.target.value) }))}
                className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Calculated Risk & Predictions */}
        <div className="lg:col-span-6 bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 text-white rounded-3xl p-5 sm:p-6 border border-purple-800 shadow-md space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-purple-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-classic text-white">
                  Real-Time Model Inference Output
                </h3>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded-md border border-purple-700">
                Engine: {simulatorState.selectedModel}
              </span>
            </div>

            {/* Risk Badge & Score Meter */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-200 font-medium">Predicted Risk Level:</span>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border shadow-xs ${getRiskColor(prediction.predictedRiskLevel)}`}>
                  {prediction.predictedRiskLevel}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-300">Composite Risk Index</span>
                  <span className="font-bold text-amber-300">{prediction.riskScore} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-purple-900/90 rounded-full overflow-hidden border border-purple-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      prediction.riskScore >= 75
                        ? 'bg-rose-500'
                        : prediction.riskScore >= 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${prediction.riskScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expected Outcome */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Expected Outcome & Trajectory:</span>
              </div>
              <p className="text-xs text-purple-100 bg-purple-900/60 p-3 rounded-xl border border-purple-700/60 leading-relaxed font-medium">
                {prediction.expectedOutcome}
              </p>
            </div>

            {/* Dynamic AI Recommended Action */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Prescribed AI Recommendations:</span>
              </div>
              <div className="space-y-1.5">
                {prediction.recommendedActions.map((action, i) => (
                  <div key={i} className="text-xs text-purple-100 bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">•</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Impact Bar Breakdown */}
            <div className="space-y-2 pt-2 border-t border-purple-800/80">
              <span className="text-[11px] font-bold text-purple-300">Feature Contribution to Current Risk:</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {prediction.featureWeights.map((fw, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-purple-900/50 border border-purple-800/70 flex items-center justify-between">
                    <span className="text-purple-200 truncate">{fw.feature}</span>
                    <span className={`font-bold ${fw.direction === 'increases_risk' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {fw.direction === 'increases_risk' ? `+${fw.impactScore}%` : `${fw.impactScore}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncToLiveProfile}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            <span>Apply Simulated State to My Live Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
