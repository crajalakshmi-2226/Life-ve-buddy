import React, { useState } from 'react';
import { FlaskConical, Edit3, Check, CheckSquare, Square, ShieldCheck, MapPin, Clock, Plus, Trash2 } from 'lucide-react';
import { LabData, EquipmentItem } from '../types';
import { getNextLabInfo, DAYS_OF_WEEK } from '../utils/helpers';
import { playSuccessChime } from '../utils/audio';

interface LabTrackerProps {
  labData: LabData;
  onUpdateLabData: (data: LabData) => void;
  soundEnabled: boolean;
  onOpenStretchRelief?: () => void;
}

const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  { id: '1', name: 'Lab Coat 🥼', checked: true },
  { id: '2', name: 'Safety Goggles 👓', checked: false },
  { id: '3', name: 'Lab Manual / Notebook 📓', checked: true },
  { id: '4', name: 'Scientific Calculator 🧮', checked: false },
];

export const LabTracker: React.FC<LabTrackerProps> = ({
  labData,
  onUpdateLabData,
  soundEnabled,
  onOpenStretchRelief
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LabData>(() => ({
    ...labData,
    equipment: labData.equipment?.length ? labData.equipment : DEFAULT_EQUIPMENT
  }));
  const [newEquipmentName, setNewEquipmentName] = useState('');

  const nextLab = getNextLabInfo(labData);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLabData(formData);
    setIsEditing(false);
  };

  const toggleEquipment = (id: string) => {
    const updatedEquip = (formData.equipment || DEFAULT_EQUIPMENT).map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    const updated = { ...labData, equipment: updatedEquip };
    setFormData(updated);
    onUpdateLabData(updated);
    if (soundEnabled) playSuccessChime();
  };

  const addCustomEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipmentName.trim()) return;
    const newItem: EquipmentItem = {
      id: Date.now().toString(),
      name: newEquipmentName.trim(),
      checked: true
    };
    const updated = {
      ...formData,
      equipment: [...(formData.equipment || []), newItem]
    };
    setFormData(updated);
    onUpdateLabData(updated);
    setNewEquipmentName('');
  };

  const removeEquipment = (id: string) => {
    const updated = {
      ...formData,
      equipment: (formData.equipment || []).filter(item => item.id !== id)
    };
    setFormData(updated);
    onUpdateLabData(updated);
  };

  return (
    <div className="bg-purple-50/40 rounded-2xl p-4 sm:p-5 border border-purple-200/90 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-classic text-purple-950 leading-tight">
              🥼 Lab Reminder & Prep
            </h3>
            <p className="text-xs text-purple-700/80">
              {labData.hasLab === 'yes' ? `${labData.labDay}s session` : 'No active lab schedule'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 rounded-xl text-purple-600 hover:text-purple-950 hover:bg-purple-100 transition-colors"
          title={isEditing ? "Cancel Edit" : "Edit Lab Schedule"}
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {isEditing ? (
        /* Lab Edit Form */
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-purple-900 mb-1">Has Lab Session?</label>
              <select
                value={formData.hasLab}
                onChange={(e) => setFormData({ ...formData, hasLab: e.target.value as 'yes' | 'no' })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-purple-900 focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-900 mb-1">Lab Day</label>
              <select
                value={formData.labDay}
                onChange={(e) => setFormData({ ...formData, labDay: e.target.value as LabData['labDay'] })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-purple-900 focus:ring-2 focus:ring-purple-500/20"
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-purple-900 mb-1">Lab Time</label>
              <input
                type="time"
                value={formData.labTime}
                onChange={(e) => setFormData({ ...formData, labTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-medium text-purple-900 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-900 mb-1">Lab Course / Name</label>
              <input
                type="text"
                value={formData.labName || ''}
                onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                placeholder="e.g. Physics / Chem / CS Lab"
                className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-medium text-purple-900 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-purple-900 mb-1">Location / Room (Optional)</label>
            <input
              type="text"
              value={formData.labLocation || ''}
              onChange={(e) => setFormData({ ...formData, labLocation: e.target.value })}
              placeholder="e.g. Science Block B - Rm 302"
              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-medium text-purple-900 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Save Lab Schedule
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
        /* Lab Display Overview */
        <div className="space-y-3">
          {labData.hasLab === 'yes' ? (
            <>
              <div className="p-3.5 rounded-2xl bg-white border border-purple-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                    <Clock className="w-3 h-3 text-purple-700" />
                    Next: {nextLab.displayText}
                  </span>
                  {nextLab.isSoon && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      Upcoming
                    </span>
                  )}
                </div>

                {labData.labName && (
                  <p className="text-xs font-bold font-classic text-purple-950 flex items-center gap-1">
                    <span>📚</span>
                    <span>{labData.labName}</span>
                  </p>
                )}

                {labData.labLocation && (
                  <p className="text-xs text-purple-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400" />
                    <span>{labData.labLocation}</span>
                  </p>
                )}

                <div className="pt-2 border-t border-purple-100 flex items-center gap-2 text-xs font-semibold text-purple-950">
                  <ShieldCheck className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span>Don't forget your Lab Coat!</span>
                </div>
              </div>

              {/* Equipment Checklist */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Lab Prep Checklist</span>
                  <span className="text-purple-500 font-normal">
                    {(formData.equipment || []).filter(e => e.checked).length} / {(formData.equipment || []).length} packed
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {(formData.equipment || DEFAULT_EQUIPMENT).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleEquipment(item.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        item.checked
                          ? 'bg-purple-100/70 border-purple-300 text-purple-950 font-medium'
                          : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-purple-700 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        )}
                        <span className={item.checked ? 'line-through text-purple-400' : ''}>
                          {item.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEquipment(item.id);
                        }}
                        className="text-purple-300 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Quick Item */}
                <form onSubmit={addCustomEquipment} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                    placeholder="+ Add gear/manual..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-purple-200 bg-white placeholder:text-purple-300 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-purple-200 hover:bg-purple-300 text-purple-950 text-xs font-bold rounded-xl transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-4 text-center rounded-2xl bg-white border border-dashed border-purple-200 text-purple-600 text-xs space-y-2">
              <p>No active lab session configured.</p>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...labData, hasLab: 'yes' as const };
                  setFormData(updated);
                  onUpdateLabData(updated);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-bold hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Set Up Lab Schedule</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
