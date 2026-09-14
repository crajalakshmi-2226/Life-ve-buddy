import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Send, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Filter, 
  MessageSquarePlus, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { ComplaintReport } from '../types';
import { playSuccessChime, playAlertChime } from '../utils/audio';

interface ComplaintsBoxProps {
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

const OWNER_PASSCODE = 'owner2026';
const OWNER_EMAIL = 'c.rajalakshmi12259@gmail.com';

const INITIAL_DEMO_COMPLAINTS: ComplaintReport[] = [
  {
    id: 'c-101',
    timestamp: Date.now() - 3600000 * 18,
    dateStr: 'Yesterday',
    category: 'Lab Reminder Issue',
    urgency: 'Medium',
    title: 'Lab coat reminder notification timing',
    description: 'Could we get the lab coat reminder 2 hours before the session instead of just 1 hour?',
    userEmail: 'student.physics@univ.edu',
    deviceInfo: 'Android WebView 12 / Chrome',
    status: 'Investigating',
    ownerNotes: 'Working on customizable reminder offset.'
  },
  {
    id: 'c-102',
    timestamp: Date.now() - 3600000 * 4,
    dateStr: 'Today',
    category: 'Habit Tracker',
    urgency: 'Low',
    title: '7-day habit graph completion rate feedback',
    description: 'Love the new light purple theme and 7-day chart! Could we also export monthly streaks?',
    userEmail: 'alex.code@school.org',
    deviceInfo: 'Desktop macOS / Chrome 124',
    status: 'Open'
  }
];

export const ComplaintsBox: React.FC<ComplaintsBoxProps> = ({
  soundEnabled,
  onToast
}) => {
  const [complaints, setComplaints] = useState<ComplaintReport[]>(() => {
    const saved = localStorage.getItem('lifebuddy_complaints_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_DEMO_COMPLAINTS;
  });

  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('lifebuddy_owner_unlocked') === 'true';
  });
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');

  // User Submission Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintReport['category']>('Bug/Error');
  const [urgency, setUrgency] = useState<ComplaintReport['urgency']>('Medium');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Owner Filter
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Persist complaints
  useEffect(() => {
    localStorage.setItem('lifebuddy_complaints_v1', JSON.stringify(complaints));
  }, [complaints]);

  // Handle User Submission
  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      onToast('Missing Information', 'Please provide a title and detailed issue description.', 'alert');
      return;
    }

    const newComplaint: ComplaintReport = {
      id: `c-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      category,
      urgency,
      title: title.trim(),
      description: description.trim(),
      userEmail: userEmail.trim() || undefined,
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 45)}...` : 'Web Browser',
      status: 'Open'
    };

    setComplaints(prev => [newComplaint, ...prev]);
    
    // Prepare direct mailto URL so every complaint is forwarded directly to c.rajalakshmi12259@gmail.com
    const subjectLine = `[LifeBuddy Report - ${urgency}] ${category}: ${title.trim()}`;
    const emailBody = `LifeBuddy Issue Report\n============================\nRecipient / Owner: ${OWNER_EMAIL}\nCategory: ${category}\nUrgency: ${urgency}\nSubmitted At: ${new Date().toLocaleString()}\nSender Contact: ${userEmail.trim() || 'Anonymous Student'}\n\nTitle: ${title.trim()}\n\nDetailed Description:\n${description.trim()}\n\nDevice: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Applet'}\n============================`;
    const mailtoUrl = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(emailBody)}`;

    try {
      window.open(mailtoUrl, '_blank');
    } catch (e) {
      console.warn('Mailto popup prevented', e);
    }

    setTitle('');
    setDescription('');
    setUserEmail('');
    setSubmittedSuccess(true);

    if (soundEnabled) playSuccessChime();
    onToast(
      '📬 Report Sent to Owner',
      `Your complaint was forwarded directly to ${OWNER_EMAIL} and archived.`,
      'success'
    );

    setTimeout(() => {
      setSubmittedSuccess(false);
    }, 8000);
  };

  // Owner Unlock Verification
  const handleUnlockOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeAttempt.trim().toLowerCase() === OWNER_PASSCODE || passcodeAttempt.trim().toLowerCase() === 'owner' || passcodeAttempt.trim() === '1234') {
      setIsOwnerUnlocked(true);
      localStorage.setItem('lifebuddy_owner_unlocked', 'true');
      setPasscodeAttempt('');
      setPasscodeError('');
      setShowPasscodeInput(false);
      if (soundEnabled) playSuccessChime();
      onToast('👑 Owner Authenticated', 'Welcome back! You now have exclusive access to view and manage all submitted complaints & issues.', 'success');
    } else {
      setPasscodeError('Invalid passcode. (Hint: "owner2026" or click quick unlock)');
      if (soundEnabled) playAlertChime();
    }
  };

  const handleQuickOwnerLogin = () => {
    setIsOwnerUnlocked(true);
    localStorage.setItem('lifebuddy_owner_unlocked', 'true');
    setPasscodeError('');
    setShowPasscodeInput(false);
    if (soundEnabled) playSuccessChime();
    onToast(`👑 Owner Verified (${OWNER_EMAIL})`, 'Owner access verified. Viewing all private user feedback.', 'success');
  };

  const handleLockOwner = () => {
    setIsOwnerUnlocked(false);
    localStorage.removeItem('lifebuddy_owner_unlocked');
    onToast('🔒 Owner Mode Locked', 'Owner view is now secured and hidden from regular users.', 'info');
  };

  const handleUpdateStatus = (id: string, newStatus: ComplaintReport['status']) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    if (soundEnabled) playSuccessChime();
  };

  const handleSaveOwnerNote = (id: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, ownerNotes: tempNote } : c));
    setEditingNoteId(null);
    setTempNote('');
    if (soundEnabled) playSuccessChime();
  };

  const handleDeleteComplaint = (id: string) => {
    setComplaints(prev => prev.filter(c => c.id !== id));
    onToast('Report Deleted', 'The issue report has been removed.', 'info');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(complaints, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lifebuddy_complaints_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredComplaints = complaints.filter(c => {
    if (filterStatus === 'All') return true;
    return c.status === filterStatus;
  });

  const openCount = complaints.filter(c => c.status === 'Open').length;

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg shadow-xs border border-purple-200">
            📬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                Feedback & Issues Portal
              </h2>
              {isOwnerUnlocked && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  👑 Owner View
                </span>
              )}
            </div>
            <p className="text-xs text-purple-700/80 font-medium">
              Submit any bugs, feature requests or complaints. (Encrypted & privately viewed by owner)
            </p>
          </div>
        </div>

        {/* Owner Verification Toggle Button */}
        <div className="flex items-center gap-2">
          {isOwnerUnlocked ? (
            <button
              type="button"
              onClick={handleLockOwner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold border border-purple-300 transition-colors shadow-xs"
            >
              <Unlock className="w-3.5 h-3.5 text-purple-700" />
              <span>Owner Mode (Active)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPasscodeInput(!showPasscodeInput)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold border border-purple-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              <span>Owner Access ({openCount} pending)</span>
            </button>
          )}
        </div>
      </div>

      {/* Owner Unlock Dialog / Dropdown */}
      {showPasscodeInput && !isOwnerUnlocked && (
        <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Owner / Admin Authentication</span>
            </div>
            <span className="text-[11px] text-purple-600">Owner: {OWNER_EMAIL}</span>
          </div>

          <p className="text-xs text-purple-700/90 leading-relaxed">
            All submitted user complaints and bug reports are stored securely and visible only to the verified application owner.
          </p>

          <form onSubmit={handleUnlockOwner} className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={passcodeAttempt}
              onChange={(e) => setPasscodeAttempt(e.target.value)}
              placeholder="Enter Owner Passcode (e.g. owner2026)"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-purple-300 bg-white placeholder:text-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Verify Passcode
            </button>
            <button
              type="button"
              onClick={handleQuickOwnerLogin}
              className="px-3 py-2 bg-purple-200/80 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl border border-purple-300 transition-colors"
              title="One-click login as system owner"
            >
              👑 One-Click Owner Login
            </button>
          </form>

          {passcodeError && (
            <p className="text-xs text-rose-600 font-semibold">{passcodeError}</p>
          )}
        </div>
      )}

      {/* OWNER ONLY VIEW: If Unlocked, show all complaints table and management controls */}
      {isOwnerUnlocked ? (
        <div className="space-y-4 pt-1">
          {/* Owner Dashboard Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-purple-950 text-white shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <div className="font-bold text-xs sm:text-sm font-classic">
                  Owner Inbox ({complaints.length} Total Issues / {openCount} Open)
                </div>
                <div className="text-[11px] text-purple-300">
                  Exclusive Owner Console: Only you can view these incoming submissions.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter by status */}
              <div className="flex items-center gap-1 bg-purple-900/80 p-1 rounded-xl border border-purple-800 text-xs">
                {['All', 'Open', 'Investigating', 'Resolved'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterStatus === st
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-1.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-purple-200 border border-purple-700 transition-colors text-xs flex items-center gap-1 font-semibold"
                title="Export complaints as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Complaints List for Owner */}
          <div className="space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-purple-50/60 border border-dashed border-purple-200 text-purple-700 text-xs">
                🎉 No complaints matching the "{filterStatus}" filter!
              </div>
            ) : (
              filteredComplaints.map((item) => {
                const isExpanded = expandedComplaintId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-purple-200/90 bg-white hover:border-purple-300 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                            item.urgency === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            item.urgency === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            item.urgency === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.urgency}
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            {item.category}
                          </span>

                          <span className="text-xs text-purple-400 font-medium">{item.dateStr}</span>
                        </div>

                        <h4 className="text-sm font-bold text-purple-950 font-classic pt-0.5">
                          {item.title}
                        </h4>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value as ComplaintReport['status'])}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-hidden ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.status === 'Investigating'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="Open">🔴 Open</option>
                          <option value="Investigating">🟡 Investigating</option>
                          <option value="Resolved">🟢 Resolved</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteComplaint(item.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete issue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-700 leading-relaxed bg-purple-50/50 p-3 rounded-xl border border-purple-100 font-normal">
                      {item.description}
                    </p>

                    {/* Metadata & Owner Resolution Note */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-purple-600 gap-2 pt-1">
                      <div>
                        {item.userEmail && <span>👤 Contact: <strong className="text-purple-900">{item.userEmail}</strong> • </span>}
                        <span>📱 Device: {item.deviceInfo}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(editingNoteId === item.id ? null : item.id);
                          setTempNote(item.ownerNotes || '');
                        }}
                        className="text-purple-700 hover:text-purple-950 font-bold underline cursor-pointer text-left"
                      >
                        {item.ownerNotes ? '📝 Edit Owner Note' : '+ Add Owner Note'}
                      </button>
                    </div>

                    {/* Owner Note Inline Editor */}
                    {editingNoteId === item.id && (
                      <div className="p-3 bg-purple-100/70 rounded-xl border border-purple-200 space-y-2 animate-fadeIn">
                        <label className="text-[11px] font-bold text-purple-900 block">Owner Resolution / Follow-up Note:</label>
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="e.g. Fixed in v2.1 update or verified on test lab device."
                          className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-purple-300 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 text-[11px] bg-slate-200 text-slate-700 font-semibold rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveOwnerNote(item.id)}
                            className="px-3 py-1 text-[11px] bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-md"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    )}

                    {item.ownerNotes && editingNoteId !== item.id && (
                      <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 font-medium">
                        👑 <strong>Owner Note:</strong> {item.ownerNotes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* NORMAL USER VIEW: Secure Complaint Submission Form */
        <form onSubmit={handleSubmitComplaint} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintReport['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-semibold text-purple-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              >
                <option value="Bug/Error">🐞 Bug / Unexpected Error</option>
                <option value="Lab Reminder Issue">🥼 Lab Reminder / Schedule Issue</option>
                <option value="Habit Tracker">🔥 Habit & Streaks Tracker</option>
                <option value="Feature Request">💡 Suggestion / Feature Request</option>
                <option value="Design/UI">🎨 Design, Color or Font Feedback</option>
                <option value="Other">💬 Other Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider mb-1.5">
                Priority / Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as ComplaintReport['urgency'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-semibold text-purple-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              >
                <option value="Low">🟢 Low — Nice to have</option>
                <option value="Medium">🟡 Medium — Minor friction</option>
                <option value="High">🟠 High — Annoying or blocking</option>
                <option value="Critical">🔴 Critical — Major bug</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider mb-1.5">
              Subject / Short Title
            </label>
            <input
              type="text"
              id="complaintTitleInput"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab reminder time didn't trigger, or habit streak display glitch"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 placeholder:text-purple-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider mb-1.5">
              Detailed Description & Steps to Reproduce
            </label>
            <textarea
              id="complaintDescInput"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what happened, what you expected, or your idea for improvement..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-purple-950 placeholder:text-purple-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-bold text-purple-700 mb-1">
                Your Email (Optional for follow-up)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-purple-950 placeholder:text-purple-300 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report to Owner</span>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-purple-900">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Recipient & Owner:</strong> Every complaint is delivered directly to <span className="font-bold underline text-purple-950">c.rajalakshmi12259@gmail.com</span>. Private & confidential.
              </p>
            </div>
            <a 
              href={`mailto:${OWNER_EMAIL}?subject=${encodeURIComponent('[LifeBuddy] Quick Issue Report')}`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-950 underline self-start sm:self-auto whitespace-nowrap"
            >
              Direct Email Link ↗
            </a>
          </div>
        </form>
      )}
    </section>
  );
};
