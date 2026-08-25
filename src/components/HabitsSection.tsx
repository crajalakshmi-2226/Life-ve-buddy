import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  TrendingUp, 
  BarChart2, 
  Activity, 
  Smile, 
  Award, 
  Info,
  Calendar
} from 'lucide-react';
import { Habit, HabitCategory } from '../types';
import confetti from 'canvas-confetti';
import { playSuccessChime, playStreakFanfare } from '../utils/audio';
import { get7DayHabitStats } from '../utils/habitStats';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart
} from 'recharts';

interface HabitsSectionProps {
  habits: Habit[];
  onToggleHabit: (id: number | string) => void;
  onAddHabit: (name: string, category: 'Health' | 'Study' | 'Personal' | 'Mindset') => void;
  onDeleteHabit: (id: number | string) => void;
  soundEnabled: boolean;
  onOpenStretchRelief?: () => void;
}

const CATEGORIES: { key: HabitCategory; label: string; emoji: string }[] = [
  { key: 'All', label: 'All', emoji: '✨' },
  { key: 'Health', label: 'Health', emoji: '🏃' },
  { key: 'Study', label: 'Study', emoji: '📚' },
  { key: 'Personal', label: 'Personal', emoji: '🌱' },
  { key: 'Mindset', label: 'Mindset', emoji: '💡' },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Health: { bg: 'bg-purple-100/80', text: 'text-purple-800', border: 'border-purple-200' },
  Study: { bg: 'bg-indigo-100/80', text: 'text-indigo-800', border: 'border-indigo-200' },
  Personal: { bg: 'bg-fuchsia-100/80', text: 'text-fuchsia-800', border: 'border-fuchsia-200' },
  Mindset: { bg: 'bg-violet-100/80', text: 'text-violet-800', border: 'border-violet-200' },
};

const HABIT_PRESETS = [
  { name: "Drink 2L Water", category: "Health" as const },
  { name: "1 Hour Deep Study", category: "Study" as const },
  { name: "Desk Stretch & Spine Relief", category: "Health" as const },
  { name: "Review Lab / Class Notes", category: "Study" as const },
  { name: "One Photo a Day", category: "Personal" as const },
  { name: "Evening Gratitude & Reflection", category: "Mindset" as const },
  { name: "30 Min Screen-Free Wind Down", category: "Health" as const }
];

export const HabitsSection: React.FC<HabitsSectionProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  soundEnabled,
  onOpenStretchRelief
}) => {
  const [activeCategory, setActiveCategory] = useState<HabitCategory>('All');
  const [newHabitName, setNewHabitName] = useState('');
  const [newCategory, setNewCategory] = useState<'Health' | 'Study' | 'Personal' | 'Mindset'>('Health');
  const [showChartDetails, setShowChartDetails] = useState(false);

  const filteredHabits = activeCategory === 'All'
    ? habits
    : habits.filter(h => h.category.toLowerCase() === activeCategory.toLowerCase());

  const doneCount = habits.filter(h => h.doneToday).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

  // 7-day stats for Recharts Line Chart
  const chartData = get7DayHabitStats(habits);
  const avgCompletionRate = Math.round(
    chartData.reduce((acc, curr) => acc + curr.completionRate, 0) / chartData.length
  );

  const handleToggle = (habit: Habit) => {
    const willBeDone = !habit.doneToday;
    onToggleHabit(habit.id);

    if (willBeDone) {
      if (doneCount + 1 === habits.length) {
        if (soundEnabled) playStreakFanfare();
        try {
          confetti({
            particleCount: 75,
            spread: 90,
            origin: { y: 0.7 }
          });
        } catch (e) {
          console.debug(e);
        }
      } else {
        if (soundEnabled) playSuccessChime();
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim(), newCategory);
    setNewHabitName('');
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200">
            🔥
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
              Daily Habits & Streaks
            </h2>
            <p className="text-xs text-purple-700/80 font-medium">
              Build lasting discipline with 7-day visual trends and physical body relief
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenStretchRelief && (
            <button
              type="button"
              onClick={onOpenStretchRelief}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Open full animated body stretch & spine relief guide"
            >
              <span className="text-sm">🧘</span>
              <span>Body Stretch Break</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span id="habitsCompletedPill">
              {doneCount} / {habits.length} Done
            </span>
          </div>

          {allDone && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 animate-pulse">
              🎉 All Done!
            </span>
          )}
        </div>
      </div>

      {/* 📊 RECHARTS 7-DAY HABIT COMPLETION TREND CHART */}
      <div className="rounded-2xl bg-gradient-to-b from-purple-50/70 to-white p-4 sm:p-5 border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs sm:text-sm font-bold font-classic text-purple-950 uppercase tracking-wide">
              7-Day Habit Completion Progress
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-purple-700 font-medium">
              Weekly Avg: <strong className="text-purple-900 font-bold">{avgCompletionRate}%</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-[11px] text-purple-800 font-medium">Completed Rate %</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-48 sm:h-52 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="purpleLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7e22ce" />
                  <stop offset="50%" stopColor="#9333ea" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />

              <XAxis
                dataKey="dayLabel"
                stroke="#6b21a8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e9d5ff' }}
              />

              <YAxis
                stroke="#6b21a8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-purple-950 text-white p-3 rounded-xl shadow-xl border border-purple-700/60 text-xs space-y-1">
                        <div className="font-bold font-classic text-purple-200 flex items-center justify-between gap-3">
                          <span>{data.fullDate} ({data.dayLabel})</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-800 text-[10px]">
                            {data.completionRate}% Done
                          </span>
                        </div>
                        <div className="text-slate-200 text-[11px] pt-1">
                          ✅ <strong>{data.completed}</strong> of {data.total} habits finished
                        </div>
                        <div className="flex gap-2 text-[10px] text-purple-300">
                          <span>📚 Study: {data.studyHabits}</span>
                          <span>🏃 Health: {data.healthHabits}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="completionRate"
                fill="url(#purpleAreaGrad)"
                stroke="none"
              />

              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="url(#purpleLineGrad)"
                strokeWidth={3}
                dot={{ fill: '#7e22ce', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#6b21a8', stroke: '#faf5ff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Summary Footer */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-purple-700 pt-1 border-t border-purple-100/80 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-purple-900 font-semibold">Today's Progress:</span>
            <span>{doneCount} of {habits.length} habits checked ({habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0}%)</span>
          </div>
          <div className="text-purple-500 font-medium italic">
            Keep streaks going daily to elevate your visual completion curve!
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-purple-900 text-white shadow-xs scale-[1.02]'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Habits List */}
      <div className="space-y-2.5">
        {filteredHabits.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-purple-50/60 border border-dashed border-purple-200 text-purple-700 text-xs">
            No habits found in category "{activeCategory}". Add a custom habit below!
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const catStyle = CATEGORY_STYLES[habit.category] || CATEGORY_STYLES.Personal;
            return (
              <div
                key={habit.id}
                onClick={() => handleToggle(habit)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  habit.doneToday
                    ? 'bg-purple-50/70 border-purple-300/80 shadow-2xs'
                    : 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                {/* Left side: Custom Checkbox + Name + Category Tag */}
                <div className="flex items-center gap-3">
                  <div className={`p-0.5 rounded-full transition-transform ${habit.doneToday ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {habit.doneToday ? (
                      <div className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-lg border-2 border-purple-300 group-hover:border-purple-600 bg-white transition-colors" />
                    )}
                  </div>

                  <div>
                    <span className={`text-sm block transition-all font-medium ${
                      habit.doneToday ? 'line-through text-purple-400 font-normal' : 'text-purple-950 font-semibold'
                    }`}>
                      {habit.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                        {habit.category}
                      </span>
                      {habit.name.toLowerCase().includes('stretch') && onOpenStretchRelief && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStretchRelief();
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200 px-1.5 py-0.2 rounded-md border border-fuchsia-200 cursor-pointer"
                        >
                          🧘 Start Guide
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Streak Badge + Delete button */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                    habit.doneToday
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : habit.streak > 0
                      ? 'bg-orange-50 text-orange-800 border-orange-200'
                      : 'bg-purple-50 text-purple-600 border-purple-200'
                  }`}>
                    <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-purple-400'}`} />
                    <span>{habit.streak} {habit.streak === 1 ? 'day' : 'days'}</span>
                  </span>

                  {habit.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHabit(habit.id);
                      }}
                      className="p-1.5 rounded-lg text-purple-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete custom habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Habit Form */}
      <form onSubmit={handleAddSubmit} className="pt-1">
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/90 space-y-3">
          <div className="text-xs font-bold text-purple-950 uppercase tracking-wider">
            + Create New Daily Habit
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="newHabitInput"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. 15 min Physics Review or 5 min Body Stretch..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-medium text-purple-950 placeholder:text-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            />
            <select
              id="newHabitCategory"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Habit['category'])}
              className="px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-purple-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="Health">🏃 Health</option>
              <option value="Study">📚 Study</option>
              <option value="Personal">🌱 Personal</option>
              <option value="Mindset">💡 Mindset</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Habit</span>
            </button>
          </div>

          {/* Quick preset suggestions */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
              Popular Habit Ideas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_PRESETS.filter(p => !habits.some(h => h.name.toLowerCase() === p.name.toLowerCase())).slice(0, 4).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onAddHabit(preset.name, preset.category)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 hover:text-purple-900 text-purple-700 border border-purple-200 transition-colors font-medium cursor-pointer"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
