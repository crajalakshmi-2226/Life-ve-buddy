import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  GraduationCap, 
  Palmtree, 
  FolderGit2, 
  Clock, 
  Trash2, 
  Download, 
  Layers,
  ArrowUpDown,
  FileText,
  Bell,
  Activity
} from 'lucide-react';
import { HistoryRecordItem, HistoryCategory } from '../types';

interface HistoryPageProps {
  records: HistoryRecordItem[];
  onClearHistory?: () => void;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  records,
  onClearHistory,
  onToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HistoryCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const categories: HistoryCategory[] = [
    'All',
    'Attendance & Leaves',
    'Reminders',
    'Assignments',
    'Habits',
    'Exams',
    'Holidays',
    'Physical Activities'
  ];

  // Filtering
  const filtered = records.filter(r => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesQuery = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.details && r.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.date.includes(searchQuery);
    return matchesCategory && matchesQuery;
  }).sort((a, b) => {
    return sortOrder === 'desc' 
      ? b.timestamp - a.timestamp 
      : a.timestamp - b.timestamp;
  });

  const getCategoryIcon = (category: HistoryRecordItem['category']) => {
    switch (category) {
      case 'Attendance & Leaves':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'Reminders':
        return <Bell className="w-4 h-4 text-amber-600" />;
      case 'Assignments':
        return <FolderGit2 className="w-4 h-4 text-indigo-600" />;
      case 'Habits':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'Exams':
        return <GraduationCap className="w-4 h-4 text-rose-600" />;
      case 'Holidays':
        return <Palmtree className="w-4 h-4 text-amber-600" />;
      case 'Physical Activities':
        return <Activity className="w-4 h-4 text-teal-600" />;
      default:
        return <FileText className="w-4 h-4 text-purple-600" />;
    }
  };

  const getCategoryBadgeClass = (category: HistoryRecordItem['category']) => {
    switch (category) {
      case 'Attendance & Leaves':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'Reminders':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Assignments':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'Habits':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Exams':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'Holidays':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Physical Activities':
        return 'bg-teal-100 text-teal-900 border-teal-200';
      default:
        return 'bg-purple-100 text-purple-900 border-purple-200';
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      onToast("Empty Log", "No records found to export.", "info");
      return;
    }
    const headers = ['Date', 'Category', 'Title', 'Status', 'Details'];
    const rows = filtered.map(r => [
      r.date,
      r.category,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.status.replace(/"/g, '""')}"`,
      `"${(r.details || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lifebuddy-history-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast("Export Complete", "History logs exported as CSV file.", "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm transition-all space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-xs border border-indigo-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-classic text-purple-950">
                  Centralized History & Archives
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Past Records
                </span>
              </div>
              <p className="text-xs text-purple-700/80 font-medium">
                Review past attendance logs, completed assignments, milestone wins & archived milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Total Records
            </span>
            <span className="text-xl font-black text-purple-950 font-mono">
              {records.length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Assignments Done
            </span>
            <span className="text-xl font-black text-indigo-950 font-mono">
              {records.filter(r => r.category === 'Assignments').length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Attendance Logs
            </span>
            <span className="text-xl font-black text-emerald-950 font-mono">
              {records.filter(r => r.category === 'Attendance & Leaves').length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Habits & Milestones
            </span>
            <span className="text-xl font-black text-amber-950 font-mono">
              {records.filter(r => r.category === 'Habits').length}
            </span>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history records by title, subject, notes, or date..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-purple-400 hover:text-purple-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-900 hover:bg-purple-50 transition-colors shadow-2xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'All' 
                ? records.length 
                : records.filter(r => r.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Record List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-purple-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mx-auto">
              📜
            </div>
            <div>
              <h4 className="text-base font-bold font-classic text-purple-950">
                No past records found
              </h4>
              <p className="text-xs text-purple-700/80 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? `No entries match "${searchQuery}". Try a different keyword.` 
                  : `Your completed tasks, attendance check-ins, and milestones will automatically appear here.`}
              </p>
            </div>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-purple-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 flex-shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-purple-600 font-mono font-medium">
                      📅 {item.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-purple-950 leading-tight">
                    {item.title}
                  </h4>
                  {item.details && (
                    <p className="text-xs text-purple-700/90 font-medium">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-purple-100 gap-1.5 flex-shrink-0">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-950 border border-purple-200">
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
