/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Utensils, Plus, Trash2, Sparkles, Coffee, Droplet, Soup, Fish, ShieldAlert, Check
} from 'lucide-react';
import { TrackerState, MealLog, MealType } from '../types';

interface FoodProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function FoodNutrition({ state, updateState, selectedDate }: FoodProps) {
  // Meal Form
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState(400);
  const [mealProtein, setMealProtein] = useState(25);
  const [mealCarbs, setMealCarbs] = useState(40);
  const [mealFat, setMealFat] = useState(10);
  const [mealType, setMealType] = useState<MealType>('breakfast');

  // Filter logs for selected date
  const todaysMeals = state.meals.filter(m => m.date === selectedDate);
  const todaysWater = state.waterIntake[selectedDate] || 0;

  // Calculators
  const totalCaloriesCount = todaysMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteinCount = todaysMeals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbsCount = todaysMeals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFatCount = todaysMeals.reduce((sum, m) => sum + m.fat, 0);

  // Submissions
  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const newMeal: MealLog = {
      id: 'ml_' + Date.now(),
      name: mealName,
      calories: Number(mealCalories),
      protein: Number(mealProtein),
      carbs: Number(mealCarbs),
      fat: Number(mealFat),
      mealType: mealType,
      date: selectedDate
    };

    updateState({
      ...state,
      meals: [...state.meals, newMeal]
    });

    setMealName('');
    // set realistic defaults
    setMealCalories(400);
    setMealProtein(25);
    setMealCarbs(40);
    setMealFat(10);
  };

  const handleDeleteMeal = (id: string) => {
    const remaining = state.meals.filter(m => m.id !== id);
    updateState({ ...state, meals: remaining });
  };

  const handleAdjustWater = (delta: number) => {
    const current = state.waterIntake[selectedDate] || 0;
    const nextValue = Math.max(0, current + delta);
    
    updateState({
      ...state,
      waterIntake: {
        ...state.waterIntake,
        [selectedDate]: nextValue
      }
    });
  };

  // Water level height percentage
  const waterPct = Math.min((todaysWater / state.profile.waterGoal) * 100, 100);

  // Meal types descriptors
  const mealTypeLabels: Record<MealType, { label: string, icon: any, color: string }> = {
    breakfast: { label: 'Breakfast', icon: Coffee, color: 'text-amber-500 bg-amber-50' },
    lunch: { label: 'Lunch', icon: Utensils, color: 'text-blue-500 bg-blue-50' },
    dinner: { label: 'Dinner', icon: Fish, color: 'text-purple-500 bg-purple-50' },
    snack: { label: 'Snack/Supplement', icon: Soup, color: 'text-pink-500 bg-pink-50' }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="nutrition-panel-wrapper">
      
      {/* Left Column: Calories Progress & Water Liquid Animation (Cols: 5) */}
      <div className="lg:col-span-5 flex flex-col space-y-6" id="nutrition-left-sidebar">
        
        {/* Calorie Goals Dial card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase font-mono tracking-wider">Calorie Balance</h3>
            <p className="text-xs text-gray-400">Total metabolic logs compared to profile limits</p>
          </div>

          <div className="relative flex flex-col justify-center items-center py-4 bg-gray-50/50 rounded-xl border border-gray-100">
            {/* Standard circular rings proxy with beautiful graphics */}
            <div className="text-center">
              <span className="text-3xl font-black text-gray-800 font-sans">{totalCaloriesCount}</span>
              <span className="text-xs text-gray-400 block font-semibold mt-1">/ {state.profile.calorieGoal} kcal logged</span>
            </div>

            <div className="w-full px-6 mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Remaining target</span>
                <span className="font-bold text-gray-700">
                  {Math.max(0, state.profile.calorieGoal - totalCaloriesCount)} kcal
                </span>
              </div>
              <div className="w-full bg-gray-200/70 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((totalCaloriesCount / state.profile.calorieGoal) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Macromolecules meters */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Protein */}
            <div className="bg-blue-50/20 border border-blue-100/60 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-blue-500 font-bold block uppercase tracking-wider font-mono">Protein</span>
              <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{totalProteinCount}g</span>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${Math.min((totalProteinCount / 150) * 100, 100)}%` }} // Base 150g placeholder target
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-amber-50/20 border border-amber-100/60 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider font-mono">Carbs</span>
              <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{totalCarbsCount}g</span>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${Math.min((totalCarbsCount / 220) * 100, 100)}%` }} // Base 220g placeholder target
                />
              </div>
            </div>

            {/* Fats */}
            <div className="bg-rose-50/20 border border-rose-100/60 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-rose-500 font-bold block uppercase tracking-wider font-mono">Fats</span>
              <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{totalFatCount}g</span>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full" 
                  style={{ width: `${Math.min((totalFatCount / 70) * 100, 100)}%` }} // Base 70g placeholder target
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Water Animation Container */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase font-mono tracking-wider">Hydration Chamber</h3>
            <p className="text-xs text-gray-400">Log water and watch the fluid containment rise</p>
          </div>

          <div className="flex gap-4 items-center">
            {/* Visual Glass */}
            <div className="relative w-22 h-44 border-4 border-slate-300 rounded-b-3xl rounded-t-xl overflow-hidden bg-slate-100/50 flex flex-col justify-end shrink-0 shadow-inner">
              
              {/* Dynamic Liquid Wave */}
              <motion.div 
                animate={{ height: `${waterPct}%` }}
                className="bg-blue-400 w-full relative transition-all duration-500 flex items-center justify-center shadow-lg"
              >
                {waterPct > 15 && (
                  <span className="absolute text-xs font-black text-white font-mono">{waterPct.toFixed(0)}%</span>
                )}
                {/* Wave bubbles effect */}
                <div className="absolute top-1 left-0 right-0 h-1.5 bg-blue-300 opacity-60 animate-pulse" />
              </motion.div>

              {/* Glass Marks */}
              <div className="absolute inset-y-0 right-1.5 flex flex-col justify-between text-[8px] font-mono text-slate-400 py-4 select-none pointer-events-none">
                <span>{state.profile.waterGoal}c</span>
                <span>{Math.round(state.profile.waterGoal * 0.75)}c</span>
                <span>{Math.round(state.profile.waterGoal * 0.5)}c</span>
                <span>{Math.round(state.profile.waterGoal * 0.25)}c</span>
                <span>0c</span>
              </div>
            </div>

            {/* Micro logs tools and info */}
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-2xl font-black text-gray-800">{todaysWater}</span>
                <span className="text-xs font-semibold text-gray-400"> of {state.profile.waterGoal} cups logged today</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustWater(-1)}
                  className="p-1 px-3 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors"
                >
                  - Cup
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustWater(1)}
                  className="p-1 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-extrabold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Droplet className="w-4 h-4 fill-white text-blue-100" /> + Cup
                </button>
              </div>

              <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
                Drinking 2-3 liters of water supports neural cognitive tasks, physical lifts, and overall body energy!
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Add Food & Meal Diary (Cols: 7) */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-5" id="nutrition-right-journal">
        
        {/* Add Meal Form */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase font-mono tracking-wider">Log Meal / Snack</h3>
          <p className="text-xs text-gray-400">Chronicle food items, shakes, supplements, or drinks</p>
        </div>

        <form onSubmit={handleAddMeal} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3" id="add-meal-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Food Item / Meal</label>
              <input 
                type="text" 
                placeholder="e.g., Tuna Wrap & Salad" 
                value={mealName}
                onChange={e => setMealName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-200.5 rounded-lg text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Meal Timing</label>
              <select
                value={mealType}
                onChange={e => setMealType(e.target.value as MealType)}
                className="w-full px-3 py-1.5 bg-white border border-gray-200.5 rounded-lg text-xs text-gray-700 font-semibold"
              >
                <option value="breakfast">🌅 Breakfast</option>
                <option value="lunch">☀️ Lunch</option>
                <option value="dinner">🌌 Dinner</option>
                <option value="snack">🍎 Snack / Supplement</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Calories (kcal)</label>
              <input 
                type="number" 
                min="0"
                value={mealCalories}
                onChange={e => setMealCalories(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-gray-200.5 rounded-lg text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Protein (g)</label>
              <input 
                type="number" 
                min="0"
                value={mealProtein}
                onChange={e => setMealProtein(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-gray-200.5 rounded-lg text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Carbs (g)</label>
              <input 
                type="number" 
                min="0"
                value={mealCarbs}
                onChange={e => setMealCarbs(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-gray-200.5 rounded-lg text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase font-mono">Fat (g)</label>
              <input 
                type="number" 
                min="0"
                value={mealFat}
                onChange={e => setMealFat(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-gray-200.5 rounded-lg text-xs font-bold"
              />
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold transitionshadow-xs"
          >
            Log Food Item to Dashboard
          </button>
        </form>

        {/* Meal History Checklist */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Meal Journal for {selectedDate}</h3>
          
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="meals-logged-list">
            {todaysMeals.length > 0 ? (
              todaysMeals.map(m => {
                const descriptor = mealTypeLabels[m.mealType] || mealTypeLabels.breakfast;
                const Icon = descriptor.icon;
                return (
                  <div 
                    key={m.id} 
                    className="p-3 bg-white border border-gray-100 rounded-xl group hover:border-gray-200.5 transition-colors flex justify-between items-center"
                    id={`meal-log-${m.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${descriptor.color} shadow-3xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-800 font-bold">{m.name}</div>
                        <div className="flex gap-2 text-[9px] font-mono font-medium text-gray-400 mt-0.5">
                          <span>Calories: <strong className="text-gray-700">{m.calories}kcal</strong></span>
                          <span>P: {m.protein}g</span>
                          <span>C: {m.carbs}g</span>
                          <span>F: {m.fat}g</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeal(m.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-gray-50/10 border border-dashed rounded-xl border-gray-200 text-xs text-gray-400 italic">
                No food logged for today. Fuel the machine!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
