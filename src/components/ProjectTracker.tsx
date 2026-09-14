import React, { useState } from 'react';
import { FolderGit2, Edit3, Plus, Trash2, CheckCircle2, Circle, AlertCircle, Sparkles, Trophy, X } from 'lucide-react';
import { ProjectData, ProjectMilestone } from '../types';
import { getProjectDeadlineInfo } from '../utils/helpers';
import confetti from 'canvas-confetti';
import { playSuccessChime, playStreakFanfare } from '../utils/audio';

interface ProjectTrackerProps {
  projectData: ProjectData;
  onUpdateProjectData: (data: ProjectData) => void;
  soundEnabled: boolean;
  onToast?: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
  onSetSmallWin?: (winText: string) => void;
  onLogHistory?: (title: string, category: 'Assignments', status: string, details?: string) => void;
}

const PRESET_MILESTONES = [
  "Literature Review & Problem Statement",
  "System Architecture Design",
  "Implementation & Core Modules",
  "Testing & Quality Assurance",
  "Final Documentation & Slides"
];

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({
  projectData,
  onUpdateProjectData,
  soundEnabled,
  onToast,
  onSetSmallWin,
  onLogHistory
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(projectData.projectName || 'Final Year Project');
  const [deadlineInput, setDeadlineInput] = useState(projectData.deadlineDate || '');
  const [newTaskText, setNewTaskText] = useState('');
  const [congratsNotice, setCongratsNotice] = useState<{ milestone: string; motivationalWin: string } | null>(null);

  const deadlineInfo = getProjectDeadlineInfo(projectData);
  const tasks = projectData.tasks || [];
  const completedCount = tasks.filter(t => t.done).length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProjectData({
      ...projectData,
      projectName: nameInput.trim() || 'My Project',
      deadlineDate: deadlineInput
    });
    setIsEditing(false);
  };

  const toggleTask = (taskId: number) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const wasCompleted = targetTask?.done;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    
    const newCompletedCount = newTasks.filter(t => t.done).length;
    const newPercent = newTasks.length > 0 ? Math.round((newCompletedCount / newTasks.length) * 100) : 0;

    onUpdateProjectData({
      ...projectData,
      tasks: newTasks
    });

    if (!wasCompleted && targetTask) {
      const motivation = "Momentum builds greatness! One focused victory at a time.";
      setCongratsNotice({
        milestone: targetTask.text,
        motivationalWin: motivation
      });

      if (onSetSmallWin) {
        onSetSmallWin(`Completed milestone: ${targetTask.text} 🎉`);
      }

      if (onToast) {
        onToast("Congratulations 🎉", `Completed "${targetTask.text}"! Recorded as your Daily Small Win.`, "success");
      }

      if (onLogHistory) {
        onLogHistory(targetTask.text, "Assignments", "Completed", `Ticked off milestone. Total progress: ${newPercent}%`);
      }

      if (newPercent === 100) {
        if (soundEnabled) playStreakFanfare();
        try {
          confetti({
            particleCount: 75,
            spread: 85,
            origin: { y: 0.6 }
          });
        } catch (e) {
          console.debug(e);
        }
      } else {
        if (soundEnabled) playSuccessChime();
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.65 }
          });
        } catch (e) {
          console.debug(e);
        }
      }
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: ProjectMilestone = {
      id: Date.now(),
      text: newTaskText.trim(),
      done: false
    };

    onUpdateProjectData({
      ...projectData,
      tasks: [...tasks, newTask]
    });
    setNewTaskText('');
  };

  const handleDeleteTask = (taskId: number) => {
    onUpdateProjectData({
      ...projectData,
      tasks: tasks.filter(t => t.id !== taskId)
    });
  };

  const handleAddPreset = (presetText: string) => {
    if (tasks.some(t => t.text.toLowerCase() === presetText.toLowerCase())) return;
    const newTask: ProjectMilestone = {
      id: Date.now() + Math.random(),
      text: presetText,
      done: false
    };
    onUpdateProjectData({
      ...projectData,
      tasks: [...tasks, newTask]
    });
  };

  return (
    <div className="bg-purple-50/40 rounded-2xl p-4 sm:p-5 border border-purple-200/90 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 flex-shrink-0 mt-0.5">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-classic text-purple-950 leading-tight">
              {projectData.projectName || 'My Project'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${deadlineInfo.badgeColor}`}>
                {deadlineInfo.statusText}
              </span>
              {projectData.deadlineDate && (
                <span className="text-[11px] text-purple-600 font-medium">
                  Due: {projectData.deadlineDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setNameInput(projectData.projectName);
            setDeadlineInput(projectData.deadlineDate);
            setIsEditing(!isEditing);
          }}
          className="p-1.5 rounded-xl text-purple-600 hover:text-purple-950 hover:bg-purple-100 transition-colors"
          title={isEditing ? "Cancel Edit" : "Edit Project Name & Deadline"}
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSaveDetails} className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-purple-900 mb-1">Project Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Final Year Capstone Project"
              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-purple-900 mb-1">Deadline Date</label>
            <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Save Project Info
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 rounded-xl bg-purple-100 text-purple-800 text-xs font-semibold hover:bg-purple-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Content: Progress bar & Task List */
        <div className="space-y-3.5">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-purple-950">
              <span>Milestones Progress</span>
              <span className="text-purple-700 font-extrabold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden border border-purple-200/50">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Congratulations 🎉 & Daily Small Win Notice */}
          {congratsNotice && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs space-y-1.5 animate-fadeIn relative">
              <button
                type="button"
                onClick={() => setCongratsNotice(null)}
                className="absolute top-2.5 right-2.5 text-emerald-200 hover:text-white p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-base">🎉</span>
                <h4 className="text-xs font-bold font-classic">
                  Congratulations! Finished "{congratsNotice.milestone}"!
                </h4>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                🌟 <strong>Daily Small Win:</strong> {congratsNotice.motivationalWin}
              </p>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-purple-400 italic text-center py-2">
                No milestones added yet. Add key steps below!
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                    task.done
                      ? 'bg-purple-100/60 border-purple-300 text-purple-400'
                      : 'bg-white border-purple-100 text-purple-950 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 pr-2">
                    {task.done ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-purple-300 flex-shrink-0" />
                    )}
                    <span className={task.done ? 'line-through text-purple-400' : 'font-medium'}>
                      {task.text}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="text-purple-300 hover:text-rose-600 p-0.5 rounded transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-1.5">
            <input
              type="text"
              id="newTaskInput"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="+ Add a key milestone..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white placeholder:text-purple-300 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Quick presets for students */}
          {tasks.length < 5 && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                Suggested Milestones:
              </span>
              <div className="flex flex-wrap gap-1">
                {PRESET_MILESTONES.filter(p => !tasks.some(t => t.text === p)).slice(0, 3).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
