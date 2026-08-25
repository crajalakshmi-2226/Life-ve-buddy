import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  HelpCircle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ActionRecommendation, StudentAcademicProfile, AlertPriority } from '../../types';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../../utils/audio';

interface WhatShouldIDoNowProps {
  profile: StudentAcademicProfile;
  recommendations: ActionRecommendation[];
  onToggleAction: (actionId: string) => void;
  onAddAction: (title: string, category: ActionRecommendation['category'], urgency: AlertPriority, effort: string) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const WhatShouldIDoNow: React.FC<WhatShouldIDoNowProps> = ({
  profile,
  recommendations,
  onToggleAction,
  onAddAction,
  soundEnabled,
  onToast
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ActionRecommendation['category']>('Academic');
  const [newUrgency, setNewUrgency] = useState<AlertPriority>('High');
  const [newEffort, setNewEffort] = useState('30 mins');

  const completedCount = recommendations.filter(r => r.completed).length;
  const totalCount = recommendations.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (id: string, isDone: boolean) => {
    onToggleAction(id);
    if (!isDone) {
      if (soundEnabled) playSuccessChime();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
      onToast("✅ Preventive Action Resolved", "Your academic risk score has been adjusted downwards.", "success");
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddAction(newTitle.trim(), newCategory, newUrgency, newEffort);
    setNewTitle('');
    setShowAddForm(false);
    onToast("✨ Action Added", "New recommended preventive action tracked.", "info");
  };

  const getActionIcon = (type: ActionRecommendation['actionType']) => {
    switch (type) {
      case 'contact_faculty':
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case 'submit_assignment':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'attend_classes':
        return <Calendar className="w-4 h-4 text-rose-600" />;
      case 'pay_fee':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'schedule_study':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Core Questions Answer Card */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-purple-800 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-700/80 border border-purple-500 flex items-center justify-center text-white text-2xl shadow-inner">
              💡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-purple-950 uppercase tracking-wider">
                  AI Decision Engine
                </span>
                <span className="text-xs text-purple-300">Continuous Assessment</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-classic text-white mt-0.5">
                “What Should I Do Now?” Action Center
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-800/60 px-4 py-2 rounded-2xl border border-purple-700 text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Risk State: <span className="text-amber-300 font-bold">{profile.riskLevel}</span></span>
          </div>
        </div>

        {/* 3 Core Questions Answers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Question 1 */}
          <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-700/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-white text-[10px]">1</span>
              <span>What important alerts do I have now?</span>
            </div>
            <p className="text-purple-100 text-[11px] leading-relaxed">
              You have <strong className="text-amber-300 font-bold">3 urgent notifications</strong> including DSP assignment due tomorrow, OS attendance deficit, and Semester Exam Fee deadline.
            </p>
          </div>

          {/* Question 2 */}
          <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-700/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-white text-[10px]">2</span>
              <span>What risks or deadlines should I be aware of?</span>
            </div>
            <p className="text-purple-100 text-[11px] leading-relaxed">
              Critical exam debarment risk in <strong className="text-rose-300 font-bold">DSP (64.7%)</strong> and <strong className="text-amber-300 font-bold">OS (72.2%)</strong>. Exam fee portal locks in 3 days.
            </p>
          </div>

          {/* Question 3 */}
          <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-700/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-white text-[10px]">3</span>
              <span>What action should I take to avoid future problems?</span>
            </div>
            <p className="text-purple-100 text-[11px] leading-relaxed">
              Complete the <strong className="text-emerald-300 font-bold">5 recommended preventive steps</strong> below to clear pending tasks and stabilize attendance above 75%.
            </p>
          </div>
        </div>

        {/* Action Progress Bar */}
        <div className="bg-purple-950/70 p-4 rounded-2xl border border-purple-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-200">Preventive Action Plan Completion</span>
            <span className="font-bold text-amber-300">
              {completedCount} of {totalCount} Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-purple-900 rounded-full overflow-hidden border border-purple-700">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-700" />
            <h3 className="text-base sm:text-lg font-bold font-classic text-purple-950">
              Prescribed Step-by-Step Resolution Actions
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action</span>
          </button>
        </div>

        {/* Add Action Form */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3 animate-fadeIn">
            <h4 className="text-xs font-bold text-purple-950">Add Custom Preventive Action</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Schedule lab make-up session with HOD"
                className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ActionRecommendation['category'])}
                  className="w-1/2 px-2.5 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-hidden"
                >
                  <option value="Academic">Academic</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Exam">Exam</option>
                  <option value="Fee Payment">Fee Payment</option>
                </select>
                <select
                  value={newUrgency}
                  onChange={(e) => setNewUrgency(e.target.value as AlertPriority)}
                  className="w-1/2 px-2.5 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-hidden"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                value={newEffort}
                onChange={(e) => setNewEffort(e.target.value)}
                placeholder="Estimated effort (e.g. 20 mins)"
                className="w-48 px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-xl focus:outline-hidden"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 cursor-pointer"
                >
                  Save Action
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Action Cards */}
        <div className="space-y-3">
          {recommendations.map((action) => {
            const isCompleted = action.completed;

            return (
              <div
                key={action.id}
                onClick={() => handleToggle(action.id, isCompleted)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isCompleted
                    ? 'bg-purple-50/50 border-purple-200/60 opacity-60'
                    : 'bg-white border-purple-200 hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(action.id, isCompleted);
                  }}
                  className="mt-0.5 text-purple-700 hover:text-purple-900 transition-colors"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-purple-300 hover:text-purple-600" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-purple-50 border border-purple-200">
                        {getActionIcon(action.actionType)}
                      </div>
                      <h4 className={`text-xs sm:text-sm font-bold ${isCompleted ? 'line-through text-slate-500' : 'text-purple-950'}`}>
                        {action.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        action.urgency === 'Emergency'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : action.urgency === 'High'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}>
                        {action.urgency}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.estimatedEffort}
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                    {action.description}
                  </p>

                  {action.targetSubject && (
                    <div className="pt-1 text-[11px] text-purple-700 font-semibold">
                      Target Subject: <span className="underline">{action.targetSubject}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
