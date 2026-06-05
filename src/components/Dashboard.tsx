/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, CheckCircle2, Clock, Plus, Trash2, 
  ChevronLeft, ChevronRight, Award, Flame, AlertCircle, Sparkles, BookOpen, Activity, Coffee
} from 'lucide-react';
import { TrackerState, TimetableEvent, FocusTask, TimetableCategory } from '../types';
import { getLocalDateString, parseLocalDate } from '../utils/storage';

interface DashboardProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export default function Dashboard({ state, updateState, selectedDate, setSelectedDate }: DashboardProps) {
  // Local state for forms
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<TimetableCategory>('study');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('11:00');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Quick navigation
  const changeDate = (days: number) => {
    const current = parseLocalDate(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateString(current));
  };

  // Get active week days
  const getWeekDays = () => {
    const today = parseLocalDate(selectedDate);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    // Find Monday (1), if Sunday (0) go back 6 days
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      days.push(current);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Filter items for current selected date
  const todaysTimeline = state.timetable.filter(item => item.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
  const todaysTasks = state.focusQueue.filter(task => task.date === selectedDate);

  // Quick calculations for progress metrics
  const totalCompletedTasks = todaysTasks.filter(t => t.completed).length;
  const totalTasksCount = todaysTasks.length;
  
  const studyMinutes = state.studySessions
    .filter(s => s.date === selectedDate)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const studyHours = parseFloat((studyMinutes / 60).toFixed(1));

  const caloriesLogged = state.meals
    .filter(m => m.date === selectedDate)
    .reduce((sum, m) => sum + m.calories, 0);

  const waterLogged = state.waterIntake[selectedDate] || 0;

  // Handles adding event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEvent: TimetableEvent = {
      id: 'evt_' + Date.now(),
      date: selectedDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      title: eventTitle,
      category: eventCategory
    };

    updateState({
      ...state,
      timetable: [...state.timetable, newEvent]
    });

    setEventTitle('');
    setShowEventForm(false);
  };

  // Handles adding task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: FocusTask = {
      id: 'tsk_' + Date.now(),
      title: taskTitle,
      priority: taskPriority,
      completed: false,
      date: selectedDate,
      category: 'general'
    };

    updateState({
      ...state,
      focusQueue: [...state.focusQueue, newTask]
    });

    setTaskTitle('');
  };

  const toggleTaskStatus = (taskId: string) => {
    const updated = state.focusQueue.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    updateState({ ...state, focusQueue: updated });
  };

  const deleteTask = (taskId: string) => {
    const remaining = state.focusQueue.filter(task => task.id !== taskId);
    updateState({ ...state, focusQueue: remaining });
  };

  const deleteEvent = (eventId: string) => {
    const remaining = state.timetable.filter(evt => evt.id !== eventId);
    updateState({ ...state, timetable: remaining });
  };

  const toggleEventComplete = (eventId: string) => {
    const updated = state.timetable.map(evt => {
      if (evt.id === eventId) {
        return { ...evt, completed: !evt.completed };
      }
      return evt;
    });
    updateState({ ...state, timetable: updated });
  };

  // Category styles dictionary
  const categoryStyles: Record<TimetableCategory, { bg: string, text: string, border: string, icon: any }> = {
    study: { bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-200', icon: BookOpen },
    gym: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200', icon: Activity },
    meals: { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-200', icon: Coffee },
    work: { bg: 'bg-purple-50/70', text: 'text-purple-700', border: 'border-purple-200', icon: CheckCircle2 },
    rest: { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200', icon: Clock },
    social: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-200', icon: Sparkles }
  };

  return (
    <div className="space-y-6">
      {/* Date Header & Swiper */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/75 backdrop-blur-md p-4 rounded-2xl border border-teal-100 shadow-xs gap-4" id="date-heading-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <Calendar className="w-5 h-5" id="header-calendar-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800" id="welcome-message-header">
              Stay in Rhythm, {state.profile.name}
            </h1>
            <p className="text-xs text-gray-500 font-mono">
              Selected: {parseLocalDate(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto" id="date-control-bar">
          <button 
            onClick={() => changeDate(-1)}
            className="p-1.5 bg-gray-50 hover:bg-teal-50 border border-gray-100 rounded-lg text-gray-500 hover:text-teal-600 transition-colors"
            id="prev-day-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setSelectedDate(getLocalDateString(new Date()))}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg text-xs font-semibold text-teal-700 transition-colors"
            id="jump-today-btn"
          >
            Today
          </button>

          <button 
            onClick={() => changeDate(1)}
            className="p-1.5 bg-gray-50 hover:bg-teal-50 border border-gray-100 rounded-lg text-gray-500 hover:text-teal-600 transition-colors"
            id="next-day-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Ribbon Swiper */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-white/50 p-2 rounded-xl border border-gray-100" id="week-date-ribbon">
        {weekDays.map((day, ix) => {
          const dateStr = getLocalDateString(day);
          const isSelected = dateStr === selectedDate;
          const isRealToday = dateStr === getLocalDateString(new Date());
          
          return (
            <button
              key={ix}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200 ${
                isSelected 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10 scale-103' 
                  : 'hover:bg-teal-50/50 text-gray-700'
              }`}
              id={`ribbon-day-${dateStr}`}
            >
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>
                {day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
              </span>
              <span className="text-sm font-bold mt-1">
                {day.getDate()}
              </span>
              {isRealToday && !isSelected && (
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Key Stats Circles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="quick-metrics-container">
        
        {/* Study target Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase font-mono tracking-wider">Study Track</div>
            <div className="text-base font-extrabold text-gray-800">{studyHours} h / {state.profile.studyGoal} h</div>
            <div className="w-24 bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((studyHours / state.profile.studyGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Progress Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase font-mono tracking-wider font-semibold">Focus Tasks</div>
            <div className="text-base font-extrabold text-gray-800">
              {totalCompletedTasks} / {totalTasksCount} done
            </div>
            <div className="w-24 bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${totalTasksCount ? (totalCompletedTasks / totalTasksCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nutrition Progress Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase font-mono tracking-wider">Calories</div>
            <div className="text-base font-extrabold text-gray-800">{caloriesLogged} kcal</div>
            <div className="text-[10px] text-gray-400">of {state.profile.calorieGoal} kcal target</div>
          </div>
        </div>

        {/* Water Intake progress Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase font-mono tracking-wider">Hydration</div>
            <div className="text-base font-extrabold text-gray-800">{waterLogged} / {state.profile.waterGoal} cups</div>
            <div className="w-24 bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((waterLogged / state.profile.waterGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Todays Timeline (Left) & Focus Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-grid">
        
        {/* Left Column: Timetable */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="timetable-section">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" /> Today's Timetable
              </h2>
              <p className="text-xs text-gray-400">Design your structural schedule block by block</p>
            </div>
            
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="p-1 px-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:shadow-sm transition-all"
              id="show-add-event-btn"
            >
              <Plus className="w-3.5 h-3.5" /> Block
            </button>
          </div>

          {/* Collapsible Event Form */}
          <AnimatePresence>
            {showEventForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddEvent}
                className="bg-teal-50/40 border border-teal-100/75 p-4 rounded-xl space-y-3 overflow-hidden"
                id="add-timetable-form"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase font-mono">Activity Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Computer Arch Lab" 
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase font-mono">Category</label>
                    <select
                      value={eventCategory}
                      onChange={e => setEventCategory(e.target.value as TimetableCategory)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden text-gray-700"
                    >
                      <option value="study">🎓 Study Session</option>
                      <option value="gym">🏋️ Gym / Workout</option>
                      <option value="meals">🍔 Food / Eating</option>
                      <option value="work">💼 Work / Projects</option>
                      <option value="rest">🧘 Relaxation / Leisure</option>
                      <option value="social">✨ Social / Play</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase font-mono">Starts At</label>
                    <input 
                      type="time" 
                      value={eventStartTime}
                      onChange={e => setEventStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase font-mono">Ends At</label>
                    <input 
                      type="time" 
                      value={eventEndTime}
                      onChange={e => setEventEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-teal-100/40">
                  <button 
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
                  >
                    Schedule Block
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Timetable sequential display */}
          <div className="relative border-l border-gray-100 pl-4 ml-2 space-y-4 pt-1 pb-1" id="timeline-stack">
            {todaysTimeline.length > 0 ? (
              todaysTimeline.map((item) => {
                const style = categoryStyles[item.category] || categoryStyles.study;
                const Icon = style.icon;
                return (
                  <div key={item.id} className="relative group" id={`time-event-${item.id}`}>
                    {/* Ring Indicator */}
                    <span className={`absolute -left-[21px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 transition-colors duration-200 ${item.completed ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-teal-600'}`}>
                      {item.completed && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>

                    {/* Timeline Item Card */}
                    <div className={`p-3 rounded-xl border ${style.bg} ${style.border} flex items-start justify-between gap-3 group-hover:shadow-xs transition-all ${item.completed ? 'opacity-65' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox button */}
                        <div className="pt-0.5" id={`timetable-check-${item.id}`}>
                          <input 
                            type="checkbox"
                            checked={!!item.completed}
                            onChange={() => toggleEventComplete(item.id)}
                            className="w-4 h-4 rounded-sm border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                            title="Mark task block as completed"
                          />
                        </div>

                        <div className={`p-1.5 rounded-lg bg-white ${style.text} shadow-2xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold text-gray-800 transition-all ${item.completed ? 'line-through text-gray-400' : ''}`}>{item.title}</h4>
                          <p className={`text-[10px] font-semibold mt-0.5 ${style.text} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            {item.startTime} - {item.endTime}
                            <span className="capitalize font-mono opacity-60">· {item.category}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteEvent(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete scheduling block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8" id="empty-timetable-state">
                <p className="text-xs text-gray-400 italic">No scheduled timetable blocks for today.</p>
                <button
                  onClick={() => setShowEventForm(true)}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Build Your Timetable
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Focus Queue */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="focus-queue-section">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-600" /> Focus Queue
            </h2>
            <p className="text-xs text-gray-400">Assignments & priorities that need your drive today</p>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2" id="add-task-form">
            <input
              type="text"
              placeholder="Add next urgent task..."
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50/75 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            />
            <select
              value={taskPriority}
              onChange={e => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="px-2 bg-gray-50/75 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:ring-1 focus:ring-teal-500 focus:border-transparent cursor-pointer"
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Mid</option>
              <option value="low">🟢 Low</option>
            </select>
            <button
              type="submit"
              className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0"
              title="Add task to day"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Task Stack */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1" id="task-feed-stack">
            {todaysTasks.length > 0 ? (
              todaysTasks.map((task) => {
                const priorityStyles = {
                  high: 'border-l-4 border-l-red-500 text-red-700 bg-red-50/30',
                  medium: 'border-l-4 border-l-amber-500 text-amber-700 bg-amber-50/30',
                  low: 'border-l-4 border-l-emerald-500 text-emerald-700 bg-emerald-50/30'
                };
                return (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-xl border border-gray-100 group hover:border-gray-200 transition-colors ${priorityStyles[task.priority]}`}
                    id={`task-card-${task.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskStatus(task.id)}
                        className="w-4 h-4 rounded-sm border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className={`text-xs ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-semibold'}`}>
                        {task.title}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10" id="empty-tasks-state">
                <p className="text-xs text-gray-400 italic">No tasks listed for today. Relax, or add a target!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
