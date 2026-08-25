import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, RotateCcw, X, Sparkles, Check, Heart, ShieldAlert, Zap } from 'lucide-react';
import { StretchExercise } from '../types';
import { playSuccessChime, playAlertChime } from '../utils/audio';

interface BodyStretchReliefProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
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

export const BodyStretchRelief: React.FC<BodyStretchReliefProps> = ({
  isOpen,
  onClose,
  soundEnabled
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STRETCH_EXERCISES[0].durationSec);
  const [isActive, setIsActive] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const currentExercise = STRETCH_EXERCISES[currentIdx];

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (soundEnabled) playSuccessChime();
      setCompletedCount(prev => prev + 1);

      if (currentIdx < STRETCH_EXERCISES.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setTimeLeft(STRETCH_EXERCISES[currentIdx + 1].durationSec);
      } else {
        setIsActive(false);
        if (soundEnabled) playAlertChime();
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, timeLeft, currentIdx, soundEnabled]);

  if (!isOpen) return null;

  const handleSelectExercise = (idx: number) => {
    setCurrentIdx(idx);
    setTimeLeft(STRETCH_EXERCISES[idx].durationSec);
    setIsActive(false);
  };

  const handleTogglePlay = () => {
    setIsActive(!isActive);
    if (!isActive && soundEnabled) playSuccessChime();
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(currentExercise.durationSec);
  };

  const progress = ((currentExercise.durationSec - timeLeft) / currentExercise.durationSec) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-purple-200/80 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Subtle Decorative Gradient Background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-fuchsia-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
            <span className="text-2xl">🧘</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-classic text-purple-950">
                Body Stretch & Relief Routine
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                Micro-Break
              </span>
            </div>
            <p className="text-xs text-purple-600 font-medium">
              Relieve student body tension, spine stiffness & fatigue in 60 seconds
            </p>
          </div>
        </div>

        {/* Dynamic Animated Stretch Visualizer (Man Stretching for Body Relief) */}
        <div className="relative rounded-2xl bg-gradient-to-b from-purple-900 via-indigo-950 to-purple-950 p-5 text-white shadow-inner flex flex-col items-center justify-center overflow-hidden my-2 border border-purple-800/60">
          {/* Animated Glow Aura */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 rounded-full bg-purple-500/20 animate-breathe-glow" />
          </div>

          {/* SVG Illustration of Man / Character Stretching */}
          <div className="relative z-10 w-44 h-40 flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              className={`w-full h-full transition-transform duration-700 ${
                isActive ? 'animate-body-stretch' : ''
              }`}
            >
              {/* Ground shadow ripple */}
              <ellipse cx="100" cy="180" rx="45" ry="8" fill="#581c87" opacity="0.6" />

              {/* Character Head */}
              <circle
                cx="100"
                cy={currentExercise.animationType === 'neck-roll' && isActive ? 52 : 55}
                r="18"
                fill="#fbcfe8"
                stroke="#c084fc"
                strokeWidth="2"
              />
              {/* Face Details: peaceful closed eyes */}
              <path d="M 93 54 Q 96 52 99 54" stroke="#7e22ce" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 101 54 Q 104 52 107 54" stroke="#7e22ce" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 97 60 Q 100 64 103 60" stroke="#7e22ce" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Torso */}
              <path
                d="M 85 75 L 115 75 L 110 130 L 90 130 Z"
                fill="#a855f7"
                stroke="#c084fc"
                strokeWidth="2"
                className="transition-all"
              />

              {/* Spine Relief Energy Beam */}
              <path
                d="M 100 78 L 100 126"
                stroke="#e9d5ff"
                strokeWidth="3"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />

              {/* Left Arm: Stretching upwards or outwards */}
              <g className={isActive ? 'animate-arm-left' : ''}>
                <path
                  d="M 85 78 Q 62 48 55 25"
                  stroke="#fbcfe8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="55" cy="22" r="5" fill="#fbcfe8" />
              </g>

              {/* Right Arm: Stretching upwards or outwards */}
              <g className={isActive ? 'animate-arm-right' : ''}>
                <path
                  d="M 115 78 Q 138 48 145 25"
                  stroke="#fbcfe8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="145" cy="22" r="5" fill="#fbcfe8" />
              </g>

              {/* Legs in relaxed posture */}
              <path
                d="M 93 130 L 85 178"
                stroke="#6b21a8"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d="M 107 130 L 115 178"
                stroke="#6b21a8"
                strokeWidth="9"
                strokeLinecap="round"
              />

              {/* Floating Sparkles & Breath Particles */}
              {isActive && (
                <>
                  <circle cx="60" cy="18" r="2" fill="#fef08a" className="animate-ping" />
                  <circle cx="140" cy="18" r="2" fill="#fef08a" className="animate-ping" />
                  <circle cx="100" cy="30" r="3" fill="#e9d5ff" className="animate-bounce" />
                </>
              )}
            </svg>
          </div>

          {/* Real-time Posture Coach Text */}
          <div className="z-10 text-center mt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>{currentExercise.title}</span>
            </span>
            <p className="text-xs text-purple-100/90 max-w-sm mt-1 leading-relaxed px-2">
              {currentExercise.description}
            </p>
          </div>

          {/* Live Progress Ring & Timer */}
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

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 my-3">
          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-purple-600/25'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Stretch</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Stretch ({currentExercise.durationSec}s)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const next = (currentIdx + 1) % STRETCH_EXERCISES.length;
              handleSelectExercise(next);
            }}
            className="px-3 py-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors"
          >
            Next ➔
          </button>
        </div>

        {/* Exercise Playlist Selector */}
        <div className="space-y-1.5 overflow-y-auto max-h-36 pr-1">
          <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Select Stretch Target</span>
            <span className="text-purple-500 font-normal">Step {currentIdx + 1} of {STRETCH_EXERCISES.length}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STRETCH_EXERCISES.map((ex, idx) => {
              const isSelected = idx === currentIdx;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectExercise(idx)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2 ${
                    isSelected
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
              );
            })}
          </div>
        </div>

        {/* Benefit Note */}
        <div className="mt-3 p-2.5 rounded-xl bg-purple-50/90 border border-purple-200/80 text-[11px] text-purple-800 flex items-center gap-2">
          <Heart className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span><strong>Physical Benefit:</strong> {currentExercise.benefit}</span>
        </div>
      </div>
    </div>
  );
};
