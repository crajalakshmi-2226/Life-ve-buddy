import React, { useState, useEffect } from 'react';
import { 
  Cake, 
  Sparkles, 
  Calendar, 
  Bell, 
  Clock, 
  X, 
  Check, 
  PartyPopper, 
  Gift, 
  Heart, 
  Save, 
  Volume2,
  Plus,
  Trash2,
  Edit3,
  User,
  Users,
  Search,
  AlertCircle,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { 
  BirthdayData, 
  ExtraBirthdayItem, 
  RelationshipType, 
  ReminderTimingUnit 
} from '../types';
import { isBirthdayToday, getDaysUntilBirthday } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { playStreakFanfare, playSuccessChime } from '../utils/audio';
import { sendSystemNotification } from '../utils/notifications';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdayData: BirthdayData;
  userName: string;
  onSaveBirthday: (data: BirthdayData) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

const RELATIONSHIP_OPTIONS: { id: RelationshipType; label: string; icon: string; badgeClass: string }[] = [
  { id: 'Friend', label: 'Friend', icon: '🤝', badgeClass: 'bg-blue-100 text-blue-900 border-blue-200' },
  { id: 'Family', label: 'Family', icon: '💖', badgeClass: 'bg-rose-100 text-rose-900 border-rose-200' },
  { id: 'Classmate', label: 'Classmate', icon: '🎓', badgeClass: 'bg-purple-100 text-purple-900 border-purple-200' },
  { id: 'Colleague', label: 'Colleague', icon: '💼', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  { id: 'Mentor', label: 'Mentor', icon: '🌟', badgeClass: 'bg-amber-100 text-amber-900 border-amber-200' },
  { id: 'Other', label: 'Other', icon: '🎈', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' },
];

const THEME_COLORS: { id: 'rose' | 'purple' | 'amber' | 'emerald' | 'sky' | 'indigo'; label: string; class: string }[] = [
  { id: 'rose', label: 'Rose Pink', class: 'bg-rose-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'amber', label: 'Amber Gold', class: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald Mint', class: 'bg-emerald-500' },
  { id: 'sky', label: 'Sky Blue', class: 'bg-sky-500' },
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
];

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  isOpen,
  onClose,
  birthdayData,
  userName,
  onSaveBirthday,
  soundEnabled,
  onToast
}) => {
  // Navigation tabs: 'my-birthday' | 'extra-birthdays'
  const [activeTab, setActiveTab] = useState<'my-birthday' | 'extra-birthdays'>('my-birthday');

  // My Birthday State
  const [myDateInput, setMyDateInput] = useState(birthdayData.birthdayDate || '');
  const [myTimingValue, setMyTimingValue] = useState<number>(birthdayData.reminderTiming?.value || 1);
  const [myTimingUnit, setMyTimingUnit] = useState<ReminderTimingUnit>(birthdayData.reminderTiming?.unit || 'days');
  const [myCustomWish, setMyCustomWish] = useState(birthdayData.customWishNote || 'Wishing you a prosperous, joyous, and milestone-filled year ahead! 🌟');
  const [myWishesEnabled, setMyWishesEnabled] = useState(birthdayData.wishesEnabled !== false);

  // Extra Birthdays State
  const extraBirthdays: ExtraBirthdayItem[] = birthdayData.extraBirthdays || [];
  const [extraFilter, setExtraFilter] = useState<RelationshipType | 'All'>('All');
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);

  // Extra Birthday Form Fields
  const [formName, setFormName] = useState('');
  const [formRelationship, setFormRelationship] = useState<RelationshipType>('Friend');
  const [formDate, setFormDate] = useState('');
  const [formTimingValue, setFormTimingValue] = useState(1);
  const [formTimingUnit, setFormTimingUnit] = useState<ReminderTimingUnit>('days');
  const [formWishNote, setFormWishNote] = useState('');
  const [formColorTheme, setFormColorTheme] = useState<'rose' | 'purple' | 'amber' | 'emerald' | 'sky' | 'indigo'>('rose');

  // Sync state whenever birthdayData prop changes
  useEffect(() => {
    setMyDateInput(birthdayData.birthdayDate || '');
    setMyTimingValue(birthdayData.reminderTiming?.value || 1);
    setMyTimingUnit(birthdayData.reminderTiming?.unit || 'days');
    setMyCustomWish(birthdayData.customWishNote || 'Wishing you a prosperous, joyous, and milestone-filled year ahead! 🌟');
    setMyWishesEnabled(birthdayData.wishesEnabled !== false);
  }, [birthdayData]);

  const isMyBdayToday = isBirthdayToday(myDateInput);
  const myDaysUntil = getDaysUntilBirthday(myDateInput);

  // Check if any extra birthday is today
  const todayExtraBirthdays = extraBirthdays.filter(b => isBirthdayToday(b.birthdayDate));

  // Trigger confetti celebration
  const triggerCelebration = () => {
    if (soundEnabled) playStreakFanfare();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#3b82f6', '#10b981']
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 120,
          origin: { y: 0.6 }
        });
      }, 400);
    } catch (e) {
      console.debug(e);
    }
  };

  useEffect(() => {
    if (isOpen && (isMyBdayToday || todayExtraBirthdays.length > 0)) {
      triggerCelebration();
    }
  }, [isOpen, isMyBdayToday, todayExtraBirthdays.length]);

  if (!isOpen) return null;

  // ==========================================
  // MY BIRTHDAY HANDLERS
  // ==========================================

  const handleSaveMyBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myDateInput) {
      onToast("Date Required", "Please select your birthday date.", "alert");
      return;
    }

    const updated: BirthdayData = {
      ...birthdayData,
      birthdayDate: myDateInput,
      userName: userName,
      wishesEnabled: myWishesEnabled,
      reminderTiming: {
        value: Number(myTimingValue) || 1,
        unit: myTimingUnit
      },
      customWishNote: myCustomWish.trim(),
      lastCelebratedYear: isMyBdayToday ? new Date().getFullYear() : birthdayData.lastCelebratedYear
    };

    onSaveBirthday(updated);
    if (soundEnabled) playSuccessChime();
    onToast("🎂 Birthday Saved", `Your birthday reminder is set for ${myDateInput}!`, "success");
  };

  const handleDeleteMyBirthday = () => {
    if (!myDateInput) {
      onToast("No Birthday Set", "You have not set your personal birthday date yet.", "info");
      return;
    }

    if (window.confirm("Are you sure you want to delete/clear your personal birthday reminder?")) {
      const updated: BirthdayData = {
        ...birthdayData,
        birthdayDate: '',
        wishesEnabled: false,
        customWishNote: ''
      };

      setMyDateInput('');
      setMyWishesEnabled(false);
      onSaveBirthday(updated);
      if (soundEnabled) playSuccessChime();
      onToast("🗑️ Birthday Deleted", "Your personal birthday reminder has been deleted.", "info");
    }
  };

  // ==========================================
  // EXTRA BIRTHDAYS HANDLERS
  // ==========================================

  const openAddExtraModal = () => {
    setEditingExtraId(null);
    setFormName('');
    setFormRelationship('Friend');
    setFormDate('');
    setFormTimingValue(1);
    setFormTimingUnit('days');
    setFormWishNote('');
    setFormColorTheme('rose');
    setIsExtraModalOpen(true);
  };

  const openEditExtraModal = (item: ExtraBirthdayItem) => {
    setEditingExtraId(item.id);
    setFormName(item.name);
    setFormRelationship(item.relationship);
    setFormDate(item.birthdayDate);
    setFormTimingValue(item.reminderTiming?.value || 1);
    setFormTimingUnit(item.reminderTiming?.unit || 'days');
    setFormWishNote(item.customWishNote || '');
    setFormColorTheme(item.colorTheme || 'rose');
    setIsExtraModalOpen(true);
  };

  const handleSaveExtraBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onToast("Name Required", "Please enter the person's name.", "alert");
      return;
    }
    if (!formDate) {
      onToast("Date Required", "Please select their birthday date.", "alert");
      return;
    }

    let updatedList: ExtraBirthdayItem[];
    if (editingExtraId) {
      updatedList = extraBirthdays.map(item => item.id === editingExtraId ? {
        ...item,
        name: formName.trim(),
        relationship: formRelationship,
        birthdayDate: formDate,
        reminderTiming: {
          value: Number(formTimingValue) || 1,
          unit: formTimingUnit
        },
        customWishNote: formWishNote.trim(),
        colorTheme: formColorTheme
      } : item);
    } else {
      const newItem: ExtraBirthdayItem = {
        id: `extra_bday_${Date.now()}`,
        name: formName.trim(),
        relationship: formRelationship,
        birthdayDate: formDate,
        reminderTiming: {
          value: Number(formTimingValue) || 1,
          unit: formTimingUnit
        },
        customWishNote: formWishNote.trim(),
        colorTheme: formColorTheme
      };
      updatedList = [...extraBirthdays, newItem];
    }

    const updatedData: BirthdayData = {
      ...birthdayData,
      extraBirthdays: updatedList
    };

    onSaveBirthday(updatedData);
    setIsExtraModalOpen(false);
    if (soundEnabled) playSuccessChime();
    onToast(
      editingExtraId ? "🎂 Birthday Updated" : "🎂 Extra Birthday Added!",
      `${formName}'s birthday (${formDate}) is saved.`,
      "success"
    );
  };

  const handleDeleteExtraBirthday = (id: string, name: string) => {
    if (window.confirm(`Delete birthday reminder for ${name}?`)) {
      const updatedList = extraBirthdays.filter(item => item.id !== id);
      const updatedData: BirthdayData = {
        ...birthdayData,
        extraBirthdays: updatedList
      };
      onSaveBirthday(updatedData);
      if (soundEnabled) playSuccessChime();
      onToast("🗑️ Birthday Deleted", `Removed ${name} from extra birthdays.`, "info");
    }
  };

  const handleTestNotification = (name: string, date: string, note?: string) => {
    sendSystemNotification({
      title: `🎂 Special Birthday Alert: ${name}! 🎉`,
      body: note ? `Wishing ${name} on ${date}: "${note}"` : `Don't forget to wish ${name} a wonderful Happy Birthday!`,
      tag: `test-bday-${name}`
    });
    onToast("🔔 Notification Dispatched", `Real test notification triggered for ${name}!`, "info");
  };

  // Filtered extra birthdays
  const filteredExtraBirthdays = extraFilter === 'All'
    ? extraBirthdays
    : extraBirthdays.filter(b => b.relationship === extraFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl border border-rose-200 relative max-h-[92vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md shadow-rose-500/20 ring-2 ring-rose-300 flex-shrink-0">
            🎂
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-classic text-rose-950 flex items-center gap-2">
              <span>Birthday Reminders & Wishes</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-rose-700 font-medium">
              Manage your personal birthday and extra birthdays for friends, family & classmates!
            </p>
          </div>
        </div>

        {/* TODAY IS BIRTHDAY HERO BANNER */}
        {(isMyBdayToday || todayExtraBirthdays.length > 0) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-lg space-y-2.5 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-rose-200">
                <PartyPopper className="w-4 h-4 text-amber-300" />
                <span>TODAY IS A SPECIAL BIRTHDAY!</span>
              </div>
              <span className="text-2xl">🎉</span>
            </div>

            {isMyBdayToday && (
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-extrabold font-classic leading-tight">
                  Happy Birthday, {userName || 'Friend'}! 🎂
                </h4>
                <p className="text-xs text-rose-100 font-medium leading-relaxed">
                  {myCustomWish}
                </p>
              </div>
            )}

            {todayExtraBirthdays.length > 0 && (
              <div className="pt-1 space-y-1 border-t border-white/20">
                <p className="text-xs font-bold text-amber-200">
                  Friends Celebrating Today:
                </p>
                <div className="flex flex-wrap gap-2">
                  {todayExtraBirthdays.map(item => (
                    <span key={item.id} className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-bold flex items-center gap-1.5">
                      <span>🎈 {item.name}</span>
                      <span className="text-[10px] opacity-80">({item.relationship})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={triggerCelebration}
                className="px-4 py-2 bg-white text-rose-900 rounded-xl text-xs font-black shadow-md hover:bg-rose-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pop Party Confetti!</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs (My Birthday vs Extra Birthdays) */}
        <div className="flex items-center p-1 bg-rose-50 rounded-2xl border border-rose-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('my-birthday')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'my-birthday'
                ? 'bg-white text-rose-950 shadow-xs border border-rose-200'
                : 'text-rose-700 hover:text-rose-950'
            }`}
          >
            <User className="w-3.5 h-3.5 text-rose-600" />
            <span>My Birthday</span>
            {myDateInput && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('extra-birthdays')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'extra-birthdays'
                ? 'bg-white text-rose-950 shadow-xs border border-rose-200'
                : 'text-rose-700 hover:text-rose-950'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Extra Birthdays</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'extra-birthdays' ? 'bg-purple-100 text-purple-900' : 'bg-rose-200 text-rose-900'
            }`}>
              {extraBirthdays.length}
            </span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: MY BIRTHDAY */}
        {/* ============================================================ */}
        {activeTab === 'my-birthday' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Countdown Badge if set */}
            {myDateInput && myDaysUntil.daysRemaining >= 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
                  <Gift className="w-4 h-4 text-rose-600" />
                  <span>Your Next Birthday:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-rose-200 text-rose-950 font-extrabold text-xs font-mono">
                    {myDaysUntil.daysRemaining === 0 ? 'Today! 🎉' : `${myDaysUntil.daysRemaining} ${myDaysUntil.daysRemaining === 1 ? 'day' : 'days'} away`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestNotification(userName || 'You', myDateInput, myCustomWish)}
                    title="Send test phone notification"
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveMyBirthday} className="space-y-3.5">
              {/* Birthday Date Field */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>My Birthday Date (Day & Month) *</span>
                </label>
                <input
                  type="date"
                  value={myDateInput}
                  onChange={(e) => setMyDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-purple-950 focus:ring-2 focus:ring-rose-500/30"
                />
                <p className="text-[11px] text-purple-600 mt-1">
                  LifeBuddy tracks your date every year and triggers celebrations & reminders.
                </p>
              </div>

              {/* Advance Reminder Notice */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-700" />
                    <span>Advance Notification Notice</span>
                  </label>
                  <span className="text-[11px] text-purple-700 font-semibold">Custom Notice</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] font-bold text-purple-700 mb-1">Time Amount</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={myTimingValue}
                      onChange={(e) => setMyTimingValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-purple-700 mb-1">Timing Unit</span>
                    <select
                      value={myTimingUnit}
                      onChange={(e) => setMyTimingUnit(e.target.value as ReminderTimingUnit)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="hours">Hours in advance</option>
                      <option value="days">Days in advance</option>
                      <option value="months">Months in advance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Celebration Note */}
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Personal Celebration Wish Note</span>
                </label>
                <textarea
                  rows={2}
                  value={myCustomWish}
                  onChange={(e) => setMyCustomWish(e.target.value)}
                  placeholder="Write a custom celebratory motto or wish to display on your birthday..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 focus:ring-2 focus:ring-rose-500/30 resize-none"
                />
              </div>

              {/* Enable Celebration Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-xs font-bold text-rose-950">Show Celebratory Confetti & Wishes</span>
                <input
                  type="checkbox"
                  checked={myWishesEnabled}
                  onChange={(e) => setMyWishesEnabled(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              {/* Action Buttons: Save & Delete/Clear My Birthday */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-purple-100">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-700 hover:to-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save My Birthday</span>
                </button>

                {myDateInput && (
                  <button
                    type="button"
                    onClick={handleDeleteMyBirthday}
                    title="Delete your personal birthday reminder"
                    className="w-full sm:w-auto py-2.5 px-3.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                    <span>Delete Birthday</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: EXTRA BIRTHDAYS (ADD / DELETE / EDIT) */}
        {/* ============================================================ */}
        {activeTab === 'extra-birthdays' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Top Bar: Action to Add Extra Birthday + Relationship Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1">
                  <span>Extra Birthday Calendar</span>
                  <span className="text-purple-600 font-normal">({extraBirthdays.length} saved)</span>
                </h4>
                <p className="text-[11px] text-purple-700/80">
                  Track friends, family, and classmates with advance notifications
                </p>
              </div>

              <button
                type="button"
                onClick={openAddExtraModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Extra Birthday</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setExtraFilter('All')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  extraFilter === 'All'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                All ({extraBirthdays.length})
              </button>
              {RELATIONSHIP_OPTIONS.map(rel => {
                const count = extraBirthdays.filter(b => b.relationship === rel.id).length;
                return (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => setExtraFilter(rel.id)}
                    className={`px-2.5 py-1 rounded-xl font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      extraFilter === rel.id
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span>{rel.icon}</span>
                    <span>{rel.label}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        extraFilter === rel.id ? 'bg-white text-purple-900' : 'bg-purple-200 text-purple-950'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List of Extra Birthdays */}
            {filteredExtraBirthdays.length === 0 ? (
              <div className="p-7 text-center rounded-2xl bg-purple-50/50 border border-dashed border-purple-200 space-y-2.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
                  🎁
                </div>
                <p className="text-xs text-purple-950 font-bold">
                  {extraFilter === 'All' 
                    ? 'No extra birthdays added yet.' 
                    : `No birthdays added under "${extraFilter}".`}
                </p>
                <p className="text-[11px] text-purple-600 max-w-xs mx-auto">
                  Add birthdays for your best friends, family members, or classmates so you never forget to wish them!
                </p>
                <button
                  type="button"
                  onClick={openAddExtraModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Extra Birthday</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {filteredExtraBirthdays.map(item => {
                  const countdown = getDaysUntilBirthday(item.birthdayDate);
                  const isToday = countdown.isToday;
                  const isSoon = countdown.daysRemaining > 0 && countdown.daysRemaining <= 7;
                  const relMeta = RELATIONSHIP_OPTIONS.find(r => r.id === item.relationship) || RELATIONSHIP_OPTIONS[0];

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isToday
                          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
                          : 'bg-white border-purple-100 hover:border-purple-300 shadow-2xs'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-100 to-purple-100 text-purple-950 flex items-center justify-center text-lg flex-shrink-0 border border-purple-200">
                          {relMeta.icon}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-bold text-purple-950">
                              {item.name}
                            </h5>
                            <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${relMeta.badgeClass}`}>
                              {item.relationship}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-purple-700 flex-wrap">
                            <span className="font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-rose-500" />
                              {item.birthdayDate}
                            </span>
                            <span>•</span>
                            <span className="text-purple-600">
                              🔔 Notice: {item.reminderTiming?.value || 1} {item.reminderTiming?.unit || 'days'} before
                            </span>
                          </div>

                          {item.customWishNote && (
                            <p className="text-[11px] text-slate-600 italic line-clamp-1 pt-0.5">
                              "{item.customWishNote}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Countdown & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-100">
                        {/* Status Badge */}
                        {isToday ? (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-[11px] animate-bounce shadow-xs">
                            🎉 TODAY!
                          </span>
                        ) : isSoon ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[11px]">
                            In {countdown.daysRemaining} {countdown.daysRemaining === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 font-bold text-[11px]">
                            {countdown.daysRemaining === -1 ? 'Date set' : `In ${countdown.daysRemaining}d`}
                          </span>
                        )}

                        {/* Action Buttons: Test Notification, Edit, Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTestNotification(item.name, item.birthdayDate, item.customWishNote)}
                            title="Test alert on phone tray"
                            className="p-1.5 rounded-lg text-purple-600 hover:text-purple-950 hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditExtraModal(item)}
                            title="Edit birthday details"
                            className="p-1.5 rounded-lg text-purple-600 hover:text-purple-950 hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExtraBirthday(item.id, item.name)}
                            title="Delete this birthday"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODAL: ADD / EDIT EXTRA BIRTHDAY */}
        {/* ============================================================ */}
        {isExtraModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-purple-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-purple-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                    <Cake className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-bold font-classic text-purple-950">
                    {editingExtraId ? 'Edit Extra Birthday' : 'Add Extra Birthday'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExtraModalOpen(false)}
                  className="p-1 rounded-xl text-purple-400 hover:text-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExtraBirthday} className="space-y-3.5">
                {/* Person's Name */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Person's Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Sarah Jenkins, Mom, Rohan"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-purple-50/40 text-purple-950 font-semibold focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                {/* Relationship Selector */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Relationship
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {RELATIONSHIP_OPTIONS.map(rel => (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => setFormRelationship(rel.id)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          formRelationship === rel.id
                            ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                            : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        <span>{rel.icon}</span>
                        <span>{rel.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Birthday Date */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Birthday Date (Day & Month) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-purple-50/40 text-purple-950 font-bold focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                {/* Advance Notice */}
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <span className="block text-xs font-bold text-purple-950">
                    Advance Reminder Notice
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-purple-700 mb-0.5">Amount</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formTimingValue}
                        onChange={(e) => setFormTimingValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white font-bold text-purple-950"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-purple-700 mb-0.5">Unit</span>
                      <select
                        value={formTimingUnit}
                        onChange={(e) => setFormTimingUnit(e.target.value as ReminderTimingUnit)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white font-bold text-purple-950"
                      >
                        <option value="hours">Hours before</option>
                        <option value="days">Days before</option>
                        <option value="months">Months before</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Custom Wish / Gift Reminder Note */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Wish Note or Gift Idea (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formWishNote}
                    onChange={(e) => setFormWishNote(e.target.value)}
                    placeholder="e.g., Get a novel & send morning call wish..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-purple-50/40 text-purple-950 focus:ring-2 focus:ring-purple-500/30 resize-none"
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {editingExtraId ? 'Save Changes' : 'Add Birthday'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExtraModalOpen(false)}
                    className="py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
