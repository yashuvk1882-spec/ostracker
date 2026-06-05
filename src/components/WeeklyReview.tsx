/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Award, Calendar, Flame, Clock, Sparkles, BookOpen, CheckSquare, Smile
} from 'lucide-react';
import { TrackerState } from '../types';
import { getLocalDateString, parseLocalDate } from '../utils/storage';

interface ReviewProps {
  state: TrackerState;
  selectedDate: string;
}

export default function WeeklyReview({ state, selectedDate }: ReviewProps) {
  // Toggle tip tooltip
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Generate list of last 7 calendar days in chronological order ending on currently selectedDate
  const getTrailingSevenWeeksDates = () => {
    const list = [];
    const date = parseLocalDate(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const current = new Date(date);
      current.setDate(date.getDate() - i);
      list.push(getLocalDateString(current));
    }
    return list;
  };

  const trailingDates = getTrailingSevenWeeksDates();

  // 1. Calculate study hours per day
  const studyData = trailingDates.map(dateStr => {
    const daySessions = state.studySessions.filter(s => s.date === dateStr);
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    return {
      date: dateStr,
      label: parseLocalDate(dateStr).toLocaleDateString(undefined, { weekday: 'short' }),
      hours: parseFloat((totalMinutes / 60).toFixed(1))
    };
  });

  // Calculate stats
  const totalStudyWeekHours = studyData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
  const maxStudyDay = Math.max(...studyData.map(d => d.hours), 0.1); 

  // 2. Calorie progression path
  const calorieData = trailingDates.map(dateStr => {
    const dayMeals = state.meals.filter(m => m.date === dateStr);
    const kcal = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    return {
      date: dateStr,
      label: parseLocalDate(dateStr).toLocaleDateString(undefined, { weekday: 'short' }),
      kcal: kcal
    };
  });

  const avgKcal = Math.round(calorieData.reduce((sum, d) => sum + d.kcal, 0) / (calorieData.filter(d => d.kcal > 0).length || 1));
  const maxKcal = Math.max(...calorieData.map(d => d.kcal), 2500);

  // 3. Habit consistency ratios
  const habitConsistency = state.habits.map(h => {
    // Count completions in these 7 dates
    const completedInTrailing = trailingDates.filter(d => h.completedDates.includes(d)).length;
    // target can't exceed 7
    const target = Math.min(h.targetDaysPerWeek, 7);
    const pct = Math.round((completedInTrailing / (target || 1)) * 100);
    return {
      id: h.id,
      name: h.name,
      completedCount: completedInTrailing,
      targetCount: target,
      percentage: pct
    };
  });

  // 4. Completed tasks lists
  const completedTasksTrailing = state.focusQueue.filter(task => {
    return trailingDates.includes(task.date) && task.completed;
  });

  return (
    <div className="space-y-6" id="weekly-analytics-panel">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-teal-50/50 to-emerald-50/20 p-5 rounded-2xl border border-teal-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" /> Executive Progress Review
          </h2>
          <p className="text-xs text-gray-500">Trailing dashboard analytics over consecutive days ending on {selectedDate}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1 bg-white border border-teal-100 px-3 py-1.5 rounded-xl font-mono text-[10px] text-teal-700 font-extrabold shadow-2xs">
          <Calendar className="w-3.5 h-3.5" /> 7-DAY BINS
        </div>
      </div>

      {/* SVG Handcrafted Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="charts-flexbox">
        
        {/* CHART 1: Study Duration Bar SVG */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> Study Hours by Day
              </h3>
              <p className="text-[11px] text-gray-400">Time logged per calendar bin</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-semibold block">Cycle Volume</span>
              <span className="text-base font-black text-gray-800">{totalStudyWeekHours} hrs total</span>
            </div>
          </div>

          {/* SVG Canvas Bar Chart */}
          <div className="relative pt-4 pb-2">
            <svg viewBox="0 0 350 140" className="w-full h-auto">
              {/* Guidelines */}
              <line x1="20" y1="10" x2="330" y2="10" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="55" x2="330" y2="55" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="100" x2="330" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="100" x2="330" y2="100" stroke="#e2e8f0" />

              {/* Loop bars */}
              {studyData.map((d, idx) => {
                const colWidth = 35;
                const spacing = 10;
                const x = 32 + idx * (colWidth + spacing);
                // Math conversion: 100 max height
                const barHeight = (d.hours / maxStudyDay) * 90;
                const y = 100 - barHeight;

                const isHovered = hoveredDay === d.date;

                return (
                  <g 
                    key={d.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDay(d.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Background hover highlights */}
                    <rect 
                      x={x - 4} 
                      y="1" 
                      width={colWidth + 8} 
                      height="115" 
                      fill={isHovered ? '#f1f5f9/40' : 'transparent'} 
                      rx="6" 
                      className="transition-colors duration-200"
                    />

                    {/* True Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={colWidth}
                      height={Math.max(barHeight, 2)}
                      rx="4"
                      fill={isHovered ? '#2563EB' : '#3B82F6'}
                      className="transition-all duration-300"
                    />

                    {/* Numeric tooltip overlay inside bar/top */}
                    {d.hours > 0 && (
                      <text
                        x={x + colWidth / 2}
                        y={Math.max(y - 5, 8)}
                        textAnchor="middle"
                        fill={isHovered ? '#1e3a8a' : '#475569'}
                        className="text-[9px] font-mono font-bold"
                      >
                        {d.hours}h
                      </text>
                    )}

                    {/* Label */}
                    <text
                      x={x + colWidth / 2}
                      y="118"
                      textAnchor="middle"
                      fill="#94a3b8"
                      className="text-[9px] font-bold font-mono"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* CHART 2: Calories Intake curve Area SVG */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" /> Daily Calorie Log Curve
              </h3>
              <p className="text-[11px] text-gray-400">Energy fuel trend progression</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-semibold block">Cycle Average</span>
              <span className="text-base font-black text-gray-800">{avgKcal} kcal</span>
            </div>
          </div>

          {/* SVG Area Line Chart */}
          <div className="relative pt-4 pb-2">
            <svg viewBox="0 0 350 140" className="w-full h-auto">
              {/* Guidelines */}
              <line x1="20" y1="10" x2="330" y2="10" stroke="#f1f5f9" />
              <line x1="20" y1="55" x2="330" y2="55" stroke="#f1f5f9" />
              <line x1="20" y1="100" x2="330" y2="100" stroke="#f1f5f9" />
              <line x1="20" y1="100" x2="330" y2="100" stroke="#e2e8f0" />

              {/* Generate points array */}
              {(() => {
                const widthBetween = 44;
                const points = calorieData.map((d, idx) => {
                  const x = 25 + idx * widthBetween;
                  const ratio = d.kcal / maxKcal;
                  const y = 100 - (ratio * 90);
                  return { x, y, val: d.kcal, label: d.label };
                });

                // Convert points to SVG path strings
                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

                return (
                  <g>
                    {/* Fill Area */}
                    <path 
                      d={areaPath} 
                      fill="url(#calGrad)" 
                      className="transition-all duration-300"
                    />
                    
                    {/* Stroke Line */}
                    <path 
                      d={linePath} 
                      fill="none" 
                      stroke="#F97316" 
                      strokeWidth="2.5" 
                      className="transition-all duration-300"
                    />

                    {/* Gradient descriptor template */}
                    <defs>
                      <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#FB923C" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Nodes and tooltip labels */}
                    {points.map((p, ix) => (
                      <g key={ix} className="group/node cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="3.5" 
                          fill="#f97316" 
                          stroke="#ffffff" 
                          strokeWidth="1.5"
                          className="hover:scale-120 transition-transform"
                        />
                        
                        {/* Interactive numeric value popups on hover */}
                        <text
                          x={p.x}
                          y={Math.max(p.y - 6, 8)}
                          textAnchor="middle"
                          fill="#ea580c"
                          className="text-[8px] font-mono font-bold opacity-0 group-hover/node:opacity-100 transition-opacity bg-white"
                        >
                          {p.val}
                        </text>
                        
                        {/* Tick label */}
                        <text
                          x={p.x}
                          y="118"
                          textAnchor="middle"
                          fill="#94a3b8"
                          className="text-[9px] font-bold font-mono"
                        >
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

      </div>

      {/* Habits Consistency Matrix & Focus tasks accomplishments breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="review-extra-data-grid">
        
        {/* Habit Consistency */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Habit Consistency Matrix
            </h3>
            <p className="text-[11px] text-gray-400">Total days completed vs configured target cycles</p>
          </div>

          <div className="space-y-3" id="habits-consistency=feed">
            {habitConsistency.length > 0 ? (
              habitConsistency.map(h => (
                <div key={h.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>{h.name}</span>
                    <span className="font-mono text-teal-600">{h.completedCount} / {h.targetCount} days ({h.percentage}%)</span>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        h.percentage >= 100 
                          ? 'bg-emerald-500' 
                          : h.percentage >= 60 
                            ? 'bg-teal-500' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(h.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic text-xs bg-gray-50/20 border border-dashed rounded-xl border-gray-200">
                Configure habits to track weekly analytics consistency.
              </div>
            )}
          </div>
        </div>

        {/* Checked off Tasks Logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-violet-600" /> Focus Accomplishments Feed
            </h3>
            <p className="text-[11px] text-gray-400">Pristine checklist of tasks completed this cycle</p>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 flex-1" id="completed-tasks-history-scroll">
            {completedTasksTrailing.length > 0 ? (
              completedTasksTrailing.map(task => (
                <div 
                  key={task.id} 
                  className="p-2.5 bg-emerald-50/20 border border-emerald-100/50 rounded-xl flex items-center gap-2.5 text-xs text-gray-700"
                  id={`review-task-${task.id}`}
                >
                  <div className="text-emerald-600 shrink-0">
                    <CheckSquare className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 line-through decoration-gray-300">{task.title}</div>
                    <div className="text-[9px] font-mono font-medium text-gray-400 mt-0.5">Cleared on: {task.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-200 flex-1 flex items-center justify-center">
                Log and complete priority focus items!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
