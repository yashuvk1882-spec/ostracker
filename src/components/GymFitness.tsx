/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Dumbbell, Plus, Trash2, ArrowRight, Clock, Flame, SquarePlus, Sparkles, Check
} from 'lucide-react';
import { TrackerState, WorkoutSession, WorkoutExercise, WorkoutExerciseSet } from '../types';

interface GymFitnessProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function GymFitness({ state, updateState, selectedDate }: GymFitnessProps) {
  // Workout form states
  const [sessionTitle, setSessionTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [caloriesBurned, setCaloriesBurned] = useState(350);

  // Draft exercises list being built for the new workout
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');

  // Active workout card expanding toggle
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Exercises helper list
  const addExerciseToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    const newEx: WorkoutExercise = {
      id: 'ex_' + Date.now(),
      name: newExerciseName,
      sets: [{ reps: 10, weight: 60 }] // default first set
    };

    setDraftExercises([...draftExercises, newEx]);
    setNewExerciseName('');
  };

  const removeExerciseFromDraft = (id: string) => {
    setDraftExercises(draftExercises.filter(ex => ex.id !== id));
  };

  const addSetToDraftExercise = (exerciseId: string) => {
    const updated = draftExercises.map(ex => {
      if (ex.id === exerciseId) {
        // mimic last set values if available, else standard
        const lastSet = ex.sets[ex.sets.length - 1];
        const nextSet: WorkoutExerciseSet = lastSet 
          ? { reps: lastSet.reps, weight: lastSet.weight }
          : { reps: 10, weight: 60 };
        return {
          ...ex,
          sets: [...ex.sets, nextSet]
        };
      }
      return ex;
    });
    setDraftExercises(updated);
  };

  const removeSetFromDraftExercise = (exerciseId: string, setIndex: number) => {
    const updated = draftExercises.map(ex => {
      if (ex.id === exerciseId) {
        if (ex.sets.length <= 1) return ex; // maintain at least one set
        return {
          ...ex,
          sets: ex.sets.filter((_, idx) => idx !== setIndex)
        };
      }
      return ex;
    });
    setDraftExercises(updated);
  };

  const updateSetInDraft = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updated = draftExercises.map(ex => {
      if (ex.id === exerciseId) {
        const nextSets = [...ex.sets];
        nextSets[setIndex] = {
          ...nextSets[setIndex],
          [field]: value
        };
        return { ...ex, sets: nextSets };
      }
      return ex;
    });
    setDraftExercises(updated);
  };

  // Submit complete workout session
  const handleSubmitWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    const session: WorkoutSession = {
      id: 'wk_' + Date.now(),
      title: sessionTitle,
      date: selectedDate,
      durationMinutes: Number(durationMinutes),
      caloriesBurned: Number(caloriesBurned),
      exercises: draftExercises
    };

    updateState({
      ...state,
      workouts: [session, ...state.workouts] // newest first
    });

    // Reset fields
    setSessionTitle('');
    setDurationMinutes(60);
    setCaloriesBurned(350);
    setDraftExercises([]);
  };

  const handleDeleteWorkout = (id: string) => {
    const remaining = state.workouts.filter(w => w.id !== id);
    updateState({ ...state, workouts: remaining });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="fitness-panel-container">
      
      {/* Left Form: Logger (Cols: 6) */}
      <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="log-workout-panel">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-600" /> Log Today's Workout
          </h2>
          <p className="text-xs text-gray-400">Add sports, routines, gym splits, or sets to track progress</p>
        </div>

        <form onSubmit={handleSubmitWorkout} className="space-y-4" id="workout-form">
          {/* General Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] text-gray-400 uppercase font-mono font-bold">Split or Routine Name</label>
              <input 
                type="text" 
                placeholder="e.g., Push Focus - Chest & Delts" 
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono font-bold">Duration (Mins)</label>
              <input 
                type="number" 
                min="1"
                value={durationMinutes}
                onChange={e => {
                  setDurationMinutes(Number(e.target.value));
                  // Auto ballpark calorie calculation
                  setCaloriesBurned(Number(e.target.value) * 6);
                }}
                className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono font-bold">Calories (kcal)</label>
              <input 
                type="number" 
                min="0"
                value={caloriesBurned}
                onChange={e => setCaloriesBurned(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono font-bold">Workout Date</label>
              <input 
                type="text" 
                value={selectedDate}
                disabled
                className="w-full px-3 py-1.5 bg-gray-100/50 border border-gray-100 rounded-lg text-xs text-gray-400 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Builder Exercises Section */}
          <div className="border-t border-gray-150 pt-3 space-y-3" id="draft-exercises-section">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">Exercises & Sets List</label>
              <div className="text-[10px] text-gray-400 font-mono font-semibold">({draftExercises.length} added)</div>
            </div>

            {/* Quick adding Exercise */}
            <div className="flex gap-1.5">
              <input 
                type="text" 
                placeholder="Search/Type Exercise (e.g. Bench Press)" 
                value={newExerciseName}
                onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExerciseToDraft(e);
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <button 
                type="button"
                onClick={addExerciseToDraft}
                className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 rounded-lg text-xs font-semibold text-emerald-700 transition"
              >
                Add Ex
              </button>
            </div>

            {/* Render Draft Exercise Cards */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1" id="draft-exercises-scroll">
              {draftExercises.length > 0 ? (
                draftExercises.map((ex) => (
                  <div key={ex.id} className="p-3 bg-gray-50/70 border border-gray-150 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-700">{ex.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeExerciseFromDraft(ex.id)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Sets inside exercise */}
                    <div className="space-y-1.5">
                      {ex.sets.map((set, setIx) => (
                        <div key={setIx} className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] text-gray-400 font-mono font-bold w-4">S{setIx + 1}</span>
                          
                          {/* Weight */}
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              min="0"
                              value={set.weight}
                              onChange={e => updateSetInDraft(ex.id, setIx, 'weight', Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 bg-white border border-gray-200 rounded-sm text-center font-bold"
                            />
                            <span className="text-[10px] text-gray-400">kg</span>
                          </div>

                          {/* Reps */}
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              min="1"
                              value={set.reps}
                              onChange={e => updateSetInDraft(ex.id, setIx, 'reps', Number(e.target.value))}
                              className="w-12 px-1.5 py-0.5 bg-white border border-gray-200 rounded-sm text-center font-bold"
                            />
                            <span className="text-[10px] text-gray-400">reps</span>
                          </div>

                          {/* Remove set */}
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSetFromDraftExercise(ex.id, setIx)}
                              className="text-gray-400 hover:text-red-500 font-bold ml-auto"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add supplementary set button */}
                    <button
                      type="button"
                      onClick={() => addSetToDraftExercise(ex.id)}
                      className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"
                    >
                      + Add Set / Drop set
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 italic text-[11px]">
                  No exercises added. Add a sport or barbell lifts above!
                </div>
              )}
            </div>
          </div>

          {/* Core submit */}
          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Check className="w-4 h-4" /> Log Completed Workout
          </button>
        </form>
      </div>

      {/* Right List: History (Cols: 6) */}
      <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="workout-history-panel">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" /> Training Log Archives
          </h2>
          <p className="text-xs text-gray-400">History of your athletic performance, metrics and details</p>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="workouts-history-list">
          {state.workouts.length > 0 ? (
            state.workouts.map((w) => {
              const isExpanded = expandedWorkoutId === w.id;
              return (
                <div 
                  key={w.id} 
                  className="border border-gray-100 hover:border-gray-200.5 rounded-xl bg-white shadow-3xs p-4 space-y-2 relative group"
                  id={`history-workout-card-${w.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-800">{w.title}</h4>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {w.durationMinutes}m
                        </span>
                        <span className="text-[10px] font-semibold text-orange-500 flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {w.caloriesBurned} kcal
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 font-mono">
                          {w.date}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteWorkout(w.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Exercise expansion */}
                  {w.exercises?.length > 0 && (
                    <div className="pt-2 border-t border-gray-50">
                      <button
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)}
                        className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide sets details' : `View ${w.exercises.length} Exercises / Sets`}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 bg-gray-50/40 p-2.5 rounded-lg border border-gray-50">
                          {w.exercises.map((ex, exIx) => (
                            <div key={exIx} className="text-xs text-gray-700">
                              <span className="font-bold text-[11px] block text-gray-800">{ex.name}</span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                {ex.sets.map((set, sIx) => (
                                  <span key={sIx} className="text-[10px] font-semibold text-gray-500 font-mono bg-white border border-gray-100 py-0.5 px-1.5 rounded-md">
                                    Set {sIx+1}: {set.weight}kg × {set.reps}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-200">
              No training history log saved. Push some sets!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
