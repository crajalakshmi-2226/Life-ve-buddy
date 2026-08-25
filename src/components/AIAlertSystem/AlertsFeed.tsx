import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Mail, 
  Smartphone, 
  Eye, 
  CheckCheck, 
  Zap, 
  Clock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AlertNotificationItem, AlertPriority, AlertCategory, RiskLevel } from '../../types';

interface AlertsFeedProps {
  alerts: AlertNotificationItem[];
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  onOpenMultiChannelModal: (alert: AlertNotificationItem) => void;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenMultiChannelModal,
  onToast
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter(alert => {
    if (showUnreadOnly && alert.isRead) return false;
    if (priorityFilter !== 'All' && alert.priority !== priorityFilter) return false;
    if (categoryFilter !== 'All' && alert.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchMsg = alert.message.toLowerCase().includes(q);
      const matchSub = alert.subject?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchSub;
    }
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const getPriorityBadge = (priority: AlertPriority) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-rose-600 text-white border-rose-700 animate-pulse';
      case 'High':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Low':
        return 'bg-purple-100 text-purple-900 border-purple-200';
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Action Required':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'Safe':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications, subjects, or actions..."
              className="w-full pl-9 pr-4 py-2 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                showUnreadOnly
                  ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              {showUnreadOnly ? 'Showing Unread Only' : 'Filter: Unread'}
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-purple-100 text-xs">
          <span className="font-bold text-slate-500 text-[11px]">Priority:</span>
          {['All', 'Emergency', 'High', 'Medium', 'Low'].map(pri => (
            <button
              key={pri}
              type="button"
              onClick={() => setPriorityFilter(pri)}
              className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                priorityFilter === pri
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              {pri}
            </button>
          ))}

          <span className="font-bold text-slate-500 text-[11px] ml-2">Category:</span>
          {['All', 'Academic', 'Attendance', 'Deadline', 'Exam', 'Fee Payment', 'Project Review'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-purple-950">No Matching Alerts</h4>
            <p className="text-xs text-slate-500">All notifications match your safe criteria or have been acknowledged.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isUnread = !alert.isRead;

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 relative ${
                  isUnread
                    ? 'bg-white border-purple-300 shadow-md ring-1 ring-purple-400/30'
                    : 'bg-white/80 border-purple-200 hover:border-purple-300 shadow-2xs opacity-90'
                }`}
              >
                {/* Top Meta Bar */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(alert.priority)}`}>
                      {alert.priority} Priority
                    </span>

                    {/* Risk Level Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadge(alert.riskLevel)}`}>
                      Risk: {alert.riskLevel}
                    </span>

                    {/* Category */}
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold">
                      {alert.category}
                    </span>

                    {alert.earlyWarning && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Early Warning</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {alert.dateStr}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                    )}
                  </div>
                </div>

                {/* Alert Title & Body */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold font-classic text-purple-950">
                    {alert.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {alert.message}
                  </p>
                </div>

                {/* Recommended Actions */}
                {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/90 space-y-1.5">
                    <div className="text-[11px] font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-700" />
                      <span>Prescribed Mitigation Steps:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {alert.recommendedActions.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bottom Channel Simulator & Action Triggers */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-purple-100 flex-wrap">
                  {/* Channels Dispatched */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-[11px] font-semibold text-slate-400">Dispatched:</span>
                    <button
                      type="button"
                      onClick={() => onOpenMultiChannelModal(alert)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Mail className="w-3 h-3 text-purple-600" />
                      <Smartphone className="w-3 h-3 text-purple-600" />
                      <span>Preview Email / SMS ({alert.dispatchedChannels.length} Channels)</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 text-purple-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkAsRead(alert.id);
                          onToast("Acknowleged", "Alert marked as read.", "info");
                        }}
                        className="px-3 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
