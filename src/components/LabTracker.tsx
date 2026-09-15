import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Edit3, 
  Check, 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  Bell, 
  Calendar,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { LabData, LabEntry, EquipmentItem, DayOfWeek } from '../types';
import { getNextLabInfo, DAYS_OF_WEEK, formatTime12 } from '../utils/helpers';
import { playSuccessChime } from '../utils/audio';
import { sendSystemNotification } from '../utils/notifications';

interface LabTrackerProps {
  labData: LabData;
  onUpdateLabData: (data: LabData) => void;
  soundEnabled: boolean;
  onOpenStretchRelief?: () => void;
  onToast?: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
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
  onToast
}) => {
  // Normalize labs array
  const currentLabs: LabEntry[] = React.useMemo(() => {
    if (labData.labs && labData.labs.length > 0) {
      return labData.labs;
    }
    if (labData.hasLab === 'yes') {
      return [{
        id: 'default-lab-1',
        labName: labData.labName || 'Practical Science Lab',
        labDay: labData.labDay || 'Wednesday',
        labTime: labData.labTime || '09:00',
        labEndTime: '11:30',
        labLocation: labData.labLocation || 'Science Block B - Rm 302',
        reminderLeadTimeHours: labData.reminderLeadTimeHours || 24,
        equipment: labData.equipment?.length ? labData.equipment : DEFAULT_EQUIPMENT,
        colorTheme: 'purple'
      }];
    }
    return [];
  }, [labData]);

  const [selectedDayFilter, setSelectedDayFilter] = useState<DayOfWeek | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDay, setFormDay] = useState<DayOfWeek>('Wednesday');
  const [formTime, setFormTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('11:30');
  const [formLocation, setFormLocation] = useState('');
  const [formLeadHours, setFormLeadHours] = useState(24);
  const [formEquipment, setFormEquipment] = useState<EquipmentItem[]>(DEFAULT_EQUIPMENT);
  const [newGearItem, setNewGearItem] = useState('');

  const nextLabInfo = getNextLabInfo({
    ...labData,
    labs: currentLabs
  });

  // Automated Real Background/System Notification check for upcoming labs
  useEffect(() => {
    if (currentLabs.length === 0) return;

    const today = new Date();
    const currentDayName = DAYS_OF_WEEK[today.getDay() === 0 ? 6 : today.getDay() - 1];
    const tomorrowIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1 + 1) % 7;
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowIndex];
    const todayDateStr = today.toISOString().split('T')[0];

    currentLabs.forEach(lab => {
      // Check if lab is tomorrow and lead time covers it
      const isTomorrow = lab.labDay === tomorrowDayName;
      const keyTomorrow = `lab_notif_sent_${lab.id}_tomorrow_${todayDateStr}`;

      if (isTomorrow && (lab.reminderLeadTimeHours || 24) >= 20 && !localStorage.getItem(keyTomorrow)) {
        localStorage.setItem(keyTomorrow, 'sent');
        sendSystemNotification({
          title: `🔬 Tomorrow you have a Lab: ${lab.labName}`,
          body: `Scheduled for tomorrow (${lab.labDay}) at ${formatTime12(lab.labTime)}. Be prepared! Don't forget your Lab Coat and safety gear.`,
          tag: `lab-tomorrow-${lab.id}`,
          requireInteraction: true
        });
      }

      // Check if lab is today
      const isToday = lab.labDay === currentDayName;
      const keyToday = `lab_notif_sent_${lab.id}_today_${todayDateStr}`;
      if (isToday && !localStorage.getItem(keyToday)) {
        const [h, m] = lab.labTime.split(':').map(Number);
        const labMin = h * 60 + m;
        const nowMin = today.getHours() * 60 + today.getMinutes();
        const diffMin = labMin - nowMin;

        // If within 2 hours
        if (diffMin > 0 && diffMin <= 120) {
          localStorage.setItem(keyToday, 'sent');
          sendSystemNotification({
            title: `🔬 Upcoming Lab Today: ${lab.labName}`,
            body: `Starting in ${diffMin} minutes at ${formatTime12(lab.labTime)} (${lab.labLocation || 'Lab Room'}). Pack your lab manual!`,
            tag: `lab-today-${lab.id}`
          });
        }
      }
    });
  }, [currentLabs]);

  const openAddModal = (defaultDay?: DayOfWeek) => {
    setEditingLabId(null);
    setFormName('');
    setFormDay(defaultDay || 'Wednesday');
    setFormTime('09:00');
    setFormEndTime('11:30');
    setFormLocation('');
    setFormLeadHours(24);
    setFormEquipment(DEFAULT_EQUIPMENT.map(e => ({ ...e, checked: false })));
    setNewGearItem('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (lab: LabEntry) => {
    setEditingLabId(lab.id);
    setFormName(lab.labName);
    setFormDay(lab.labDay);
    setFormTime(lab.labTime);
    setFormEndTime(lab.labEndTime || '11:30');
    setFormLocation(lab.labLocation || '');
    setFormLeadHours(lab.reminderLeadTimeHours || 24);
    setFormEquipment(lab.equipment || DEFAULT_EQUIPMENT);
    setNewGearItem('');
    setIsAddModalOpen(true);
  };

  const handleSaveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      if (onToast) onToast('Name Required', 'Please provide a name for this lab course.', 'alert');
      return;
    }

    let updatedLabs: LabEntry[];
    if (editingLabId) {
      updatedLabs = currentLabs.map(l => l.id === editingLabId ? {
        ...l,
        labName: formName.trim(),
        labDay: formDay,
        labTime: formTime,
        labEndTime: formEndTime,
        labLocation: formLocation.trim(),
        reminderLeadTimeHours: Number(formLeadHours),
        equipment: formEquipment
      } : l);
    } else {
      const newLab: LabEntry = {
        id: `lab_${Date.now()}`,
        labName: formName.trim(),
        labDay: formDay,
        labTime: formTime,
        labEndTime: formEndTime,
        labLocation: formLocation.trim(),
        reminderLeadTimeHours: Number(formLeadHours),
        equipment: formEquipment,
        colorTheme: 'purple'
      };
      updatedLabs = [...currentLabs, newLab];
    }

    const updatedData: LabData = {
      ...labData,
      hasLab: updatedLabs.length > 0 ? 'yes' : 'no',
      labs: updatedLabs,
      // sync first lab for backward compat
      labName: updatedLabs[0]?.labName,
      labDay: updatedLabs[0]?.labDay || 'Wednesday',
      labTime: updatedLabs[0]?.labTime || '09:00',
      labLocation: updatedLabs[0]?.labLocation,
      equipment: updatedLabs[0]?.equipment || DEFAULT_EQUIPMENT
    };

    onUpdateLabData(updatedData);
    setIsAddModalOpen(false);
    if (soundEnabled) playSuccessChime();
    if (onToast) {
      onToast(
        editingLabId ? 'Lab Updated' : 'Lab Added! 🔬',
        `${formName} scheduled for ${formDay}s at ${formatTime12(formTime)}.`,
        'success'
      );
    }
  };

  const handleDeleteLab = (id: string, name: string) => {
    const updatedLabs = currentLabs.filter(l => l.id !== id);
    const updatedData: LabData = {
      ...labData,
      hasLab: updatedLabs.length > 0 ? 'yes' : 'no',
      labs: updatedLabs,
      labName: updatedLabs[0]?.labName,
      labDay: updatedLabs[0]?.labDay || 'Wednesday',
      labTime: updatedLabs[0]?.labTime || '09:00'
    };
    onUpdateLabData(updatedData);
    if (onToast) onToast('Lab Deleted', `${name} removed from your schedule.`, 'info');
  };

  const toggleEquipmentItem = (labId: string, itemId: string) => {
    const updatedLabs = currentLabs.map(lab => {
      if (lab.id !== labId) return lab;
      return {
        ...lab,
        equipment: (lab.equipment || []).map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      };
    });

    onUpdateLabData({
      ...labData,
      labs: updatedLabs
    });
    if (soundEnabled) playSuccessChime();
  };

  const handleTestSystemNotification = (lab: LabEntry) => {
    sendSystemNotification({
      title: `🔬 Tomorrow you have a Lab: ${lab.labName}`,
      body: `Scheduled for ${lab.labDay} at ${formatTime12(lab.labTime)} (${lab.labLocation || 'Lab Room'}). Be prepared with your Lab Coat and safety manual!`,
      tag: `lab-test-${lab.id}`
    });
    if (onToast) {
      onToast('Notification Sent! 🔔', `System notification dispatched for ${lab.labName}.`, 'success');
    }
  };

  const filteredLabs = selectedDayFilter === 'ALL'
    ? currentLabs
    : currentLabs.filter(l => l.labDay === selectedDayFilter);

  return (
    <div className="bg-purple-50/40 rounded-2xl p-4 sm:p-5 border border-purple-200/90 flex flex-col justify-between space-y-4 shadow-2xs">
      {/* Header with Title & Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-classic text-purple-950 leading-tight">
                🥼 Weekly Lab Tracker & Gear
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                {currentLabs.length} {currentLabs.length === 1 ? 'Lab' : 'Labs'}
              </span>
            </div>
            <p className="text-xs text-purple-700/80">
              Multiple weekly labs with real system notifications & gear prep checklists
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Lab</span>
        </button>
      </div>

      {/* Next Upcoming Lab Alert Banner */}
      {nextLabInfo.daysRemaining >= 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-100/90 to-indigo-100/90 border border-purple-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-purple-950">
                  Next Lab Session:
                </span>
                {nextLabInfo.isSoon && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                    Upcoming
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-purple-800">
                {nextLabInfo.displayText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {nextLabInfo.matchedLab && (
              <button
                type="button"
                onClick={() => handleTestSystemNotification(nextLabInfo.matchedLab!)}
                title="Send real system alert to verify notification system"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white text-purple-900 hover:bg-purple-50 border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Bell className="w-3 h-3 text-purple-600" />
                <span>Test Alert</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Day Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('ALL')}
          className={`px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer ${
            selectedDayFilter === 'ALL'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-100'
          }`}
        >
          All Days ({currentLabs.length})
        </button>
        {DAYS_OF_WEEK.map(day => {
          const count = currentLabs.filter(l => l.labDay === day).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDayFilter(day)}
              className={`px-2.5 py-1 rounded-xl font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                selectedDayFilter === day
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span>{day.substring(0, 3)}</span>
              {count > 0 && (
                <span className={`px-1 rounded-full text-[9px] font-bold ${
                  selectedDayFilter === day ? 'bg-white text-purple-800' : 'bg-purple-100 text-purple-900'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Labs List */}
      {filteredLabs.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-white border border-dashed border-purple-200 space-y-2">
          <p className="text-xs text-purple-600 font-medium">
            {selectedDayFilter === 'ALL' 
              ? 'No weekly labs configured yet.' 
              : `No lab sessions scheduled on ${selectedDayFilter}.`}
          </p>
          <button
            type="button"
            onClick={() => openAddModal(selectedDayFilter === 'ALL' ? 'Wednesday' : selectedDayFilter)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold hover:bg-purple-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule a Lab on {selectedDayFilter === 'ALL' ? 'Wednesday' : selectedDayFilter}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLabs.map(lab => {
            const packedCount = (lab.equipment || []).filter(e => e.checked).length;
            const totalCount = (lab.equipment || []).length;

            return (
              <div
                key={lab.id}
                className="p-4 rounded-2xl bg-white border border-purple-200/90 hover:border-purple-300 shadow-2xs space-y-3 transition-all"
              >
                {/* Lab Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold">
                        📅 {lab.labDay}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime12(lab.labTime)} {lab.labEndTime ? `– ${formatTime12(lab.labEndTime)}` : ''}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold font-classic text-purple-950 mt-1 line-clamp-1">
                      {lab.labName}
                    </h4>
                    {lab.labLocation && (
                      <p className="text-[11px] text-purple-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        <span>{lab.labLocation}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTestSystemNotification(lab)}
                      title="Send instant real notification"
                      className="p-1.5 rounded-lg text-purple-600 hover:text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(lab)}
                      title="Edit this lab"
                      className="p-1.5 rounded-lg text-purple-600 hover:text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLab(lab.id, lab.labName)}
                      title="Delete this lab"
                      className="p-1.5 rounded-lg text-purple-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reminder Lead Time Tag */}
                <div className="flex items-center justify-between text-[11px] bg-purple-50/60 px-2.5 py-1 rounded-xl border border-purple-100">
                  <span className="text-purple-700 font-medium">
                    🔔 Lead Alert: {lab.reminderLeadTimeHours || 24} hours before
                  </span>
                  <span className="text-purple-900 font-bold">
                    {packedCount}/{totalCount} packed
                  </span>
                </div>

                {/* Equipment / Gear Checklist */}
                <div className="space-y-1 pt-1">
                  {(lab.equipment || DEFAULT_EQUIPMENT).map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleEquipmentItem(lab.id, item.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        item.checked
                          ? 'bg-purple-100/70 border-purple-300 text-purple-950 font-medium'
                          : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.checked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-purple-700 flex-shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />
                        )}
                        <span className={item.checked ? 'line-through text-purple-400' : ''}>
                          {item.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Lab Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-purple-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-purple-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-classic text-purple-950">
                  {editingLabId ? 'Edit Lab Session' : 'Schedule New Lab Session'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-purple-400 hover:text-purple-800 hover:bg-purple-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Lab Course / Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Computer Networks Lab / Chemistry Lab"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-white font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Reminder Lead Time
                  </label>
                  <select
                    value={formLeadHours}
                    onChange={(e) => setFormLeadHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-white font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={24}>24 hours before (Evening before)</option>
                    <option value={12}>12 hours before</option>
                    <option value={3}>3 hours before</option>
                    <option value={2}>2 hours before</option>
                    <option value={1}>1 hour before</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Location / Lab Room (Optional)
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., Block 4 - Lab 201"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Equipment Checklist in Form */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-purple-950">
                  Required Lab Gear & Checklists
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 border border-purple-100 rounded-xl p-2 bg-purple-50/30">
                  {formEquipment.map((eq, idx) => (
                    <div key={eq.id} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-purple-950 font-medium truncate">{eq.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormEquipment(formEquipment.filter((_, i) => i !== idx))}
                        className="text-purple-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newGearItem}
                    onChange={(e) => setNewGearItem(e.target.value)}
                    placeholder="+ Add custom gear / manual..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGearItem.trim()) return;
                      setFormEquipment([
                        ...formEquipment,
                        { id: Date.now().toString(), name: newGearItem.trim(), checked: false }
                      ]);
                      setNewGearItem('');
                    }}
                    className="px-3 py-1.5 bg-purple-200 hover:bg-purple-300 text-purple-950 font-bold text-xs rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {editingLabId ? 'Save Changes' : 'Create Lab Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
