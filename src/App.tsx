/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, BookOpen, Dumbbell, Utensils, CalendarDays, 
  Moon, TrendingUp, Sliders, Paperclip, CheckCircle2, User, Github
} from 'lucide-react';

// Subcomponents
import Dashboard from './components/Dashboard';
import StudyHub from './components/StudyHub';
import GymFitness from './components/GymFitness';
import FoodNutrition from './components/FoodNutrition';
import HabitTracker from './components/HabitTracker';
import SleepEnergy from './components/SleepEnergy';
import WeeklyReview from './components/WeeklyReview';
import Settings from './components/Settings';
import FilesHub from './components/FilesHub';

// State Helpers
import { TrackerState } from './types';
import { loadState, saveState, getLocalDateString } from './utils/storage';

type AppTab = 'dashboard' | 'study' | 'gym' | 'nutrition' | 'habits' | 'sleep' | 'files' | 'weekly' | 'settings';

export default function App() {
  const [state, setState] = useState<TrackerState>(() => loadState());
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString(new Date()));
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Trigger state persistence on changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = (newState: TrackerState) => {
    setState(newState);
  };

  // Nav items config
  const navItems = [
    { id: 'dashboard', label: 'Day Space', icon: Compass, color: 'text-teal-600 border-teal-500' },
    { id: 'study', label: 'Study Hub', icon: BookOpen, color: 'text-blue-600 border-blue-500' },
    { id: 'gym', label: 'Gym Log', icon: Dumbbell, color: 'text-emerald-00 border-emerald-500' },
    { id: 'nutrition', label: 'Food Log', icon: Utensils, color: 'text-amber-600 border-amber-500' },
    { id: 'habits', label: 'Habit Lab', icon: CalendarDays, color: 'text-violet-600 border-violet-500' },
    { id: 'sleep', label: 'Sleep Pad', icon: Moon, color: 'text-indigo-600 border-indigo-500' },
    { id: 'files', label: 'Files Space', icon: Paperclip, color: 'text-cyan-600 border-cyan-500' },
    { id: 'weekly', label: 'Analytics', icon: TrendingUp, color: 'text-rose-600 border-rose-500' },
    { id: 'settings', label: 'Settings', icon: Sliders, color: 'text-slate-600 border-slate-505' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-12 flex flex-col font-sans" id="applet-viewport">
      {/* Prime Header ribbon */}
      <header className="bg-white border-b border-gray-150/80 sticky top-0 z-30 shadow-xs" id="main-header">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-gray-800 tracking-tight">DAILY LIFE TRACKER</span>
              <span className="text-[10px] text-gray-400 font-mono block tracking-widest mt-0.5 leading-none">PRISTINE PERSONAL WORKSPACE</span>
            </div>
          </div>

          {/* Quick Profile Indicators */}
          <div className="flex items-center gap-2 bg-gray-50/50 py-1 px-3 rounded-lg border border-gray-100" id="header-profile-tag">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-700">{state.profile.name}</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />
          </div>

        </div>
      </header>

      {/* Navigation Ribbons Tabs */}
      <div className="bg-white border-b border-gray-150 sticky top-[57px] z-20 scrollbar-none overflow-x-auto text-nowrap select-none" id="navigation-tabs-ribbon">
        <div className="max-w-7xl mx-auto px-4 flex justify-start space-x-1 sm:space-x-3 py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-teal-50 text-teal-800 shadow-3xs' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
                id={`nav-${item.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container Screen */}
      <main className="max-w-7xl mx-auto px-4 mt-6 flex-1 w-full" id="main-view-canvas">
        <div className="transition-all duration-300" id="tab-outlet-canvas">
          {activeTab === 'dashboard' && (
            <Dashboard 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}

          {activeTab === 'study' && (
            <StudyHub 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'gym' && (
            <GymFitness 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'nutrition' && (
            <FoodNutrition 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'habits' && (
            <HabitTracker 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'sleep' && (
            <SleepEnergy 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'files' && (
            <FilesHub 
              state={state} 
              updateState={updateState} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyReview 
              state={state} 
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              state={state} 
              updateState={updateState}
            />
          )}
        </div>
      </main>

      {/* Minimal Footer credit blocks */}
      <footer className="mt-auto max-w-7xl mx-auto px-4 pt-12 text-center" id="foot-disclaimer">
        <p className="text-[10px] text-gray-400 font-medium">
          Daily Life Tracker Applet · Built with local persistence database structures
        </p>
      </footer>
    </div>
  );
}
