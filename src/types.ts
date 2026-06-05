/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  name: string;
  waterGoal: number; // cups
  calorieGoal: number; // kcal
  sleepGoal: number; // hours
  studyGoal: number; // hours
}

export type TimetableCategory = 'study' | 'gym' | 'meals' | 'work' | 'rest' | 'social';

export interface TimetableEvent {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  category: TimetableCategory;
  completed?: boolean;
}

export interface FocusTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  date: string; // YYYY-MM-DD
  category: string;
  dueDate?: string; // YYYY-MM-DD
}

export interface SubjectItem {
  id: string;
  name: string;
  color: string; // hex or tailwind class name
  notes: string;
  category?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  notes: string;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  question: string;
  answer: string;
}

export interface StudyDeadline {
  id: string;
  subjectId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface WorkoutExerciseSet {
  reps: number;
  weight: number; // kg or lbs
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  title: string; // e.g., "Leg Day" or "Upper Body"
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  caloriesBurned: number;
  exercises: WorkoutExercise[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  mealType: MealType;
  date: string; // YYYY-MM-DD
}

export interface HabitItem {
  id: string;
  name: string;
  category: string;
  targetDaysPerWeek: number;
  completedDates: string[]; // array of YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD (typically wake up date)
  durationHours: number;
  qualityScore: number; // 1-10
  energyLevel: number; // 1-10
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
}

export interface UserFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 or objectUrl
  date: string; // YYYY-MM-DD (associated specific day)
}

export interface TrackerState {
  profile: Profile;
  timetable: TimetableEvent[];
  focusQueue: FocusTask[];
  subjects: SubjectItem[];
  studySessions: StudySession[];
  flashcards: Flashcard[];
  deadlines: StudyDeadline[];
  workouts: WorkoutSession[];
  meals: MealLog[];
  waterIntake: Record<string, number>; // YYYY-MM-DD -> cups
  habits: HabitItem[];
  sleepLogs: SleepLog[];
  files: UserFile[];
}
