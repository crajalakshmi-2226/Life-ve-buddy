import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ListTodo
} from 'lucide-react';
import { QuickReminder } from '../types';
import { playSuccessChime, playAlertChime } from '../utils/audio';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: QuickReminder[];
  onSaveReminder: (reminder: QuickReminder) => void;
  onDeleteReminder: (id: string) => void;
  onToggleComplete: (id: string) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
  initialEditReminder?: QuickReminder | null;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onSaveReminder,
  onDeleteReminder,
  onToggleComplete,
  soundEnabled,
  onToast,
  initialEditReminder
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [remindMeAt, setRemindMeAt] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'create' | 'list'>('create');

  // Initialize or reset form
  useEffect(() => {
    if (initialEditReminder) {
      setEditingId(initialEditReminder.id);
      setSubject(initialEditReminder.subject);
      setDate(initialEditReminder.date);
      setTime(initialEditReminder.time);
      setRemindMeAt(initialEditReminder.remindMeAt);
      setViewTab('create');
    } else {
      resetForm();
    }
  }, [initialEditReminder, isOpen]);

  const resetForm = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const defaultHours = String(Math.min(23, now.getHours() + 1)).padStart(2, '0');
    const defaultMinutes = '00';
    const defaultTime = `${defaultHours}:${defaultMinutes}`;
    
    // Remind me 15 minutes before or now
    const remindDate = new Date(now.getTime() + 45 * 60 * 1000);
    const remindHours = String(remindDate.getHours()).padStart(2, '0');
    const remindMins = String(remindDate.getMinutes()).padStart(2, '0');
    const remindDateStr = remindDate.toISOString().split('T')[0];

    setEditingId(null);
    setSubject('');
    setDate(todayStr);
    setTime(defaultTime);
    setRemindMeAt(`${remindDateStr}T${remindHours}:${remindMins}`);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation: all required fields
    if (!subject.trim()) {
      setErrorMsg('Please enter a reminder subject or title.');
      if (soundEnabled) playAlertChime();
      return;
    }
    if (!date) {
      setErrorMsg('Please select a valid date for this reminder.');
      if (soundEnabled) playAlertChime();
      return;
    }
    if (!time) {
      setErrorMsg('Please select a specific time.');
      if (soundEnabled) playAlertChime();
      return;
    }
    if (!remindMeAt) {
      setErrorMsg('Please select when LifeBuddy should alert you (Remind Me At).');
      if (soundEnabled) playAlertChime();
      return;
    }

    const newReminder: QuickReminder = {
      id: editingId || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      subject: subject.trim(),
      date,
      time,
      remindMeAt,
      createdAt: editingId ? (reminders.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now(),
      completed: false,
      notified: false
    };

    onSaveReminder(newReminder);
    if (soundEnabled) playSuccessChime();
    onToast(
      editingId ? 'Reminder Updated' : 'Reminder Saved',
      `"${newReminder.subject}" scheduled for ${date} at ${time}. Alert set for ${remindMeAt.replace('T', ' ')}.`,
      'success'
    );

    resetForm();
    if (reminders.length > 0) {
      setViewTab('list');
    } else {
      onClose();
    }
  };

  const startEdit = (rem: QuickReminder) => {
    setEditingId(rem.id);
    setSubject(rem.subject);
    setDate(rem.date);
    setTime(rem.time);
    setRemindMeAt(rem.remindMeAt);
    setViewTab('create');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl border border-purple-200/90 relative max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: 'var(--theme-primary, #7c3aed)', color: 'var(--theme-primary-text, #ffffff)' }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-classic text-purple-950">
                {editingId ? 'Edit Quick Reminder' : 'Quick Reminders & Tasks'}
              </h3>
              <p className="text-xs text-purple-700/80 font-medium">
                Set custom alerts for submissions, classes & self-study
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

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2">
          <button
            type="button"
            onClick={() => {
              if (viewTab !== 'create') resetForm();
              setViewTab('create');
            }}
            style={viewTab === 'create' ? {
              backgroundColor: 'var(--theme-primary, #7c3aed)',
              color: 'var(--theme-primary-text, #ffffff)'
            } : undefined}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewTab === 'create'
                ? 'shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? 'Edit Reminder' : 'New Reminder'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('list')}
            style={viewTab === 'list' ? {
              backgroundColor: 'var(--theme-primary, #7c3aed)',
              color: 'var(--theme-primary-text, #ffffff)'
            } : undefined}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewTab === 'list'
                ? 'shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Saved Reminders ({reminders.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pt-2 space-y-4 pr-1">
          {viewTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Subject / Task Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Submit DSP Lab Report, Review Physics Formulas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  autoFocus
                />
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Event Date <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Event Time <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* Remind Me At */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-purple-600" />
                  <span>Remind Me At (Date & Time) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  value={remindMeAt}
                  onChange={(e) => setRemindMeAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                />
                <p className="text-[11px] text-purple-600/80 mt-1">
                  LifeBuddy will fire a notification alert at this exact timestamp.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--theme-primary, #7c3aed)',
                    color: 'var(--theme-primary-text, #ffffff)'
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Update Reminder' : 'Save Reminder'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {reminders.length === 0 ? (
                <div className="text-center py-8 px-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                  <Bell className="w-8 h-8 text-purple-400 mx-auto" />
                  <h4 className="text-sm font-bold text-purple-950">No Active Reminders</h4>
                  <p className="text-xs text-purple-700/80 max-w-xs mx-auto">
                    Click "New Reminder" above to set your first quick reminder with custom notification alert time.
                  </p>
                </div>
              ) : (
                reminders.map(rem => {
                  const isPast = new Date(rem.remindMeAt).getTime() < Date.now();
                  return (
                    <div
                      key={rem.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        rem.completed
                          ? 'bg-purple-50/40 border-purple-200 opacity-60'
                          : 'bg-white border-purple-200/90 shadow-2xs hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleComplete(rem.id)}
                          className="mt-0.5 text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className={`w-4 h-4 ${rem.completed ? 'text-emerald-600 fill-emerald-100' : 'text-purple-300'}`} />
                        </button>
                        <div>
                          <h4 className={`text-xs font-bold ${rem.completed ? 'line-through text-purple-950/60' : 'text-purple-950'}`}>
                            {rem.subject}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-purple-700">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-purple-500" />
                              <span>{rem.date} at {rem.time}</span>
                            </span>
                            <span>•</span>
                            <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded-md ${
                              isPast ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-900 font-bold'
                            }`}>
                              <Bell className="w-2.5 h-2.5" />
                              <span>Alert: {rem.remindMeAt.replace('T', ' ')}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(rem)}
                          title="Edit reminder"
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(rem.id)}
                          title="Delete reminder"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
