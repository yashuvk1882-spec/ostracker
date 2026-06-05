/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Moon, Trash2, ShieldAlert, Sparkles, Smile, Clock, Heart, Zap, BedDouble, CalendarDays
} from 'lucide-react';
import { TrackerState, SleepLog } from '../types';

interface SleepProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function SleepEnergy({ state, updateState, selectedDate }: SleepProps) {
  // Sleep form
  const [durationHours, setDurationHours] = useState(8.0);
  const [qualityScore, setQualityScore] = useState(8);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');

  const handleAddSleepLog = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if a log already exists for this date, filter it out so we override/no duplicates
    const nextLogs = state.sleepLogs.filter(log => log.date !== selectedDate);

    const newLog: SleepLog = {
      id: 'sl_' + Date.now(),
      date: selectedDate,
      durationHours: Number(durationHours),
      qualityScore: Number(qualityScore),
      energyLevel: Number(energyLevel),
      bedTime: bedTime,
      wakeTime: wakeTime
    };

    updateState({
      ...state,
      sleepLogs: [newLog, ...nextLogs] // reverse chronological order sorted basically
    });
  };

  const handleDeleteSleepLog = (id: string) => {
    const remaining = state.sleepLogs.filter(s => s.id !== id);
    updateState({ ...state, sleepLogs: remaining });
  };

  // Generate dynamic sleep insights based on logs data
  const generateSleepInsights = () => {
    if (state.sleepLogs.length === 0) {
      return "No sleep history found. Log a few nights to unlock circadian energy correlations!";
    }

    const avgDuration = state.sleepLogs.reduce((sum, s) => sum + s.durationHours, 0) / state.sleepLogs.length;
    const avgQuality = state.sleepLogs.reduce((sum, s) => sum + s.qualityScore, 0) / state.sleepLogs.length;

    // Search correlation: high energy nights
    const highEnergyLogs = state.sleepLogs.filter(s => s.energyLevel >= 8);
    let insights = '';

    if (highEnergyLogs.length > 0) {
      const avgDurationHighEnergy = highEnergyLogs.reduce((sum, s) => sum + s.durationHours, 0) / highEnergyLogs.length;
      insights += `Highly productive mornings (energy ≥ 8) correlate with sleep durations around ${avgDurationHighEnergy.toFixed(1)} hours. `;
    } else {
      insights += `Aim for consistent bed times to maximize daily morning alertness. `;
    }

    if (avgDuration < state.profile.sleepGoal) {
      insights += `Currently, your overall sleep duration average (${avgDuration.toFixed(1)}h) is below your profile target (${state.profile.sleepGoal}h). Try turning in 30 minutes earlier.`;
    } else {
      insights += `Excellent job! Your overall sleep duration average (${avgDuration.toFixed(1)}h) matches your healthy rest targets cleanly.`;
    }

    return insights;
  };

  const activeDayLog = state.sleepLogs.find(log => log.date === selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sleep-panel-container">
      
      {/* Left Form: Logger (Cols: 5) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="log-sleep-panel">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600" /> Sleep Chamber Log
          </h2>
          <p className="text-xs text-gray-400">Record rest duration, timing, and morning productivity energy levels</p>
        </div>

        <form onSubmit={handleAddSleepLog} className="space-y-4" id="sleep-form">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Bed Time</label>
              <input 
                type="time" 
                value={bedTime}
                onChange={e => setBedTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Wake Time</label>
              <input 
                type="time" 
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold"
              />
            </div>
            
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Sleep Duration (Hours)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="4" 
                  max="14" 
                  step="0.5"
                  value={durationHours}
                  onChange={e => setDurationHours(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-gray-150 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 py-0.5 px-2.5 rounded-md shrink-0 w-14 text-center font-mono">
                  {durationHours} hrs
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2.5 border-t border-gray-50">
            {/* Quality Score Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> Sleep Quality Rating</span>
                <span className="font-mono text-indigo-600 font-extrabold">{qualityScore} / 10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={qualityScore}
                onChange={e => setQualityScore(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Energy Score Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" /> Wake Alertness Energy</span>
                <span className="font-mono text-indigo-600 font-extrabold">{energyLevel} / 10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={energyLevel}
                onChange={e => setEnergyLevel(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition"
          >
            {activeDayLog ? 'Update Sleep Record for Date' : 'Log Sleep Record'}
          </button>
        </form>

        {/* Selected date feedback details */}
        {activeDayLog && (
          <div className="bg-emerald-50/30 border border-emerald-200/50 p-3 rounded-xl flex items-center gap-2.5" id="active-day-feedback">
            <div className="p-1.5 bg-emerald-100/60 rounded-lg text-emerald-700">
              <Smile className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-gray-600">
              Logged: <strong className="text-emerald-800 font-bold">{activeDayLog.durationHours} hr sleep</strong> on {selectedDate} with an energy score of <span className="font-bold">{activeDayLog.energyLevel}/10</span>.
            </div>
          </div>
        )}
      </div>

      {/* Right Column: History List & Insights (Cols: 7) */}
      <div className="lg:col-span-7 flex flex-col space-y-6" id="sleep-right-logs">
        
        {/* Dynamic Circadian Insights */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-gray-800 font-extrabold">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/10" />
            <h3 className="text-xs uppercase font-mono tracking-wider">Circadian Correlation Insights</h3>
          </div>
          <p className="text-xs leading-relaxed text-gray-600">
            {generateSleepInsights()}
          </p>
        </div>

        {/* History Stream List */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-3 flex-1">
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase font-mono tracking-wider">Sleep Chronicles</h3>
            <p className="text-xs text-gray-400">Previous nights logs, sorted chronologically</p>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 flex-1" id="sleep-logs-stream">
            {state.sleepLogs.length > 0 ? (
              state.sleepLogs.map(log => (
                <div 
                  key={log.id} 
                  className="p-3.5 bg-white border border-gray-100 hover:border-gray-200 rounded-xl group flex justify-between items-center transition-colors"
                  id={`sleep-log-feed-${log.id}`}
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-800 font-bold">
                        {log.durationHours} hrs rested · <span className="text-indigo-600 font-semibold font-mono">Quality: {log.qualityScore}/10</span>
                      </div>
                      <div className="flex gap-2 text-[9px] font-mono text-gray-400 mt-1">
                        <span>Landed: {log.bedTime} - {log.wakeTime}</span>
                        <span>· Date logged: {log.date}</span>
                        <span className="text-amber-600 font-semibold">Alertness: {log.energyLevel}/10</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSleepLog(log.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-200">
                Sleep records clear. Log sleep to configure averages!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
