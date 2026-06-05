/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, ShieldAlert, Sparkles, Sliders, Save, Download, Upload, Trash2, Heart, RotateCcw
} from 'lucide-react';
import { TrackerState, Profile } from '../types';
import { generateInitialState } from '../utils/storage';

interface SettingsProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
}

export default function Settings({ state, updateState }: SettingsProps) {
  // Profiles state
  const [profileName, setProfileName] = useState(state.profile.name);
  const [calorieGoal, setCalorieGoal] = useState(state.profile.calorieGoal);
  const [waterGoal, setWaterGoal] = useState(state.profile.waterGoal);
  const [studyGoal, setStudyGoal] = useState(state.profile.studyGoal);
  const [sleepGoal, setSleepGoal] = useState(state.profile.sleepGoal);

  // Paste backup code state
  const [backupJsonText, setBackupJsonText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const nextProfile: Profile = {
      name: profileName || 'Alex',
      calorieGoal: Number(calorieGoal) || 2000,
      waterGoal: Number(waterGoal) || 8,
      studyGoal: Number(studyGoal) || 4,
      sleepGoal: Number(sleepGoal) || 8
    };

    updateState({
      ...state,
      profile: nextProfile
    });

    triggerAlert('Settings profile goals updated successfully!', 'success');
  };

  const triggerAlert = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  // Export state helper script
  const handleExportState = () => {
    try {
      const serialized = JSON.stringify(state, null, 2);
      const blob = new Blob([serialized], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily_life_tracker_backup_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      triggerAlert('Database backup JSON compiled and downloaded!', 'success');
    } catch {
      triggerAlert('Unable to serialize system database state.', 'error');
    }
  };

  // Validation function for schemas import
  const handleImportState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupJsonText.trim()) return;

    try {
      const parsed = JSON.parse(backupJsonText);
      
      // Strict shape validation
      if (
        parsed && 
        typeof parsed === 'object' && 
        parsed.profile && 
        Array.isArray(parsed.timetable) && 
        Array.isArray(parsed.focusQueue) && 
        Array.isArray(parsed.habits)
      ) {
        updateState(parsed as TrackerState);
        setBackupJsonText('');
        triggerAlert('System database state restored from backup successfully!', 'success');
      } else {
        triggerAlert('Import failed: JSON structure does not match standard Daily Life Tracker spec.', 'error');
      }
    } catch {
      triggerAlert('Import failed: Code is malformed or invalid JSON syntax.', 'error');
    }
  };

  const handleResetApp = () => {
    if (window.confirm('Are you absolutely certain? This will wipe your study logs, gym logs, and config habits entirely.')) {
      const initial = generateInitialState();
      updateState(initial);
      setProfileName(initial.profile.name);
      setCalorieGoal(initial.profile.calorieGoal);
      setWaterGoal(initial.profile.waterGoal);
      setStudyGoal(initial.profile.studyGoal);
      setSleepGoal(initial.profile.sleepGoal);
      triggerAlert('All configurations & database tables reset successfully.', 'success');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="settings-view-panel">
      
      {/* Left Column: Profiles config (Cols: 6) */}
      <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="goals-management-card">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" /> Daily Targets & Profile
          </h2>
          <p className="text-xs text-gray-400">Tweak goals that drive your dashboard status bars</p>
        </div>

        {feedbackMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border border-rose-100'
          }`} id="toast-notify">
            {feedbackMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4" id="settings-general-form">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">User Name</label>
            <input 
              type="text" 
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-105 rounded-xl text-xs font-bold text-gray-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Calorie Target (kcal)</label>
              <input 
                type="number" 
                min="500" 
                max="8000"
                value={calorieGoal}
                onChange={e => setCalorieGoal(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50/60 border border-gray-105 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Water Intake Target (cups)</label>
              <input 
                type="number" 
                min="2" 
                max="30"
                value={waterGoal}
                onChange={e => setWaterGoal(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50/60 border border-gray-105 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Daily Study Target (hrs)</label>
              <input 
                type="number" 
                min="0.5" 
                max="24"
                step="0.5"
                value={studyGoal}
                onChange={e => setStudyGoal(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50/60 border border-gray-105 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Daily Sleep Target (hrs)</label>
              <input 
                type="number" 
                min="4" 
                max="18"
                step="0.5"
                value={sleepGoal}
                onChange={e => setSleepGoal(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50/60 border border-gray-105 rounded-lg text-xs font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Save className="w-4 h-4" /> Save Goals Config
          </button>
        </form>

        {/* Database destructive actions warnings */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-800">Danger Zone reset</div>
            <p className="text-[10px] text-gray-400">Revert app state of everything back to initial values</p>
          </div>
          <button
            type="button"
            onClick={handleResetApp}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Revert State
          </button>
        </div>
      </div>

      {/* Right Column: Schema export/imports tool (Cols: 6) */}
      <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="data-backups-card">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" /> Database Backup Tools
          </h2>
          <p className="text-xs text-gray-400">Export as local files, or import backup payload</p>
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Export card helper */}
          <div className="bg-gray-50/50 p-4 border border-gray-105 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-800">Export State JSON</div>
              <p className="text-[10px] text-gray-400 pr-2">Stores everything inside a downloadable single JSON text file.</p>
            </div>
            
            <button
              onClick={handleExportState}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-3xs hover:shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Import Paste form */}
          <form onSubmit={handleImportState} className="space-y-2 pt-2 border-t border-gray-100 flex-1 flex flex-col">
            <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Restore data pasteboard</label>
            <textarea
              rows={4}
              placeholder="Paste serialized database text payload here..."
              value={backupJsonText}
              onChange={e => setBackupJsonText(e.target.value)}
              className="w-full p-2.5 bg-gray-50/30 border border-gray-200 rounded-xl text-[10px] font-mono leading-relaxed outline-none flex-1 min-h-[120px]"
            />
            
            <button
              type="submit"
              disabled={!backupJsonText.trim()}
              className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" /> Restore Payload
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
