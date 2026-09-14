import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  Check, 
  Heart, 
  Bell, 
  Plus, 
  Trash2, 
  Clock, 
  Sliders, 
  Volume2, 
  VolumeX,
  Footprints,
  Droplets,
  Eye,
  Wind
} from 'lucide-react';
import { StretchExercise, PhysicalActivityReminder, PhysicalActivityType } from '../types';
import { playSuccessChime, playAlertChime } from '../utils/audio';

interface BodyStretchReliefProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToast?: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
  onLogHistory?: (title: string, category: 'Attendance & Leaves' | 'Habits' | 'Exams' | 'Holidays' | 'Assignments' | 'Physical Activities', status: string, details?: string) => void;
}

export const STRETCH_EXERCISES: StretchExercise[] = [
  {
    id: 'full-stretch',
    title: 'Skyward Spinal Reach',
    target: 'Spine, Shoulders & Chest',
    durationSec: 20,
    icon: '🧘',
    description: 'Interlace fingers, flip palms upward, and reach toward the ceiling while taking a deep 4-second breath.',
    benefit: 'Decompresses lumbar vertebrae and opens tight chest muscles from studying.',
    animationType: 'full-stretch'
  },
  {
    id: 'neck-roll',
    title: 'Gentle Neck & Cervical Release',
    target: 'Neck & Upper Trapezius',
    durationSec: 20,
    icon: '💆',
    description: 'Slowly tilt your right ear to your right shoulder, hold gently, then roll chin to chest and repeat on the left.',
    benefit: 'Eliminates neck strain from looking down at screens and lab notebooks.',
    animationType: 'neck-roll'
  },
  {
    id: 'shoulder-shrug',
    title: 'Shoulder Blades & Upper Back Roll',
    target: 'Shoulders & Upper Back',
    durationSec: 15,
    icon: '💪',
    description: 'Shrug shoulders up to ears, roll backward in large circular motions, releasing tension completely on exhale.',
    benefit: 'Improves blood flow to the brain and reduces slouching fatigue.',
    animationType: 'shoulder-shrug'
  },
  {
    id: 'wrist-flex',
    title: 'Coder & Writer Wrist Extension',
    target: 'Wrists & Forearms',
    durationSec: 15,
    icon: '🖐️',
    description: 'Extend arm straight out, gently pull fingers backward with other hand for 10s, then switch to downward flex.',
    benefit: 'Prevents carpal tunnel and finger stiffness during long coding or writing sessions.',
    animationType: 'wrist-flex'
  }
];

export const DEFAULT_PHYSICAL_REMINDERS: PhysicalActivityReminder[] = [
  {
    id: 'act-stretch',
    title: 'Body Stretch & Spinal Decompression',
    type: 'stretch',
    icon: '🧘',
    intervalMinutes: 60, // 1 hour default
    enabled: true,
    nextTriggerAt: Date.now() + 60 * 60 * 1000,
    customMessage: 'Time for a 1-minute stretch! Decompress your spine, roll your shoulders, and breathe deeply.',
    dailyCompletedCount: 0,
    isDefault: true
  },
  {
    id: 'act-walking',
    title: 'Walking & Active Step Break',
    type: 'walking',
    icon: '🚶',
    intervalMinutes: 60, // 1 hour default
    enabled: true,
    nextTriggerAt: Date.now() + 60 * 60 * 1000,
    customMessage: 'Get up and take a 2-3 minute walk around the room or corridor. Boost blood circulation!',
    dailyCompletedCount: 0,
    isDefault: true
  },
  {
    id: 'act-water',
    title: 'Hydration & Water Intake',
    type: 'water',
    icon: '💧',
    intervalMinutes: 45,
    enabled: true,
    nextTriggerAt: Date.now() + 45 * 60 * 1000,
    customMessage: 'Drink a glass of water to keep your cognitive performance and focus sharp.',
    dailyCompletedCount: 0,
    isDefault: true
  },
  {
    id: 'act-eye',
    title: 'Eye Rest (20-20-20 Rule)',
    type: 'eye-rest',
    icon: '👁️',
    intervalMinutes: 30,
    enabled: true,
    nextTriggerAt: Date.now() + 30 * 60 * 1000,
    customMessage: 'Look away from your screen at an object 20 feet away for 20 seconds.',
    dailyCompletedCount: 0,
    isDefault: true
  },
  {
    id: 'act-posture',
    title: 'Deep Breath & Posture Reset',
    type: 'posture',
    icon: '🫁',
    intervalMinutes: 60,
    enabled: false,
    nextTriggerAt: Date.now() + 60 * 60 * 1000,
    customMessage: 'Sit upright, align your neck, and take 3 slow diaphragmatic breaths.',
    dailyCompletedCount: 0,
    isDefault: true
  }
];

const INTERVAL_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '90 min', value: 90 },
  { label: '2 hours', value: 120 }
];

export const BodyStretchRelief: React.FC<BodyStretchReliefProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToast,
  onLogHistory
}) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'guided-stretch'>('reminders');

  // Reminders list state
  const [reminders, setReminders] = useState<PhysicalActivityReminder[]>(() => {
    const saved = localStorage.getItem('physicalActivityReminders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse physicalActivityReminders', e);
      }
    }
    return DEFAULT_PHYSICAL_REMINDERS;
  });

  // Guided stretch player state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STRETCH_EXERCISES[0].durationSec);
  const [isStretchActive, setIsStretchActive] = useState(false);
  const [completedStretches, setCompletedStretches] = useState(0);

  // New Custom Activity form modal
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customIcon, setCustomIcon] = useState('🏃');
  const [customMinutes, setCustomMinutes] = useState(60);
  const [customMsg, setCustomMsg] = useState('');

  // Active Reminder Prompt Triggered State
  const [triggeredAlert, setTriggeredAlert] = useState<PhysicalActivityReminder | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('physicalActivityReminders', JSON.stringify(reminders));
  }, [reminders]);

  // Recurring Background Ticker (Every second check active reminders)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasUpdates = false;

      const updated = reminders.map(rem => {
        if (!rem.enabled) return rem;

        // If time reached or exceeded
        if (now >= rem.nextTriggerAt) {
          hasUpdates = true;
          // Trigger alert
          setTriggeredAlert(rem);
          if (soundEnabled) playAlertChime();

          // Try browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`${rem.icon} ${rem.title}`, {
                body: rem.customMessage || `Time for your recurring ${rem.title}! Repeating every ${rem.intervalMinutes}m.`,
                icon: '/app-logo.jpg'
              });
            } catch (err) {
              console.debug('Notification trigger error', err);
            }
          }

          // REPEAT: Schedule next interval automatically so it keeps repeating all day!
          return {
            ...rem,
            lastTriggeredAt: now,
            nextTriggerAt: now + rem.intervalMinutes * 60 * 1000
          };
        }
        return rem;
      });

      if (hasUpdates) {
        setReminders(updated);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reminders, soundEnabled]);

  // Guided Stretch timer effect
  const currentExercise = STRETCH_EXERCISES[currentIdx];

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isStretchActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isStretchActive && timeLeft === 0) {
      if (soundEnabled) playSuccessChime();
      setCompletedStretches(prev => prev + 1);

      if (currentIdx < STRETCH_EXERCISES.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setTimeLeft(STRETCH_EXERCISES[currentIdx + 1].durationSec);
      } else {
        setIsStretchActive(false);
        if (soundEnabled) playAlertChime();
        if (onToast) onToast('Routine Completed! 🎉', 'You finished all 4 micro-stretch exercises.', 'success');
        if (onLogHistory) {
          onLogHistory('Micro-Stretch Routine Completed', 'Physical Activities', 'Completed', 'Finished all 4 spinal & neck release exercises');
        }
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStretchActive, timeLeft, currentIdx, soundEnabled, onToast, onLogHistory]);

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === id) {
        const willEnable = !rem.enabled;
        const nextTime = willEnable ? Date.now() + rem.intervalMinutes * 60 * 1000 : rem.nextTriggerAt;
        if (soundEnabled) {
          if (willEnable) playSuccessChime();
          else playAlertChime();
        }
        return {
          ...rem,
          enabled: willEnable,
          nextTriggerAt: nextTime
        };
      }
      return rem;
    }));
  };

  const handleUpdateInterval = (id: string, minutes: number) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === id) {
        return {
          ...rem,
          intervalMinutes: minutes,
          nextTriggerAt: Date.now() + minutes * 60 * 1000
        };
      }
      return rem;
    }));
    if (soundEnabled) playSuccessChime();
    if (onToast) onToast('Interval Updated', `Reminder set to repeat every ${minutes} minutes.`, 'info');
  };

  const handleDeleteReminder = (id: string, title: string) => {
    setReminders(prev => prev.filter(rem => rem.id !== id));
    if (soundEnabled) playAlertChime();
    if (onToast) onToast('Reminder Removed', `"${title}" was removed from your activities list.`, 'info');
  };

  const handleAddCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newReminder: PhysicalActivityReminder = {
      id: `custom-rem-${Date.now()}`,
      title: customTitle.trim(),
      type: 'custom',
      icon: customIcon || '🏃',
      intervalMinutes: Math.max(5, customMinutes),
      enabled: true,
      nextTriggerAt: Date.now() + Math.max(5, customMinutes) * 60 * 1000,
      customMessage: customMsg.trim() || `Time for ${customTitle.trim()}! Keep up your healthy study habits.`,
      dailyCompletedCount: 0,
      isDefault: false
    };

    setReminders(prev => [...prev, newReminder]);
    setIsAddCustomOpen(false);
    setCustomTitle('');
    setCustomMsg('');
    if (soundEnabled) playSuccessChime();
    if (onToast) onToast('Activity Added! 🏃', `"${newReminder.title}" will remind you every ${newReminder.intervalMinutes}m.`, 'success');
  };

  const handleLogActivityCompletion = (rem: PhysicalActivityReminder) => {
    setReminders(prev => prev.map(r => {
      if (r.id === rem.id) {
        return {
          ...r,
          dailyCompletedCount: r.dailyCompletedCount + 1,
          nextTriggerAt: Date.now() + r.intervalMinutes * 60 * 1000
        };
      }
      return r;
    }));
    setTriggeredAlert(null);
    if (soundEnabled) playSuccessChime();
    if (onToast) onToast('Awesome Job! 🌟', `Logged 1 completion for ${rem.title}.`, 'success');
    if (onLogHistory) {
      onLogHistory(`${rem.title} Check-in`, 'Physical Activities', 'Completed', `Repeats every ${rem.intervalMinutes} mins`);
    }
  };

  const handleSnooze = (rem: PhysicalActivityReminder, minutes: number = 5) => {
    setReminders(prev => prev.map(r => {
      if (r.id === rem.id) {
        return {
          ...r,
          nextTriggerAt: Date.now() + minutes * 60 * 1000
        };
      }
      return r;
    }));
    setTriggeredAlert(null);
    if (soundEnabled) playSuccessChime();
    if (onToast) onToast('Snoozed', `Will remind you again in ${minutes} minutes.`, 'info');
  };

  const formatCountdown = (nextMs: number) => {
    const diffSec = Math.max(0, Math.floor((nextMs - Date.now()) / 1000));
    if (diffSec === 0) return 'Due now';
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (!isOpen) return null;

  const progress = ((currentExercise.durationSec - timeLeft) / currentExercise.durationSec) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl border border-purple-200 relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shadow-purple-500/20 flex-shrink-0">
              🏃
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                  Physical Activity & Wellness Reminders
                </h3>
              </div>
              <p className="text-xs text-purple-700 font-medium">
                Recurring reminders throughout the day for stretch, walking, water & active study breaks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top View Selector Tabs: Reminders vs Guided Stretch */}
        <div className="flex items-center justify-between gap-2 p-1 bg-purple-100/70 rounded-2xl border border-purple-200/90 mb-4 z-10">
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'reminders'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-purple-900 hover:bg-purple-200/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Recurring Activity Reminders ({reminders.filter(r => r.enabled).length} active)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guided-stretch')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'guided-stretch'
                ? 'bg-fuchsia-700 text-white shadow-xs'
                : 'text-purple-900 hover:bg-purple-200/60'
            }`}
          >
            <span>🧘</span>
            <span>Guided 60s Micro-Stretch Routine</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1 z-10">
          
          {/* TAB 1: RECURRING REMINDERS LIST */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              
              {/* Header Bar with + Add Custom Activity */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <span>Active Reminders</span>
                    <span className="text-purple-500 font-normal lowercase">(repeats continuously all day)</span>
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Activity</span>
                </button>
              </div>

              {/* Reminders List */}
              <div className="space-y-3">
                {reminders.map((rem) => {
                  const isEnabled = rem.enabled;
                  return (
                    <div
                      key={rem.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isEnabled
                          ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Icon & Title */}
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0 mt-0.5">{rem.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-purple-950">{rem.title}</h5>
                              {isEnabled && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <span>Active (every {rem.intervalMinutes}m)</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-purple-800/80 mt-0.5">
                              {rem.customMessage}
                            </p>
                          </div>
                        </div>

                        {/* Toggle ON/OFF Switch & Delete */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(rem.id)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isEnabled
                                ? 'bg-purple-700 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {isEnabled ? 'ON' : 'OFF'}
                          </button>

                          {/* Delete Activity (Allowed for ANY activity including defaults!) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(rem.id, rem.title)}
                            title={`Delete ${rem.title}`}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Interval Preset Chips & Countdown Status */}
                      {isEnabled && (
                        <div className="mt-3 pt-3 border-t border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Quick Interval Selection Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-purple-900 mr-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-600" />
                              <span>Interval:</span>
                            </span>
                            {INTERVAL_PRESETS.map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => handleUpdateInterval(rem.id, preset.value)}
                                className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                  rem.intervalMinutes === preset.value
                                    ? 'bg-purple-800 text-white shadow-2xs'
                                    : 'bg-white hover:bg-purple-100 text-purple-800 border border-purple-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {/* Live Repeating Countdown & Completed Count */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <div className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-200/80 text-purple-950 flex items-center gap-1">
                              <span>⏱️ Next in:</span>
                              <span className="text-purple-900 underline decoration-purple-400 font-black">
                                {formatCountdown(rem.nextTriggerAt)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleLogActivityCompletion(rem)}
                              title="Mark as done right now"
                              className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
                            >
                              <Check className="w-3 h-3" />
                              <span>Done ({rem.dailyCompletedCount})</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {reminders.length === 0 && (
                  <div className="p-6 rounded-2xl border border-dashed border-purple-300 text-center space-y-2">
                    <p className="text-sm font-bold text-purple-950">No physical reminders in your list</p>
                    <p className="text-xs text-purple-600">Click "Add Activity" or restore defaults below.</p>
                    <button
                      type="button"
                      onClick={() => setReminders(DEFAULT_PHYSICAL_REMINDERS)}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs"
                    >
                      Restore Default Reminders
                    </button>
                  </div>
                )}
              </div>

              {/* Informational banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-700 flex-shrink-0" />
                <span>
                  <strong>Continuous Daily Cycle:</strong> Each active reminder automatically restarts its countdown after alerting you, keeping you hydrated, moving, and stretched all day.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: GUIDED STRETCH ROUTINE WITH ANIMATED MAN */}
          {activeTab === 'guided-stretch' && (
            <div className="space-y-4">
              {/* Dynamic Animated Stretch Visualizer */}
              <div className="relative rounded-2xl bg-gradient-to-b from-purple-900 via-indigo-950 to-purple-950 p-5 text-white shadow-inner flex flex-col items-center justify-center overflow-hidden border border-purple-800/60">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-44 rounded-full bg-purple-500/20 animate-breathe-glow" />
                </div>

                {/* SVG Character Stretching */}
                <div className="relative z-10 w-40 h-36 flex items-center justify-center">
                  <svg
                    viewBox="0 0 200 200"
                    className={`w-full h-full transition-transform duration-700 ${
                      isStretchActive ? 'animate-body-stretch' : ''
                    }`}
                  >
                    <ellipse cx="100" cy="180" rx="45" ry="8" fill="#581c87" opacity="0.6" />
                    <circle
                      cx="100"
                      cy={currentExercise.animationType === 'neck-roll' && isStretchActive ? 52 : 55}
                      r="18"
                      fill="#fbcfe8"
                      stroke="#c084fc"
                      strokeWidth="2"
                    />
                    <path d="M 93 54 Q 96 52 99 54" stroke="#7e22ce" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M 101 54 Q 104 52 107 54" stroke="#7e22ce" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M 97 60 Q 100 64 103 60" stroke="#7e22ce" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    <path d="M 85 75 L 115 75 L 110 130 L 90 130 Z" fill="#a855f7" stroke="#c084fc" strokeWidth="2" />
                    <path d="M 100 78 L 100 126" stroke="#e9d5ff" strokeWidth="3" strokeDasharray="3 3" strokeLinecap="round" />

                    <g className={isStretchActive ? 'animate-arm-left' : ''}>
                      <path d="M 85 78 Q 62 48 55 25" stroke="#fbcfe8" strokeWidth="8" strokeLinecap="round" fill="none" />
                      <circle cx="55" cy="22" r="5" fill="#fbcfe8" />
                    </g>
                    <g className={isStretchActive ? 'animate-arm-right' : ''}>
                      <path d="M 115 78 Q 138 48 145 25" stroke="#fbcfe8" strokeWidth="8" strokeLinecap="round" fill="none" />
                      <circle cx="145" cy="22" r="5" fill="#fbcfe8" />
                    </g>

                    <path d="M 93 130 L 85 178" stroke="#6b21a8" strokeWidth="9" strokeLinecap="round" />
                    <path d="M 107 130 L 115 178" stroke="#6b21a8" strokeWidth="9" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="z-10 text-center mt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{currentExercise.title}</span>
                  </span>
                  <p className="text-xs text-purple-100/90 max-w-sm mt-1 leading-relaxed px-2">
                    {currentExercise.description}
                  </p>
                </div>

                <div className="z-10 mt-3 flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-purple-800/80 border border-purple-500/40 text-xs font-mono font-bold text-purple-200">
                    ⏱️ {timeLeft}s remaining
                  </div>
                  <div className="w-28 h-2 bg-purple-900/90 rounded-full overflow-hidden border border-purple-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-300 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsStretchActive(false);
                    setTimeLeft(currentExercise.durationSec);
                  }}
                  className="p-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsStretchActive(!isStretchActive);
                    if (!isStretchActive && soundEnabled) playSuccessChime();
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                    isStretchActive
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700'
                  }`}
                >
                  {isStretchActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Stretch</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Guided Stretch ({currentExercise.durationSec}s)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = (currentIdx + 1) % STRETCH_EXERCISES.length;
                    setCurrentIdx(next);
                    setTimeLeft(STRETCH_EXERCISES[next].durationSec);
                    setIsStretchActive(false);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors"
                >
                  Next ➔
                </button>
              </div>

              {/* Step playlist */}
              <div className="grid grid-cols-2 gap-2">
                {STRETCH_EXERCISES.map((ex, idx) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setCurrentIdx(idx);
                      setTimeLeft(ex.durationSec);
                      setIsStretchActive(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2 ${
                      idx === currentIdx
                        ? 'bg-purple-100/90 border-purple-400 text-purple-950 font-bold shadow-xs'
                        : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50'
                    }`}
                  >
                    <span className="text-lg leading-none">{ex.icon}</span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold">{ex.title}</div>
                      <div className="text-[10px] text-purple-600 truncate font-normal">{ex.target}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-purple-100 pt-3 mt-3 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={() => setReminders(DEFAULT_PHYSICAL_REMINDERS)}
            className="text-[11px] text-purple-600 hover:text-purple-900 font-bold hover:underline"
          >
            Reset All to Defaults
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-950 text-white font-bold text-xs hover:bg-purple-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Triggered Recurring Alert Pop-up Modal */}
      {triggeredAlert && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-2 border-purple-400 space-y-4 text-center animate-bounce duration-500">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 text-3xl flex items-center justify-center mx-auto shadow-inner">
              {triggeredAlert.icon}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full">
                Recurring Reminder ({triggeredAlert.intervalMinutes}m interval)
              </span>
              <h3 className="text-lg font-bold font-classic text-purple-950 mt-1">
                {triggeredAlert.title}
              </h3>
              <p className="text-xs text-purple-800 mt-2 bg-purple-50 p-3 rounded-2xl border border-purple-200">
                {triggeredAlert.customMessage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleLogActivityCompletion(triggeredAlert)}
                className="py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Mark Completed (+1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSnooze(triggeredAlert, 5)}
                className="py-2.5 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs active:scale-95"
              >
                Snooze 5 Mins
              </button>
            </div>

            {triggeredAlert.type === 'stretch' && (
              <button
                type="button"
                onClick={() => {
                  setTriggeredAlert(null);
                  setActiveTab('guided-stretch');
                  setIsStretchActive(true);
                }}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-xs"
              >
                Start Guided 60s Stretch Routine ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Activity Modal */}
      {isAddCustomOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h4 className="font-bold font-classic text-base text-purple-950 flex items-center gap-2">
                <span>➕</span>
                <span>Add Custom Physical Activity</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="p-1 rounded-lg text-purple-400 hover:text-purple-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomActivity} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Activity Name</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Standing Desk Switch, Vitamin Intake..."
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Repeating Interval (minutes)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Number(e.target.value))}
                    required
                    className="w-24 px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-purple-700">minutes ({Math.round(customMinutes / 60 * 10) / 10} hours)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Pick Icon / Emoji</label>
                <div className="flex flex-wrap gap-1.5">
                  {['🏃', '🚶', '💧', '🧘', '🤸', '🚴', '🫁', '👁️', '🍎', '⏰', '💪', '☀️'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCustomIcon(emoji)}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                        customIcon === emoji
                          ? 'bg-purple-700 text-white ring-2 ring-purple-400 scale-110'
                          : 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Motivational Reminder Message</label>
                <textarea
                  rows={2}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="e.g. Switch to standing desk mode for 15 minutes to stay active!"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
