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
  Volume2
} from 'lucide-react';
import { BirthdayData, ReminderTimingUnit } from '../types';
import { isBirthdayToday, getDaysUntilBirthday } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { playStreakFanfare, playSuccessChime } from '../utils/audio';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdayData: BirthdayData;
  userName: string;
  onSaveBirthday: (data: BirthdayData) => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  isOpen,
  onClose,
  birthdayData,
  userName,
  onSaveBirthday,
  soundEnabled,
  onToast
}) => {
  const [dateInput, setDateInput] = useState(birthdayData.birthdayDate || '');
  const [timingValue, setTimingValue] = useState<number>(birthdayData.reminderTiming?.value || 1);
  const [timingUnit, setTimingUnit] = useState<ReminderTimingUnit>(birthdayData.reminderTiming?.unit || 'days');
  const [customWish, setCustomWish] = useState(birthdayData.customWishNote || 'Wishing you a prosperous, joyous, and milestone-filled year ahead! 🌟');
  const [wishesEnabled, setWishesEnabled] = useState(birthdayData.wishesEnabled !== false);

  const isToday = isBirthdayToday(dateInput);
  const daysUntil = getDaysUntilBirthday(dateInput);

  // Trigger celebration if it's birthday today
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
    if (isOpen && isToday) {
      triggerCelebration();
    }
  }, [isOpen, isToday]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput) {
      onToast("Date Required", "Please select your birthday date.", "alert");
      return;
    }

    const updated: BirthdayData = {
      birthdayDate: dateInput,
      userName: userName,
      wishesEnabled: wishesEnabled,
      reminderTiming: {
        value: Number(timingValue) || 1,
        unit: timingUnit
      },
      customWishNote: customWish.trim(),
      lastCelebratedYear: isToday ? new Date().getFullYear() : birthdayData.lastCelebratedYear
    };

    onSaveBirthday(updated);
    if (soundEnabled) playSuccessChime();
    onToast("🎂 Birthday Saved", `Birthday reminder set for ${dateInput}!`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-rose-200 relative max-h-[92vh] overflow-y-auto space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md shadow-rose-500/20 ring-2 ring-rose-300">
            🎂
          </div>
          <div>
            <h3 className="text-xl font-bold font-classic text-rose-950 flex items-center gap-2">
              <span>Birthday Reminder & Celebration</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-rose-700 font-medium">
              Save your birthday to receive celebratory wishes, balloons & confetti!
            </p>
          </div>
        </div>

        {/* CELEBRATION HERO BANNER IF TODAY IS BIRTHDAY */}
        {isToday && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-lg space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-rose-200">
                <PartyPopper className="w-4 h-4 text-amber-300" />
                <span>TODAY IS YOUR SPECIAL DAY!</span>
              </div>
              <span className="text-2xl">🎉</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-classic leading-tight">
                Happy Birthday, {userName || 'Friend'}! 🎂
              </h2>
              <p className="text-xs text-rose-100 font-medium leading-relaxed">
                {customWish}
              </p>
            </div>

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

        {/* Countdown Badge if not today */}
        {!isToday && dateInput && daysUntil.daysRemaining >= 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
              <Gift className="w-4 h-4 text-rose-600" />
              <span>Next Birthday Countdown:</span>
            </div>
            <span className="px-3 py-1 rounded-xl bg-rose-200 text-rose-950 font-extrabold text-xs font-mono">
              {daysUntil.daysRemaining === 0 ? 'Today!' : `${daysUntil.daysRemaining} ${daysUntil.daysRemaining === 1 ? 'day' : 'days'} away`}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Birthday Date */}
          <div>
            <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Your Birthday Date (Day & Month) *</span>
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-purple-950 focus:ring-2 focus:ring-rose-500/30"
            />
            <p className="text-[11px] text-purple-600 mt-1">
              Select your birth date. LifeBuddy will track the day and month every year.
            </p>
          </div>

          {/* Advance Reminder Notice Timing (Custom Notice: Hours / Days / Months) */}
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
                  value={timingValue}
                  onChange={(e) => setTimingValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <span className="block text-[10px] font-bold text-purple-700 mb-1">Timing Unit</span>
                <select
                  value={timingUnit}
                  onChange={(e) => setTimingUnit(e.target.value as ReminderTimingUnit)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="hours">Hours in advance</option>
                  <option value="days">Days in advance</option>
                  <option value="months">Months in advance</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-purple-600">
              Notification will fire {timingValue} {timingUnit} prior to your birthday.
            </p>
          </div>

          {/* Celebratory Note / Wishes */}
          <div>
            <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Personal Celebration Wish Note</span>
            </label>
            <textarea
              rows={2}
              value={customWish}
              onChange={(e) => setCustomWish(e.target.value)}
              placeholder="Write a custom celebratory motto or wish to show on your birthday..."
              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 focus:ring-2 focus:ring-rose-500/30 resize-none"
            />
          </div>

          {/* Enable Celebration Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="text-xs font-bold text-rose-950">Show Celebratory Confetti & Wishes</span>
            <input
              type="checkbox"
              checked={wishesEnabled}
              onChange={(e) => setWishesEnabled(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-700 hover:to-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Birthday Reminder</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
