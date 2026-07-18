// types/workout.ts - Enhanced workout tracking types
export type RepRange = '4-6' | '6-8' | '10-12' | '12-15' | '15-20';

export type ExerciseCategory = 'calisthenic' | 'free_weight' | 'cables' | 'machine';

export type FreeWeightSubType = 'dumbbells' | 'barbell';

export type GripType = 
  | 'overhand' 
  | 'underhand' 
  | 'neutral' 
  | 'mixed' 
  | 'hook' 
  | 'wide' 
  | 'narrow' 
  | 'close' 
  | 'standard';

export interface ExerciseEquipment {
  category: ExerciseCategory;
  subType?: FreeWeightSubType; // Only for free_weight category
  machineType?: string; // Custom input for specific machine model/brand
  grip?: GripType;
  notes?: string; // Additional equipment notes
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps: number;
  repRange: RepRange;
  weight?: number; // Optional for bodyweight exercises
  completed: boolean;
  restTime?: number; // Rest time in seconds
  notes?: string;
  timestamp: string;
}

export interface LoggedExercise {
  id: string;
  exerciseName: string;
  equipment: ExerciseEquipment;
  sets: ExerciseSet[];
  totalSets: number;
  targetRepRange: RepRange;
  exerciseNotes?: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in seconds
}

export interface WorkoutSession {
  id: string;
  userId?: string;
  date: string;
  splitType: 'oneADay' | 'twoADay';
  day: number;
  sessionType?: 'AM' | 'PM'; // For twoADay splits
  exercises: LoggedExercise[];
  totalDuration: number; // in minutes
  notes?: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultEquipment: ExerciseEquipment;
  muscleGroups: string[];
  description?: string;
  instructions?: string[];
  defaultSets: number;
  defaultRepRange: RepRange;
  isCustom: boolean; // User-created vs system exercises
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  splitType: 'oneADay' | 'twoADay';
  day: number;
  sessionType?: 'AM' | 'PM';
  exercises: Array<{
    exerciseId: string;
    order: number;
    sets: number;
    repRange: RepRange;
    restTime: number;
    equipment?: ExerciseEquipment;
  }>;
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCustom: boolean;
}

// Workout Statistics
export interface ExerciseStats {
  exerciseName: string;
  totalSessions: number;
  totalSets: number;
  totalReps: number;
  maxWeight: number;
  averageWeight: number;
  lastPerformed: string;
  progression: Array<{
    date: string;
    weight: number;
    reps: number;
    volume: number; // weight * reps
  }>;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // sum of weight * reps
  averageWorkoutDuration: number;
  favoriteExercises: string[];
  strengthProgress: {
    [exerciseName: string]: {
      startWeight: number;
      currentWeight: number;
      improvement: number; // percentage
    };
  };
}

// Form validation and helpers
export const REP_RANGES: RepRange[] = ['4-6', '6-8', '10-12', '12-15', '15-20'];

export const EXERCISE_CATEGORIES: ExerciseCategory[] = ['calisthenic', 'free_weight', 'cables', 'machine'];

export const FREE_WEIGHT_SUBTYPES: FreeWeightSubType[] = ['dumbbells', 'barbell'];

export const GRIP_TYPES: GripType[] = [
  'overhand', 
  'underhand', 
  'neutral', 
  'mixed', 
  'hook', 
  'wide', 
  'narrow', 
  'close', 
  'standard'
];

export const getRepRangeMiddle = (range: RepRange): number => {
  const [min, max] = range.split('-').map(Number);
  return Math.round((min + max) / 2);
};

export const isRepInRange = (reps: number, range: RepRange): boolean => {
  const [min, max] = range.split('-').map(Number);
  return reps >= min && reps <= max;
};

export const calculateVolume = (sets: ExerciseSet[]): number => {
  return sets.reduce((total, set) => {
    if (set.completed && set.weight) {
      return total + (set.weight * set.reps);
    }
    return total;
  }, 0);
};

export const calculateTotalReps = (sets: ExerciseSet[]): number => {
  return sets.reduce((total, set) => {
    return set.completed ? total + set.reps : total;
  }, 0);
};