/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, ShieldAlert, Sparkles, Sliders, Save, Download, Upload, Trash2, Heart, RotateCcw,
  Bell, Volume2, ShieldCheck, HelpCircle, History
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

  // Browser Notifications System states
  const [notiPermission, setNotiPermission] = useState<NotificationPermission>(() => {
    try {
      if (!('Notification' in window)) return 'denied';
      return Notification.permission;
    } catch {
      return 'denied';
    }
  });

  const [notiEnabled, setNotiEnabled] = useState<boolean>(() => {
    return localStorage.getItem('notification_enabled') !== 'false';
  });

  const [notiAdvanceMins, setNotiAdvanceMins] = useState<number>(() => {
    return Number(localStorage.getItem('notification_advance_minutes')) || 10;
  });

  const [alertHistory, setAlertHistory] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('notification_alert_history') || '[]');
    } catch {
      return [];
    }
  });

  const handleRequestPermission = async () => {
    try {
      const { requestNotificationPermission } = await import('../utils/notifications');
      const perm = await requestNotificationPermission();
      setNotiPermission(perm);
      if (perm === 'granted') {
        triggerAlert('System browser notification permission GRANTED!', 'success');
        const { triggerNativeNotification } = await import('../utils/notifications');
        triggerNativeNotification('🔔 Space Workspace Connected', 'Notifications are beautifully configured, study hard!');
      } else {
        triggerAlert('Notification permission denied or blocked.', 'error');
      }
    } catch {
      triggerAlert('Browser permission request failed.', 'error');
    }
  };

  const handleToggleEnabled = (checked: boolean) => {
    setNotiEnabled(checked);
    localStorage.setItem('notification_enabled', String(checked));
    triggerAlert(checked ? 'Reminders active for classroom schedules & deadlines!' : 'Notifications silenced.', 'success');
  };

  const handleSaveAdvanceMins = (mins: number) => {
    setNotiAdvanceMins(mins);
    localStorage.setItem('notification_advance_minutes', String(mins));
    triggerAlert(`Trigger threshold updated to ${mins} minutes before block starts!`, 'success');
  };

  const handleTriggerTest = async () => {
    try {
      const { triggerNativeNotification } = await import('../utils/notifications');
      const result = triggerNativeNotification(
        '🔔 Timetable Alert Demo', 
        'This is an advanced mock reminder block designed for Mac, Windows and iOS/Android!'
      );
      if (!result && notiPermission !== 'granted') {
        triggerAlert('Check browser permission block list to test actual system sounds.', 'error');
      } else {
        triggerAlert('Native desktop banner demo triggered!', 'success');
        
        // Add to history list immediately
        const newLog = {
          id: `test-log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'test',
          title: 'Timetable Alert Demo',
          message: 'System ticker desktop reminder tested successfully.'
        };
        const updatedLogs = [newLog, ...alertHistory].slice(0, 30);
        setAlertHistory(updatedLogs);
        localStorage.setItem('notification_alert_history', JSON.stringify(updatedLogs));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = () => {
    setAlertHistory([]);
    localStorage.removeItem('notification_alert_history');
    triggerAlert('Alert log cleared successfully.', 'success');
  };

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

      {/* Dynamic Browser Notification Settings full-width card */}
      <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-5" id="browser-notifications-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-50 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" /> Academic & Personal Browser Notifications
            </h2>
            <p className="text-xs text-gray-400">Receive schedule and assignment alerts directly on your mac, phone, or tablet</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-1 rounded-full font-bold ${
              notiPermission === 'granted' ? 'bg-emerald-55 text-emerald-700 border border-emerald-100 font-bold' :
              notiPermission === 'denied' ? 'bg-rose-55 text-rose-700 border border-rose-100 font-bold' :
              'bg-amber-55 text-amber-700 border border-amber-100 font-bold'
            }`}>
              SYSTEM STATE: {notiPermission.toUpperCase()}
            </span>

            {notiPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg shadow-3xs cursor-pointer hover:shadow-2xs transition"
              >
                Request Access
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Controls column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-gray-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block">Classroom & Event Reminders</label>
                <span className="text-[10px] text-gray-400">Trigger active audio and slide banner alerts before slots begin</span>
              </div>
              <input
                type="checkbox"
                checked={notiEnabled}
                onChange={e => handleToggleEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Reminder Threshold Trigger</label>
              <select
                value={notiAdvanceMins}
                onChange={e => handleSaveAdvanceMins(Number(e.target.value))}
                disabled={!notiEnabled}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-150 rounded-xl text-xs font-semibold disabled:opacity-50 font-bold"
              >
                <option value={5}>⏰ 5 Minutes before slot starts</option>
                <option value={10}>⏰ 10 Minutes before slot starts (Default)</option>
                <option value={15}>⏰ 15 Minutes before slot starts</option>
                <option value={30}>⏰ 30 Minutes before slot starts</option>
                <option value={60}>⏰ 1 Hour before slot starts</option>
              </select>
            </div>

            <div className="p-4 bg-indigo-50/20 border border-indigo-100/55 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-650" />
                <span className="text-xs font-black text-indigo-900">Audio Ping & Diagnostic Suite</span>
              </div>
              <p className="text-[10px] text-indigo-805 leading-relaxed">
                Test how push notifications will look and sound natively on your system. Keep this background tab open to receive timely alerts during studies!
              </p>
              <button
                type="button"
                onClick={handleTriggerTest}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-3xs cursor-pointer transition"
              >
                🔔 Test System Alert
              </button>
            </div>
          </div>

          {/* History log column */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex justify-between items-center pb-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Fired Alerts Dashboard Log
                </label>
                {alertHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                  >
                    Clear Log
                  </button>
                )}
              </div>

              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 overflow-y-auto max-h-[180px] flex-1 min-h-[140px] space-y-1.5" id="notification-logs">
                {alertHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6">
                    <HelpCircle className="w-6 h-6 text-gray-300 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">No notifications triggered yet</span>
                    <span className="text-[9px] text-gray-400 mt-0.5">Alerts for upcoming modules and milestones will log here</span>
                  </div>
                ) : (
                  alertHistory.map((log: any) => (
                    <div 
                      key={log.id}
                      className="p-2 border-b border-gray-100 last:border-0 flex items-start justify-between gap-2 bg-white rounded-md shadow-3xs"
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] font-black uppercase tracking-wide text-teal-600 font-mono">[{log.type}]</span>
                        <div className="text-xs font-bold text-gray-700 leading-snug">{log.title}</div>
                        <div className="text-[10px] text-gray-400 font-medium leading-normal">{log.message}</div>
                      </div>
                      <span className="text-[9px] text-gray-300 font-mono text-right font-semibold whitespace-nowrap">{log.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
