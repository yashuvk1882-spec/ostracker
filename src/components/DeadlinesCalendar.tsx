/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, 
  Circle, AlertCircle, Clock, Sparkles, Filter, Search, ArrowUpDown, Tag, ListTodo, ShieldAlert
} from 'lucide-react';
import { TrackerState, StudyDeadline } from '../types';
import { getLocalDateString } from '../utils/storage';

interface DeadlinesCalendarProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function DeadlinesCalendar({ state, updateState, selectedDate }: DeadlinesCalendarProps) {
  // Current calendar view month & year state
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Local state for deadline creation
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetDateStr, setTargetDateStr] = useState<string>(selectedDate);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState<string>('study'); // subject id or quick categorical code
  const [newNotes, setNewNotes] = useState('');

  // Filtering / Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setTargetDateStr(getLocalDateString(today));
  };

  // Build month matrix helper
  const getMonthDaysMatrix = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    // First day of target month
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday ...
    // Total days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const daysMatrix: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

    // Prior month overflow days to align grid on Monday (we prioritize Monday as day 1)
    // In JS index: Sun=0, Mon=1, Tue=2...
    // Let's adjust firstDayIndex to make Monday first
    const shiftedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = shiftedFirstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      daysMatrix.push({
        date: prevDate,
        isCurrentMonth: false,
        key: `prev-${dayNum}`
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      daysMatrix.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        key: `curr-${i}`
      });
    }

    // Next month overflow days to keep exact 6 rows (42 cells) block grid layout
    const totalRemainingCells = 42 - daysMatrix.length;
    for (let i = 1; i <= totalRemainingCells; i++) {
      daysMatrix.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        key: `next-${i}`
      });
    }

    return daysMatrix;
  };

  const daysMatrix = getMonthDaysMatrix();

  // Color code priorities
  const priorityColors = {
    high: { badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', text: 'text-rose-600' },
    medium: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-600' },
    low: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', text: 'text-blue-600' }
  };

  // Get localized subject or category title label
  const getCategoryMeta = (catId: string) => {
    const subject = state.subjects.find(s => s.id === catId);
    if (subject) {
      return { 
        name: subject.name, 
        color: subject.color || '#3b82f6',
        bg: 'bg-blue-50/50 text-blue-700 border-blue-100'
      };
    }
    // Static general presets fallback
    switch (catId) {
      case 'personal':
        return { name: 'Personal Life', color: '#e11d48', bg: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'gym':
        return { name: 'Fitness & Gym', color: '#059669', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'work':
        return { name: 'Work / Admin', color: '#7c3aed', bg: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'finance':
        return { name: 'Finance / Bills', color: '#d97706', bg: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'study':
      default:
        return { name: 'General Studies', color: '#2563eb', bg: 'bg-sky-50 text-sky-700 border-sky-100' };
    }
  };

  // Deadline days countdown computation
  const getCountdownLabel = (dueDateStr: string, completed: boolean) => {
    if (completed) return { text: 'Completed', color: 'text-emerald-600 font-bold bg-emerald-50' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-red-600 font-extrabold bg-red-50 border border-red-100 animate-pulse' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today!', color: 'text-amber-800 font-black bg-amber-100 border border-amber-200' };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'text-orange-700 font-bold bg-orange-50' };
    }
    return { text: `${diffDays} days left`, color: 'text-slate-600 font-medium bg-slate-50 border border-slate-100' };
  };

  // Add deadline
  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Build the robust study deadline that is compatible with existing views
    const newDeadline: StudyDeadline & { priority?: 'high' | 'medium' | 'low'; notes?: string; categoryCode?: string } = {
      id: 'dl_' + Date.now(),
      subjectId: newCategory, // Map subjectId to the selected category (subject ID or quick categorical tag)
      title: newTitle,
      dueDate: targetDateStr,
      completed: false,
      priority: newPriority,
      notes: newNotes
    };

    updateState({
      ...state,
      deadlines: [newDeadline, ...state.deadlines]
    });

    // Reset Form
    setNewTitle('');
    setNewNotes('');
    setShowAddForm(false);
  };

  // Delete deadline
  const handleDeleteDeadline = (dlId: string) => {
    const remaining = state.deadlines.filter(d => d.id !== dlId);
    updateState({ ...state, deadlines: remaining });
  };

  // Toggle complete state
  const handleToggleComplete = (dlId: string) => {
    const updated = state.deadlines.map(d => {
      if (d.id === dlId) {
        return { ...d, completed: !d.completed };
      }
      return d;
    });
    updateState({ ...state, deadlines: updated });
  };

  // Sync / clone to standard Daily Focus queue
  const syncToFocusTasks = (dl: any) => {
    // Check if it already exists to avoid redundant clones
    const isAlreadySynced = state.focusQueue.some(t => t.title.includes(dl.title) && t.date === dl.dueDate);
    if (isAlreadySynced) {
      alert("This deadline is already pinned in your Focus Tasks list for its due date!");
      return;
    }

    const newTask = {
      id: 'tsk_sync_' + Date.now(),
      title: `🚨 DEADLINE: ${dl.title}`,
      priority: dl.priority || 'high',
      completed: dl.completed,
      date: dl.dueDate,
      category: dl.subjectId || 'general',
      dueDate: dl.dueDate
    };

    updateState({
      ...state,
      focusQueue: [newTask, ...state.focusQueue]
    });

    alert(`Successfully synced! "${dl.title}" has been cloned as an active task in your Day Space list for ${dl.dueDate}.`);
  };

  // Gather unique category list for filters
  const uniqueCategoryIds = Array.from(new Set(state.deadlines.map(d => d.subjectId))).filter(Boolean);

  // Filter & Sort list calculation
  const getProcessedDeadlines = () => {
    let list = [...state.deadlines];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        d.title.toLowerCase().includes(q) || 
        (d as any).notes?.toLowerCase().includes(q)
      );
    }

    // Status filtering
    const todayStr = getLocalDateString(new Date());
    if (statusFilter === 'completed') {
      list = list.filter(d => d.completed);
    } else if (statusFilter === 'pending') {
      list = list.filter(d => !d.completed);
    } else if (statusFilter === 'overdue') {
      list = list.filter(d => !d.completed && d.dueDate < todayStr);
    }

    // Category filtering
    if (categoryFilter !== 'all') {
      list = list.filter(d => d.subjectId === categoryFilter);
    }

    // Sorting block
    list.sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        comparison = a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'priority') {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        const pA = priorityScore[a.priority as 'high' | 'medium' | 'low'] || 2;
        const pB = priorityScore[b.priority as 'high' | 'medium' | 'low'] || 2;
        comparison = pB - pA; // High priority first
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  };

  const processedDeadlines = getProcessedDeadlines();

  // Aggregated analytics helper
  const getDeadlineStats = () => {
    const all = state.deadlines;
    const completed = all.filter(d => d.completed).length;
    const pending = all.filter(d => !d.completed);
    const todayStr = getLocalDateString(new Date());
    const overdue = pending.filter(d => d.dueDate < todayStr).length;
    const highPriorityActive = pending.filter(d => d.priority === 'high').length;

    const rate = all.length > 0 ? Math.round((completed / all.length) * 100) : 0;

    return { total: all.length, completed, pending: pending.length, overdue, highPriorityActive, rate };
  };

  const stats = getDeadlineStats();

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]" id="deadlines-hub-view-canvas">
      
      {/* Prime Header Block */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="deadlines-header-mast">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              Interactive Deadline Calendar <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold border border-indigo-100">Live Workspace</span>
            </h1>
            <p className="text-xs text-gray-400">Map out milestones, routine reviews and high priority work onto a cohesive multi-day blueprint</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="px-3.5 py-1.5 border border-gray-200.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5" /> Jump to Today
          </button>
          
          <button
            onClick={() => {
              setTargetDateStr(selectedDate);
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            id="trigger-add-deadline-form"
          >
            <Plus className="w-4 h-4" /> Add Date Deadline
          </button>
        </div>
      </div>

      {/* Analytics Bento Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="deadlines-bento-metrics">
        
        {/* Total stats */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150/80 shadow-3xs flex flex-col justify-between" id="stat-total-card">
          <div className="text-[10px] uppercase tracking-wider text-gray-450 font-bold font-mono">Archived Deadlines</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs text-gray-400">total milestone dates</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-400 h-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Completion rate progress */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150/80 shadow-3xs flex flex-col justify-between" id="stat-rate-card">
          <div className="text-[10px] uppercase tracking-wider text-gray-450 font-bold font-mono">Met Task Success Rate</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600">{stats.rate}%</span>
            <span className="text-xs text-emerald-500 font-semibold">{stats.completed} done</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.rate}%` }} />
          </div>
        </div>

        {/* Urgent High count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150/80 shadow-3xs flex flex-col justify-between animate-pulse" id="stat-priority-card">
          <div className="text-[10px] uppercase tracking-wider text-gray-450 font-bold font-mono flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Immediate Attention
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-600">{stats.highPriorityActive}</span>
            <span className="text-xs text-rose-400">active high-priority</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full" style={{ width: stats.total > 0 ? `${(stats.highPriorityActive / stats.total) * 100}%` : '0%' }} />
          </div>
        </div>

        {/* Overdue alert */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150/80 shadow-3xs flex flex-col justify-between" id="stat-overdue-card">
          <div className="text-[10px] uppercase tracking-wider text-gray-450 font-bold font-mono flex items-center gap-1 text-red-700">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> Overdue Milestones
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-red-600">{stats.overdue}</span>
            <span className="text-xs text-red-500 font-bold font-mono">needs quick reschedule</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-500 h-full" style={{ width: stats.total > 0 ? `${(stats.overdue / stats.total) * 100}%` : '0%' }} />
          </div>
        </div>

      </div>

      {/* Main Grid Content: Left 12-Month Calendar, Right Deadline Action Queue (7 for wide, 5 for form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="calendar-viewports-grid">
        
        {/* Left Aspect: The Interactive monthly grid (Cols: 7) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs flex flex-col space-y-4" id="monthly-calendar-block">
          
          {/* Calendar month selector strip header */}
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-gray-100">
            <button 
              onClick={prevMonth}
              className="p-1.5 hover:bg-white hover:text-slate-900 text-slate-500 rounded-lg border border-transparent hover:border-gray-150 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
              {currentViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>

            <button 
              next-month-trigger=""
              onClick={nextMonth}
              className="p-1.5 hover:bg-white hover:text-slate-900 text-slate-500 rounded-lg border border-transparent hover:border-gray-150 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days labels Row */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-gray-100 pb-2">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((dLabel) => (
              <span key={dLabel} className="text-[10px] font-extrabold text-slate-400 font-mono tracking-wider">
                {dLabel}
              </span>
            ))}
          </div>

          {/* Calendar Days Matrix block */}
          <div className="grid grid-cols-7 gap-1" id="calendar-day-cards-wrapper">
            {daysMatrix.map(({ date, isCurrentMonth, key }) => {
              const formattedDateStr = getLocalDateString(date);
              const isToday = formattedDateStr === getLocalDateString(new Date());
              const isSelected = formattedDateStr === targetDateStr;

              // Filter deadlines falling on this cell's date
              const cellDeadlines = state.deadlines.filter(dl => dl.dueDate === formattedDateStr);
              const totalActiveInCell = cellDeadlines.filter(dl => !dl.completed).length;
              const hasOverdueInCell = cellDeadlines.some(dl => !dl.completed && formattedDateStr < getLocalDateString(new Date()));

              return (
                <div
                  key={key}
                  onClick={() => {
                    setTargetDateStr(formattedDateStr);
                    // Open the Quick Add form immediately to deliver a stellar workflow experience!
                    setShowAddForm(true);
                  }}
                  className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isCurrentMonth 
                      ? isSelected
                        ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100'
                        : isToday
                          ? 'bg-slate-50 border-slate-300 ring-2 ring-slate-100'
                          : 'bg-white border-gray-100 hover:border-slate-350 hover:bg-slate-50/40'
                      : 'bg-gray-50/30 border-gray-100 opacity-35 hover:opacity-75'
                  }`}
                  id={`cell-${formattedDateStr}`}
                >
                  {/* Top: Day Number & Indicator icons */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-mono leading-none ${
                      isToday 
                        ? 'font-black text-indigo-750 bg-slate-200.5 px-1.5 py-0.5 rounded-md border border-slate-250' 
                        : isSelected
                          ? 'font-black text-indigo-600'
                          : 'font-medium text-slate-650'
                    }`}>
                      {date.getDate()}
                    </span>

                    {/* Small urgency markers inside cell */}
                    {totalActiveInCell > 0 && (
                      <span className={`w-2 h-2 rounded-full ${hasOverdueInCell ? 'bg-red-500 animate-ping' : 'bg-indigo-500'}`} />
                    )}
                  </div>

                  {/* Body: Tiny stacked list indicator indicators of deadlines */}
                  <div className="mt-1 space-y-0.5 overflow-hidden flex-1 flex flex-col justify-end" id={`cell-deadlines-stack-${formattedDateStr}`}>
                    {cellDeadlines.slice(0, 2).map(dl => {
                      const style = priorityColors[(dl as any).priority as 'high' | 'medium' | 'low'] || priorityColors.medium;
                      return (
                        <div 
                          key={dl.id}
                          className={`text-[8px] font-sans font-bold px-1 rounded-sm whitespace-nowrap overflow-hidden text-ellipsis border ${
                            dl.completed 
                              ? 'bg-emerald-50 text-emerald-800 line-through opacity-60 border-emerald-100'
                              : `${style.badge}`
                          }`}
                          title={`${dl.title} (${(dl as any).priority} priority)`}
                        >
                          {dl.title}
                        </div>
                      );
                    })}
                    {cellDeadlines.length > 2 && (
                      <span className="text-[7px] text-gray-400 font-extrabold font-mono block text-right">
                        +{cellDeadlines.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* Dynamic hovering selection guidance badge */}
                  <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
                </div>
              );
            })}
          </div>

          {/* Calendar Legends */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Today's Date
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Planned Milestone
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Overdue Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
            </span>
          </div>

        </div>

        {/* Right Aspect: Deadline action queue & configuration pane (Cols: 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-4" id="deadline-actions-and-list-view">

          {/* Collapsible form to create a new deadline */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col space-y-3.5"
                id="deadline-input-form-block"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-1 text-indigo-400">
                    <Plus className="w-4 h-4" /> Create Daily Milestone
                  </span>
                  
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  >
                    Hide
                  </button>
                </div>

                <form onSubmit={handleCreateDeadline} className="space-y-4" id="calendar-milestone-form">
                  {/* Due date lock info */}
                  <div className="flex justify-between items-center text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Target Date:</span>
                    <input 
                      type="date" 
                      value={targetDateStr}
                      onChange={(e) => setTargetDateStr(e.target.value)}
                      className="bg-transparent border-0 text-indigo-400 font-mono focus:ring-0 font-bold text-right py-0 pr-0"
                    />
                  </div>

                  {/* Title of Deadline */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Milestone/Work Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Midterm Lab Exam, Cardio Session, Electricity Bill"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-800 text-xs text-white border border-slate-750 focus:border-indigo-500 rounded-xl px-3 py-2.5 font-medium outline-hidden"
                    />
                  </div>

                  {/* Priorities & Categories Rows */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Urgency Level</label>
                      <select 
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full bg-slate-800 text-xs text-white border border-slate-750 focus:border-indigo-500 rounded-xl px-2 py-2.5 font-medium outline-hidden"
                      >
                        <option value="high">🚨 High Priority</option>
                        <option value="medium">⚡ Medium Priority</option>
                        <option value="low">🌱 Low Priority</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Context Space</label>
                      <select 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-slate-800 text-xs text-white border border-slate-750 focus:border-indigo-500 rounded-xl px-2 py-2.5 font-medium outline-hidden"
                      >
                        <option value="study">🎓 General Study</option>
                        <option value="personal">🌸 Personal Life</option>
                        <option value="gym">💪 Fitness & Gym</option>
                        <option value="work">🏢 Work / Admin</option>
                        <option value="finance">💳 Finance / Bills</option>
                        {/* Dynamic integration of actual subjects */}
                        {state.subjects.length > 0 && <optgroup label="Academic Subjects">
                          {state.subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>🎓 {sub.name}</option>
                          ))}
                        </optgroup>}
                      </select>
                    </div>
                  </div>

                  {/* Notes description */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Notes & Descriptions (Optional)</label>
                    <textarea 
                      placeholder="Requirements, checklist items or preparation instructions..."
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full bg-slate-800 text-xs text-white border border-slate-750 focus:border-indigo-500 rounded-xl px-3 py-2 font-medium outline-hidden resize-none"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-505 hover:bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Lock Milestone
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard deadlines task manager core pane */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-xs flex flex-col space-y-3" id="deadlines-list-controller-box">
            
            {/* Search/Filter subhead tools */}
            <div className="space-y-2.5 pb-3 border-b border-gray-100">
              
              <div className="flex items-center gap-1 text-xs text-gray-500 font-bold block mb-1">
                <Filter className="w-3.5 h-3.5 text-gray-400" /> Search & Filter Tools
              </div>

              {/* Text search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Query titles or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 text-xs border border-gray-200.5 rounded-xl pl-9 pr-3 py-2 focus:bg-white outline-hidden font-medium"
                />
              </div>

              {/* Filter pills buttons mapping */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(['all', 'pending', 'overdue', 'completed'] as const).map((filterOpt) => {
                  const isActive = statusFilter === filterOpt;
                  return (
                    <button
                      key={filterOpt}
                      onClick={() => setStatusFilter(filterOpt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold capitalize border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black shadow-3xs' 
                          : 'bg-white border-gray-150 text-gray-505 hover:bg-slate-50'
                      }`}
                    >
                      {filterOpt}
                    </button>
                  );
                })}
              </div>

              {/* Subject filters list if any */}
              {uniqueCategoryIds.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto select-none pt-0.5 scrollbar-none">
                  <button 
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2 py-0.5 text-[9px] rounded-md border font-mono font-bold shrink-0 cursor-pointer ${categoryFilter === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-gray-100 text-gray-400'}`}
                  >
                    All Contexts
                  </button>
                  {uniqueCategoryIds.map(catId => {
                    const meta = getCategoryMeta(catId);
                    return (
                      <button 
                        key={catId}
                        onClick={() => setCategoryFilter(catId)}
                        className={`px-2 py-0.5 text-[9px] rounded-md border font-bold shrink-0 cursor-pointer transition-all ${categoryFilter === catId ? `${meta.bg} ring-1 ring-offset-0 ring-indigo-200` : 'bg-slate-50 border-gray-100 text-gray-400'}`}
                      >
                        {meta.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sorting tools bar */}
              <div className="flex justify-between items-center pt-2 text-[10px] text-gray-400 font-bold border-t border-dashed border-gray-100 font-mono">
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" /> Sort by
                </span>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (sortBy === 'dueDate') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('dueDate');
                        setSortOrder('asc');
                      }
                    }}
                    className={`hover:text-slate-700 cursor-pointer ${sortBy === 'dueDate' ? 'text-indigo-650 font-black dark:text-indigo-600' : ''}`}
                  >
                    Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↓' : '↑')}
                  </button>
                  <button 
                    onClick={() => {
                      if (sortBy === 'priority') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('priority');
                        setSortOrder('desc');
                      }
                    }}
                    className={`hover:text-slate-700 cursor-pointer ${sortBy === 'priority' ? 'text-indigo-650 font-black dark:text-indigo-600' : ''}`}
                  >
                    Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button 
                    onClick={() => {
                      if (sortBy === 'title') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('title');
                        setSortOrder('asc');
                      }
                    }}
                    className={`hover:text-slate-700 cursor-pointer ${sortBy === 'title' ? 'text-indigo-650 font-black dark:text-indigo-600' : ''}`}
                  >
                    Name {sortBy === 'title' && (sortOrder === 'asc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>

            </div>

            {/* Rendered Deadlines Queue list container */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1" id="deadlines-feed-holder">
              {processedDeadlines.length > 0 ? (
                processedDeadlines.map((dl) => {
                  const urgentStyle = priorityColors[(dl as any).priority as 'high' | 'medium' | 'low'] || priorityColors.medium;
                  const catMeta = getCategoryMeta(dl.subjectId);
                  const countdown = getCountdownLabel(dl.dueDate, dl.completed);

                  return (
                    <div 
                      key={dl.id}
                      className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all hover:bg-slate-50/40 relative group ${
                        dl.completed 
                          ? 'border-gray-150 bg-gray-50/20 opacity-65' 
                          : 'border-gray-150 bg-white shadow-3xs'
                      }`}
                      id={`dl-card-${dl.id}`}
                    >
                      <div className="flex gap-2.5 items-start justify-between">
                        <div className="flex gap-2.5 items-start">
                          {/* Checkbox item */}
                          <button
                            onClick={() => handleToggleComplete(dl.id)}
                            className="text-gray-400 hover:text-indigo-600 pt-0.5 transition cursor-pointer"
                            id={`toggle-complete-dl-${dl.id}`}
                            title={dl.completed ? "Mark pending" : "Mark completed"}
                          >
                            {dl.completed ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-4.5 h-4.5" />
                            )}
                          </button>

                          <div className="space-y-0.5 text-left">
                            <h4 className={`text-xs font-bold leading-tight ${dl.completed ? 'line-through text-gray-450' : 'text-slate-800'}`}>
                              {dl.title}
                            </h4>
                            
                            {/* Notes description preview if logged */}
                            {(dl as any).notes && (
                              <p className="text-[10px] text-gray-500 italic max-w-[240px] truncate leading-normal">
                                {(dl as any).notes}
                              </p>
                            )}

                            {/* Tags meta array row */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5" id={`tags-row-${dl.id}`}>
                              {/* Subject / Category display badge */}
                              <span className="text-[9px] font-bold px-1.5 py-0.2 px-2 bg-slate-50 border border-slate-150 text-slate-650 rounded-sm font-mono flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                {catMeta.name}
                              </span>

                              {/* Priority badge */}
                              <span className={`text-[9px] font-bold px-2 py-0.2 uppercase border rounded-sm font-mono ${urgentStyle.badge}`}>
                                {(dl as any).priority || 'medium'}
                              </span>

                              {/* Due date stamp */}
                              <span className="text-[9px] text-gray-400 font-mono font-medium">
                                Due: {dl.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: countdown indicator badge */}
                        <div className="shrink-0 text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${countdown.color}`}>
                            {countdown.text}
                          </span>
                        </div>
                      </div>

                      {/* Complete bottom actions strip */}
                      <div className="flex justify-between items-center pt-2 border-t border-dotted border-gray-150 text-[10px]">
                        {/* Option to sync/clone task to Daily Focus list of its respective day */}
                        <button
                          onClick={() => syncToFocusTasks(dl)}
                          className="text-gray-505 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer font-bold bg-slate-50 px-2 py-1 rounded-md border hover:border-indigo-100"
                          title="Click to copy this deadline as a daily Focus Task in your Day Space list"
                          id={`dl-pin-${dl.id}`}
                        >
                          <ListTodo className="w-3.5 h-3.5 text-indigo-500" /> Sync to Focus List
                        </button>

                        <button
                          onClick={() => handleDeleteDeadline(dl.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors py-1 px-2 hover:bg-red-50/50 rounded-md cursor-pointer font-medium"
                          title="Delete Milestone permanently"
                          id={`dl-delete-${dl.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-xs italic text-gray-400 border border-dashed rounded-xl border-gray-200" id="empty-filtered-state">
                  No filter matches. Change queries or create a deadline of any day!
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
