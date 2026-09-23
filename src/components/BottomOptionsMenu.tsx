import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  X, 
  ExternalLink, 
  RotateCcw, 
  Check, 
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { BottomOptionItem, BottomOptionAction } from '../types';
import { playSuccessChime, playAlertChime } from '../utils/audio';

interface BottomOptionsMenuProps {
  onOpenTimer: () => void;
  onOpenStretch: () => void;
  onOpenSchedule: () => void;
  onOpenExams: () => void;
  onOpenHolidays: () => void;
  onOpenHistory: () => void;
  onOpenBirthday: () => void;
  onOpenAttendance?: () => void;
  onOpenHabits?: () => void;
  onOpenComplaints?: () => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const DEFAULT_BOTTOM_OPTIONS: BottomOptionItem[] = [
  { id: 'opt-timer', label: 'Timer', icon: '⏱️', actionType: 'timer', colorTheme: 'purple', isDefault: true },
  { id: 'opt-stretch', label: 'Activity', icon: '🧘', actionType: 'stretch', colorTheme: 'fuchsia', isDefault: true },
  { id: 'opt-schedule', label: 'Classes', icon: '📅', actionType: 'schedule', colorTheme: 'indigo', isDefault: true },
  { id: 'opt-exams', label: 'Exams', icon: '🎓', actionType: 'exams', colorTheme: 'purple', isDefault: true },
  { id: 'opt-holidays', label: 'Holidays', icon: '🌴', actionType: 'holidays', colorTheme: 'amber', isDefault: true },
  { id: 'opt-attendance', label: 'Attendance', icon: '📊', actionType: 'attendance', colorTheme: 'emerald', isDefault: true },
  { id: 'opt-history', label: 'History', icon: '📜', actionType: 'history', colorTheme: 'sky', isDefault: true }
];

const EMOJI_PRESETS = ['⏱️', '🧘', '📅', '🎓', '🌴', '📊', '📜', '🎂', '🎯', '🧪', '💬', '🏃', '💧', '📚', '💻', '🚀', '☕', '💡', '🔔'];

export const BottomOptionsMenu: React.FC<BottomOptionsMenuProps> = ({
  onOpenTimer,
  onOpenStretch,
  onOpenSchedule,
  onOpenExams,
  onOpenHolidays,
  onOpenHistory,
  onOpenBirthday,
  onOpenAttendance,
  onOpenHabits,
  onOpenComplaints,
  soundEnabled,
  onToast
}) => {
  const [options, setOptions] = useState<BottomOptionItem[]>(() => {
    const saved = localStorage.getItem('bottomMenuOptions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((item: any) => item.actionType !== 'alerts' && item.id !== 'opt-alerts');
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        console.warn('Failed to parse bottomMenuOptions', e);
      }
    }
    return DEFAULT_BOTTOM_OPTIONS;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeNoteModal, setActiveNoteModal] = useState<{ title: string; text: string } | null>(null);

  // New Option Form State
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('✨');
  const [newActionType, setNewActionType] = useState<BottomOptionAction>('schedule');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newCustomNote, setNewCustomNote] = useState('');

  useEffect(() => {
    localStorage.setItem('bottomMenuOptions', JSON.stringify(options));
  }, [options]);

  const handleTriggerAction = (option: BottomOptionItem) => {
    if (soundEnabled) playSuccessChime();

    switch (option.actionType) {
      case 'timer':
        onOpenTimer();
        break;
      case 'stretch':
        onOpenStretch();
        break;
      case 'schedule':
        onOpenSchedule();
        break;
      case 'exams':
        onOpenExams();
        break;
      case 'holidays':
        onOpenHolidays();
        break;
      case 'history':
        onOpenHistory();
        break;
      case 'birthday':
        onOpenBirthday();
        break;
      case 'attendance':
        if (onOpenAttendance) onOpenAttendance();
        break;
      case 'habits':
        if (onOpenHabits) onOpenHabits();
        break;
      case 'complaints':
        if (onOpenComplaints) onOpenComplaints();
        break;
      case 'custom-link':
        if (option.targetUrl) {
          const url = option.targetUrl.startsWith('http') ? option.targetUrl : `https://${option.targetUrl}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          onToast('No URL Configured', 'This custom shortcut does not have a web address.', 'info');
        }
        break;
      case 'custom-note':
        setActiveNoteModal({
          title: option.label,
          text: option.customNote || 'No note details saved for this custom shortcut.'
        });
        break;
      default:
        break;
    }
  };

  const handleDeleteOption = (id: string, label: string) => {
    const updated = options.filter(opt => opt.id !== id);
    setOptions(updated);
    if (soundEnabled) playAlertChime();
    onToast('Option Deleted', `"${label}" was removed from the bottom menu.`, 'info');
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      onToast('Validation Error', 'Please specify a title for the shortcut.', 'alert');
      return;
    }

    const newItem: BottomOptionItem = {
      id: `custom-opt-${Date.now()}`,
      label: newLabel.trim(),
      icon: newIcon || '✨',
      actionType: newActionType,
      targetUrl: newActionType === 'custom-link' ? newTargetUrl.trim() : undefined,
      customNote: newActionType === 'custom-note' ? newCustomNote.trim() : undefined,
      colorTheme: 'purple',
      isDefault: false
    };

    const updated = [...options, newItem];
    setOptions(updated);
    setNewLabel('');
    setNewTargetUrl('');
    setNewCustomNote('');
    if (soundEnabled) playSuccessChime();
    onToast('Shortcut Added', `"${newItem.label}" is now on your bottom menu!`, 'success');
  };

  const handleResetDefaults = () => {
    setOptions(DEFAULT_BOTTOM_OPTIONS);
    if (soundEnabled) playSuccessChime();
    onToast('Reset Complete', 'Default bottom shortcuts restored.', 'success');
  };

  return (
    <>
      {/* Floating Bottom Options Dock */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] sm:max-w-2xl px-2">
        <div className="bg-purple-950/90 backdrop-blur-md text-white border border-purple-800/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1 sm:gap-1.5 transition-all">
          
          {/* Collapse/Expand Toggle for minimal view */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand bottom menu" : "Collapse bottom menu"}
            className="p-1.5 rounded-xl hover:bg-purple-800/60 text-purple-300 hover:text-white transition-colors flex-shrink-0"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {!isCollapsed && (
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[70vw] sm:max-w-xl">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTriggerAction(opt)}
                  title={`Open ${opt.label}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-100 hover:text-white border border-purple-700/50 hover:border-purple-500 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 shadow-2xs flex-shrink-0 group cursor-pointer"
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="text-[11px] sm:text-xs tracking-tight">{opt.label}</span>
                </button>
              ))}

              {options.length === 0 && (
                <span className="text-xs text-purple-300 px-2 italic">
                  No options in bottom menu. Click + to add.
                </span>
              )}
            </div>
          )}

          {/* Customize / Manage Shortcuts Button */}
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(true)}
            title="Add or delete bottom options"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Customize Bottom Menu Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-purple-200 relative max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl border border-purple-200">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-lg font-bold font-classic text-purple-950">
                    Customize Bottom Options Menu
                  </h3>
                  <p className="text-xs text-purple-700 font-medium">
                    Add new custom shortcuts or delete existing ones (including defaults)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1.5 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto space-y-5 flex-1 pr-1">
              
              {/* Current Active Options with Delete */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <span>Active Shortcuts ({options.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-[11px] text-purple-700 hover:text-purple-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 transition-all hover:bg-purple-100/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base flex-shrink-0">{opt.icon}</span>
                        <div className="truncate">
                          <span className="font-bold text-purple-950">{opt.label}</span>
                          <span className="ml-2 text-[10px] text-purple-600 bg-purple-200/60 px-1.5 py-0.2 rounded-md font-mono">
                            {opt.actionType}
                          </span>
                        </div>
                      </div>

                      {/* Delete Option Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(opt.id, opt.label)}
                        title={`Delete ${opt.label} from bottom menu`}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/80 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {options.length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-purple-300 text-center text-xs text-purple-600">
                      All bottom shortcuts have been deleted. Add custom shortcuts below or click "Reset to Defaults".
                    </div>
                  )}
                </div>
              </div>

              {/* Add New Custom Option Form */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/90 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-purple-700" />
                  <span>Add New Custom Option</span>
                </h4>

                <form onSubmit={handleAddOption} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Label */}
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Shortcut Title</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. Library, LeetCode, Notes..."
                        maxLength={20}
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Action Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Action Type</label>
                      <select
                        value={newActionType}
                        onChange={(e) => setNewActionType(e.target.value as BottomOptionAction)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="schedule">📅 Class Timetable</option>
                        <option value="exams">🎓 Exam Schedules</option>
                        <option value="timer">⏱️ Focus Timer</option>
                        <option value="stretch">🧘 Physical Activity Reminders</option>
                        <option value="attendance">📊 Attendance Tracker</option>
                        <option value="holidays">🌴 Holidays Hub</option>
                        <option value="history">📜 Past Records History</option>
                        <option value="birthday">🎂 Birthday Celebrations</option>
                        <option value="habits">🎯 Daily Habits</option>
                        <option value="complaints">💬 Complaints & Feedback</option>
                        <option value="custom-link">🌐 Open External Website / URL</option>
                        <option value="custom-note">📝 Quick Pop-up Note</option>
                      </select>
                    </div>
                  </div>

                  {/* If custom link */}
                  {newActionType === 'custom-link' && (
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Web URL / Link</label>
                      <input
                        type="text"
                        value={newTargetUrl}
                        onChange={(e) => setNewTargetUrl(e.target.value)}
                        placeholder="https://myuniversity.edu/portal"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* If custom note */}
                  {newActionType === 'custom-note' && (
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Note Content</label>
                      <textarea
                        rows={2}
                        value={newCustomNote}
                        onChange={(e) => setNewCustomNote(e.target.value)}
                        placeholder="e.g. Lab manual submission due on Thursday at 2 PM in Room 302..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* Emoji Preset Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">Select Icon / Emoji</label>
                    <div className="flex flex-wrap gap-1">
                      {EMOJI_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewIcon(emoji)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                            newIcon === emoji ? 'bg-purple-700 text-white ring-2 ring-purple-400 scale-110' : 'bg-white hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Bottom Menu</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-purple-100 pt-3 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple-950 text-white font-bold text-xs hover:bg-purple-900 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Note Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="font-bold font-classic text-base text-purple-950 flex items-center gap-2">
                <span>📝</span>
                <span>{activeNoteModal.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveNoteModal(null)}
                className="p-1 rounded-lg text-purple-400 hover:text-purple-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-purple-900 leading-relaxed whitespace-pre-wrap bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80">
              {activeNoteModal.text}
            </p>
            <button
              type="button"
              onClick={() => setActiveNoteModal(null)}
              className="w-full py-2 bg-purple-950 text-white font-bold text-xs rounded-xl hover:bg-purple-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
