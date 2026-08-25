import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Sparkles, Heart } from 'lucide-react';
import { playAlertChime, playSuccessChime } from '../utils/audio';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onOpenStretchRelief?: () => void;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onOpenStretchRelief
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (soundEnabled) playAlertChime();
      if (mode === 'pomodoro') {
        setSessionsCompleted(prev => prev + 1);
        setMode('shortBreak');
        setTimeLeft(MODE_TIMES.shortBreak);
      } else {
        setMode('pomodoro');
        setTimeLeft(MODE_TIMES.pomodoro);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, soundEnabled]);

  if (!isOpen) return null;

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalTime = MODE_TIMES[mode];
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-purple-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-classic text-purple-950 leading-tight">Focus & Study Timer</h3>
            <p className="text-xs text-purple-700/80">Interval productivity with break cues</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-purple-50 rounded-2xl mb-6 border border-purple-200/70">
          <button
            type="button"
            onClick={() => handleModeChange('pomodoro')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'pomodoro' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-800 hover:bg-purple-100'
            }`}
          >
            Study (25m)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('shortBreak')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'shortBreak' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-800 hover:bg-purple-100'
            }`}
          >
            Break (5m)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('longBreak')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'longBreak' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-800 hover:bg-purple-100'
            }`}
          >
            Rest (15m)
          </button>
        </div>

        {/* Big Digital Clock Display */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-44 h-44 rounded-full bg-purple-50/70 flex items-center justify-center border-4 border-purple-100 shadow-inner">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="80"
                fill="none"
                stroke="#f3e8ff"
                strokeWidth="6"
              />
              <circle
                cx="88"
                cy="88"
                r="80"
                fill="none"
                stroke={mode === 'pomodoro' ? '#7e22ce' : '#a855f7'}
                strokeWidth="6"
                strokeDasharray={502}
                strokeDashoffset={502 - (502 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="text-center z-10">
              <div className="text-4xl font-extrabold font-mono text-purple-950 tracking-tight">
                {formattedTime}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500">
                {mode === 'pomodoro' ? 'Focus Session' : 'Rest & Relief Break'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-2xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRunning(!isRunning);
              if (soundEnabled && !isRunning) playSuccessChime();
            }}
            className={`px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2 ${
              isRunning 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Focus</span>
              </>
            )}
          </button>
        </div>

        {/* Sessions Completed & Micro-Stretch Link */}
        <div className="mt-5 pt-3 border-t border-purple-100 flex flex-col items-center gap-2 text-center text-xs font-semibold text-purple-800">
          <div>🎯 Completed focus blocks today: <span className="text-purple-950 font-bold">{sessionsCompleted}</span></div>
          {onOpenStretchRelief && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStretchRelief();
              }}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-950 underline flex items-center gap-1"
            >
              <span>🧘 Take a 60s Body Stretch Break</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
