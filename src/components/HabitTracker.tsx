/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Trash2, Award, Sparkles, CheckCircle2, Circle, Flame, Heart, BookOpen, CalendarDays
} from 'lucide-react';
import { TrackerState, HabitItem } from '../types';
import { getLocalDateString, parseLocalDate } from '../utils/storage';

interface HabitProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function HabitTracker({ state, updateState, selectedDate }: HabitProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Health');
  const [habitFrequency, setHabitFrequency] = useState(5); // days per week

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: HabitItem = {
      id: 'hb_' + Date.now(),
      name: newHabitName,
      category: newHabitCategory,
      targetDaysPerWeek: Number(habitFrequency),
      completedDates: [],
      createdAt: selectedDate
    };

    updateState({
      ...state,
      habits: [...state.habits, newHabit]
    });

    setNewHabitName('');
  };

  const handleDeleteHabit = (id: string) => {
    const remaining = state.habits.filter(h => h.id !== id);
    updateState({ ...state, habits: remaining });
  };

  // Toggle state of a habit completed for a specific date
  const toggleHabitOnDate = (habitId: string, dateStr: string) => {
    const updated = state.habits.map(h => {
      if (h.id === habitId) {
        const index = h.completedDates.indexOf(dateStr);
        let nextCompleted = [...h.completedDates];
        if (index > -1) {
          nextCompleted.splice(index, 1); // remove
        } else {
          nextCompleted.push(dateStr); // add
        }
        return {
          ...h,
          completedDates: nextCompleted
        };
      }
      return h;
    });

    updateState({ ...state, habits: updated });
  };

  // Generate 7 days trailing backwards from currently selectedDate
  const getTrailingSevenDays = () => {
    const list = [];
    const date = parseLocalDate(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const current = new Date(date);
      current.setDate(date.getDate() - i);
      list.push(current);
    }
    return list;
  };

  const trailingDays = getTrailingSevenDays();

  // Streak calculations - Backwards from selected date
  const calculateStreak = (habit: HabitItem, targetDateStr: string): { current: number, max: number } => {
    let currentStreak = 0;
    let maxStreak = 0;
    let runningStreak = 0;

    // We will analyze all dates since creation date up to targetDateStr, in chronological order
    const startDate = parseLocalDate(habit.createdAt);
    const endDate = parseLocalDate(targetDateStr);
    
    // Safety guard
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { current: 0, max: 0 };
    }

    const completedSet = new Set(habit.completedDates);

    // Let's count backwards from ending date to find Current Streak
    let tempDate = new Date(endDate);
    while (tempDate >= startDate) {
      const tempStr = getLocalDateString(tempDate);
      if (completedSet.has(tempStr)) {
        currentStreak++;
      } else {
        // If they skipped today, they might still be on streak if yesterday was completed.
        // But if they skipped yesterday too, the streak is officially broken.
        if (tempStr === targetDateStr) {
          // It's today. Check if they did it. If they didn't, streak is still alive if yesterday was done.
          // Let's look at yesterday.
          const yesterdayVal = new Date(tempDate);
          yesterdayVal.setDate(yesterdayVal.getDate() - 1);
          const yesterdayStr = getLocalDateString(yesterdayVal);
          if (!completedSet.has(yesterdayStr)) {
            break;
          }
        } else {
          break;
        }
      }
      tempDate.setDate(tempDate.getDate() - 1);
    }

    // Now, calculate Max historical streak chronologically
    let countDate = new Date(startDate);
    while (countDate <= endDate) {
      const countStr = getLocalDateString(countDate);
      if (completedSet.has(countStr)) {
        runningStreak++;
        if (runningStreak > maxStreak) {
          maxStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
      countDate.setDate(countDate.getDate() + 1);
    }

    // Edge case if current streak is higher (it shouldn't be, but just in case)
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    return { current: currentStreak, max: maxStreak };
  };

  const categories = ['Health', 'Mind', 'Study', 'Fitness', 'Projects', 'Waking'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="habits-panel-container">
      
      {/* Left side form: Create habit (Cols: 4) */}
      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="create-habit-panel">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase font-mono tracking-wider">Configure Habits</h2>
          <p className="text-xs text-gray-400 font-sans">Set daily rituals to keep active routines moving</p>
        </div>

        <form onSubmit={handleCreateHabit} className="space-y-3" id="add-habit-form">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase font-mono font-bold">Habit Metric / Action</label>
            <input 
              type="text" 
              placeholder="e.g., Read technical docs for 15 mins" 
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-bold uppercase font-mono font-bold block">Routine Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewHabitCategory(cat)}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-semibold select-none ${
                    newHabitCategory === cat 
                      ? 'bg-teal-50 border-teal-500/20 text-teal-700' 
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-gray-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase font-mono font-bold">Target days per week</label>
            <div className="flex items-center gap-1.5">
              <input 
                type="range" 
                min="1" 
                max="7"
                value={habitFrequency}
                onChange={e => setHabitFrequency(Number(e.target.value))}
                className="flex-1 accent-teal-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-extrabold text-teal-600 bg-teal-50 py-0.5 px-2 rounded-md shrink-0 w-8 text-center font-mono">
                {habitFrequency}d
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold shadow-xs transition-colors"
          >
            Create Ritual Habit
          </button>
        </form>
      </div>

      {/* Right Column: Weekly Tracker checks grid (Cols: 8) */}
      <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="habits-checklist-panel">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" /> Weekly Completion Canvas
          </h2>
          <p className="text-xs text-gray-400">Click dates backwards from selected day to complete goals</p>
        </div>

        {/* Habits Checklist Grid Table */}
        <div className="space-y-4 flex-1 overflow-x-auto select-none" id="habits-list-grid">
          {state.habits.length > 0 ? (
            <table className="w-full min-w-[550px]" id="habits-table-grid">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase font-mono text-left">
                  <th className="pb-2 w-[180px]">Habit</th>
                  <th className="pb-2 text-center w-[70px]">Streaks</th>
                  {trailingDays.map((td, idx) => {
                    const isFocusDate = getLocalDateString(td) === selectedDate;
                    return (
                      <th key={idx} className={`pb-2 text-center w-[45px] ${isFocusDate ? 'text-teal-600 font-extrabold' : 'text-gray-400'}`}>
                        <div className="text-[9px] uppercase tracking-wider">{td.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}</div>
                        <div className="text-xs font-bold mt-0.5">{td.getDate()}</div>
                      </th>
                    );
                  })}
                  <th className="pb-2 text-center w-[40px]">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {state.habits.map((item) => {
                  const s = calculateStreak(item, selectedDate);
                  return (
                    <tr key={item.id} className="group hover:bg-gray-50/20" id={`habit-row-${item.id}`}>
                      {/* Name Card */}
                      <td className="py-3 pr-2 select-text">
                        <div className="text-xs font-bold text-gray-800">{item.name}</div>
                        <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider font-mono text-gray-400 bg-gray-100 py-0.5 px-1.5 rounded-full">
                          {item.category} (target {item.targetDaysPerWeek}x)
                        </span>
                      </td>

                      {/* Streaks Counter */}
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1 select-none">
                          <Flame className="w-4 h-4 text-orange-500 fill-orange-500/10" />
                          <span className="text-xs font-extrabold text-gray-700">{s.current} <span className="text-[10px] text-gray-400 opacity-80">({s.max})</span></span>
                        </div>
                      </td>

                      {/* trailing Days checks */}
                      {trailingDays.map((td, idx) => {
                        const dateStr = getLocalDateString(td);
                        const isDone = item.completedDates.includes(dateStr);
                        const isSelectedDate = dateStr === selectedDate;
                        return (
                          <td key={idx} className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleHabitOnDate(item.id, dateStr)}
                              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all ${
                                isDone 
                                  ? 'bg-teal-600 text-white shadow-xs' 
                                  : isSelectedDate 
                                    ? 'border-2 border-dashed border-teal-400 text-teal-400 hover:bg-teal-50/40' 
                                    : 'border border-gray-200.5 hover:border-gray-400'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Deletes */}
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteHabit(item.id)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-200">
              No habit criteria configured yet. Set physical or study habits on the left!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
