/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrackerState } from '../types';

const STORAGE_KEY = 'daily_life_tracker_state_v1';

// Format date helper
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD format string into a Date object at midnight local time.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function generateInitialState(): TrackerState {
  const today = getLocalDateString(new Date());
  
  // Generate yesterday and day before
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = getLocalDateString(d);
  
  d.setDate(d.getDate() - 1);
  const twoDaysAgo = getLocalDateString(d);

  d.setDate(d.getDate() - 1);
  const threeDaysAgo = getLocalDateString(d);

  return {
    profile: {
      name: "Alex",
      waterGoal: 8,
      calorieGoal: 2200,
      sleepGoal: 8,
      studyGoal: 4
    },
    timetable: [
      { id: "t1", date: today, startTime: "09:00", endTime: "11:00", title: "Web Architecture Study", category: "study" },
      { id: "t2", date: today, startTime: "12:00", endTime: "13:00", title: "Lunch & Rest", category: "meals" },
      { id: "t3", date: today, startTime: "14:00", endTime: "16:00", title: "Coding Assignments", category: "work" },
      { id: "t4", date: today, startTime: "17:30", endTime: "19:00", title: "Leg Day Gym Session", category: "gym" },
      { id: "t5", date: today, startTime: "21:00", endTime: "22:00", title: "Read Book / Rest", category: "rest" },
      
      { id: "ty1", date: yesterday, startTime: "09:30", endTime: "11:30", title: "Data Structures Lecture", category: "study" },
      { id: "ty2", date: yesterday, startTime: "15:00", endTime: "16:30", title: "Gym (Push Day)", category: "gym" }
    ],
    focusQueue: [
      { id: "q1", title: "Submit database design project documentation", priority: "high", completed: false, date: today, category: "work", dueDate: today },
      { id: "q2", title: "Review algorithms chapter 4 & 5", priority: "medium", completed: true, date: today, category: "study" },
      { id: "q3", title: "Buy whey protein isolate", priority: "low", completed: false, date: today, category: "shopping" },
      
      { id: "qy1", title: "Prepare assignment presentation slide deck", priority: "high", completed: true, date: yesterday, category: "work" }
    ],
    subjects: [
      { id: "s1", name: "Computer Systems", color: "#3B82F6", notes: "Focusing on virtualization and CPU scheduling. Need to review context switching overhead.", category: "Computer Science" },
      { id: "s2", name: "Advanced Database Systems", color: "#10B981", notes: "Learning about lock managers, transaction isolation levels (Serializable, Repeatable Read), and indexing.", category: "Computer Science" },
      { id: "s3", name: "Data Science & Stats", color: "#F59E0B", notes: "Working on linear regression modeling, heteroscedasticity, and correlation factors.", category: "Mathematics" }
    ],
    studySessions: [
      { id: "st1", subjectId: "s1", date: today, durationMinutes: 120, notes: "Read architecture documents and wrote quick summary notes." },
      { id: "st2", subjectId: "s2", date: yesterday, durationMinutes: 90, notes: "Solved practice questions on database Normalization up to BCNF." },
      { id: "st3", subjectId: "s3", date: twoDaysAgo, durationMinutes: 180, notes: "Implemented regression equations in Jupyter notebooks." },
      { id: "st4", subjectId: "s1", date: threeDaysAgo, durationMinutes: 60, notes: "Revised cache hierarchies and CPU pipelines." }
    ],
    flashcards: [
      { id: "f1", subjectId: "s1", question: "What is context switching in CPU processing?", answer: "The process of storing the state of a process/thread so that it can be restored and execution resumed later, allowing multiple processes to share a single CPU." },
      { id: "f2", subjectId: "s2", question: "Describe BCNF (Boyce-Codd Normal Form)", answer: "A relation is in BCNF if and only if for every one of its non-trivial functional dependencies X -> Y, X is a superkey." },
      { id: "f3", subjectId: "s3", question: "What is the Central Limit Theorem?", answer: "It states that, for a sufficiently large sample size, the sampling distribution of the mean will be approximately normally distributed, regardless of the population distribution shape." }
    ],
    deadlines: [
      { id: "d1", subjectId: "s2", title: "Team Database Normalization Assignment", dueDate: today, completed: false },
      { id: "d2", subjectId: "s1", title: "Final Lab Assignment on Threads", dueDate: yesterday, completed: true },
      { id: "d3", subjectId: "s3", title: "Stats Regression Project", dueDate: today, completed: false }
    ],
    workouts: [
      {
        id: "w1",
        title: "Leg Day - Squat Strength",
        date: today,
        durationMinutes: 75,
        caloriesBurned: 480,
        exercises: [
          { id: "ex1", name: "Barbell Back Squat", sets: [{ reps: 8, weight: 100 }, { reps: 6, weight: 110 }, { reps: 5, weight: 120 }] },
          { id: "ex2", name: "Romanian Deadlift", sets: [{ reps: 10, weight: 80 }, { reps: 10, weight: 85 }, { reps: 8, weight: 90 }] },
          { id: "ex3", name: "Standing Calf Raises", sets: [{ reps: 15, weight: 60 }, { reps: 15, weight: 60 }] }
        ]
      },
      {
        id: "w2",
        title: "Push Day - Bench Focus",
        date: yesterday,
        durationMinutes: 60,
        caloriesBurned: 390,
        exercises: [
          { id: "ex4", name: "Flat Bench Press", sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 85 }, { reps: 6, weight: 90 }] },
          { id: "ex5", name: "Dumbbell Overhead Press", sets: [{ reps: 10, weight: 24 }, { reps: 8, weight: 26 }] },
          { id: "ex6", name: "Triceps Pushdowns", sets: [{ reps: 12, weight: 30 }, { reps: 12, weight: 35 }] }
        ]
      },
      {
        id: "w3",
        title: "Pull Day - Deadlift & Rows",
        date: threeDaysAgo,
        durationMinutes: 65,
        caloriesBurned: 420,
        exercises: [
          { id: "ex7", name: "Convention Deadlift", sets: [{ reps: 5, weight: 140 }, { reps: 5, weight: 150 }] },
          { id: "ex8", name: "Lat Pulldown", sets: [{ reps: 10, weight: 65 }, { reps: 10, weight: 70 }] }
        ]
      }
    ],
    meals: [
      { id: "m1", name: "Oatmeal with Blueberries & Peanut Butter", calories: 450, protein: 18, carbs: 65, fat: 12, mealType: "breakfast", date: today },
      { id: "m2", name: "Grilled Chicken Breast with Rice & Broccoli", calories: 650, protein: 48, carbs: 70, fat: 10, mealType: "lunch", date: today },
      { id: "m3", name: "Whey Protein Shake with Banana", calories: 280, protein: 30, carbs: 32, fat: 3, mealType: "snack", date: today },
      { id: "m4", name: "Baked Salmon, Quinoa and Asparagus", calories: 580, protein: 42, carbs: 50, fat: 18, mealType: "dinner", date: today },
      
      { id: "my1", name: "Eggs, Sourdough toast & Avocado", calories: 520, protein: 24, carbs: 40, fat: 22, mealType: "breakfast", date: yesterday },
      { id: "my2", name: "Tuna Salad Salad Roll", calories: 480, protein: 35, carbs: 45, fat: 8, mealType: "lunch", date: yesterday },
      { id: "my3", name: "Beef Sirloin, Sweet Potato & Vegetables", calories: 720, protein: 55, carbs: 60, fat: 15, mealType: "dinner", date: yesterday }
    ],
    waterIntake: {
      [today]: 6,
      [yesterday]: 8,
      [twoDaysAgo]: 7,
      [threeDaysAgo]: 9
    },
    habits: [
      { id: "h1", name: "Read physical book of 15 mins", category: "Mind", targetDaysPerWeek: 5, completedDates: [today, yesterday, twoDaysAgo, threeDaysAgo], createdAt: threeDaysAgo },
      { id: "h2", name: "Drink 3 liters of water", category: "Health", targetDaysPerWeek: 7, completedDates: [yesterday, threeDaysAgo], createdAt: threeDaysAgo },
      { id: "h3", name: "Gym session or cardio walk", category: "Fitness", targetDaysPerWeek: 4, completedDates: [today, yesterday, threeDaysAgo], createdAt: threeDaysAgo },
      { id: "h4", name: "Review vocabulary/flashcards", category: "Study", targetDaysPerWeek: 5, completedDates: [yesterday, twoDaysAgo], createdAt: threeDaysAgo }
    ],
    sleepLogs: [
      { id: "sl1", date: today, durationHours: 7.5, qualityScore: 8, energyLevel: 7, bedTime: "23:00", wakeTime: "06:30" },
      { id: "sl2", date: yesterday, durationHours: 8.2, qualityScore: 9, energyLevel: 8, bedTime: "22:30", wakeTime: "06:42" },
      { id: "sl3", date: twoDaysAgo, durationHours: 6.8, qualityScore: 6, energyLevel: 5, bedTime: "00:15", wakeTime: "07:03" },
      { id: "sl4", date: threeDaysAgo, durationHours: 8.0, qualityScore: 8, energyLevel: 8, bedTime: "22:45", wakeTime: "06:45" }
    ],
    files: [
      { id: "f1", name: "DatabaseNormalizationCheatsheet.png", size: 45100, type: "image/png", dataUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=120&q=80", date: today }
    ]
  };
}

export function loadState(): TrackerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure basic shape checking
      if (parsed.profile && parsed.timetable && parsed.focusQueue && parsed.subjects) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading tracker state from localStorage:", e);
  }
  
  // Return generated state if none found or error
  const state = generateInitialState();
  saveState(state);
  return state;
}

export function saveState(state: TrackerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving state to localStorage:", e);
  }
}
