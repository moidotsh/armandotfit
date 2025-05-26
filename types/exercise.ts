// types/exercise.ts
// Enhanced exercise interfaces to include all our new fields

import { EquipmentCategory, FreeWeightType, Equipment } from '../constants/equipmentTypes';
import { PrimaryMuscleGroup } from '../constants/muscleGroups';

// Represents an exercise 
export interface Exercise {
  id: string;             // Unique identifier
  category: string;       // General category (Chest, Back, etc.)
  name: string;           // Name of the exercise
  extra?: string;         // Additional description (e.g. "Incline")
  
  // Muscular details
  primaryMuscles: PrimaryMuscleGroup[];    // Main muscles targeted
  secondaryMuscles: PrimaryMuscleGroup[];  // Secondary muscles worked
  
  // Equipment details
  equipment: Equipment[];                  // Equipment needed
  
  // Programming details
  sets?: 1 | 2 | 3 | 4 | 5 | 6;            // Recommended sets
  reps?: [8, 10] | [8, 12] | [10, 12] | [12, 15] | [15, 20]; // Rep ranges
  
  // Additional information
  description?: string;                   // Detailed description of the exercise
  tips?: string[];                        // Form tips or coaching cues
  
  // Difficulty rating (1-5, with 5 being most difficult)
  difficulty?: 1 | 2 | 3 | 4 | 5;
  
  // For bilateral exercises, is there a unilateral version?
  hasUnilateralVariation?: boolean;
}

// For representing a workout session with associated exercises
export interface WorkoutSession {
  id: string;
  day: number;
  title: string;
  exercises: string[]; // These are IDs referencing exercises in the dictionary
}

// For representing a two-a-day split
export interface TwoADaySession {
  id: string;
  day: number;
  title: string;
  am: string[]; // Exercise IDs for morning session
  pm: string[]; // Exercise IDs for evening session
}

// Type guard to check if a workout is a two-a-day split
export function isTwoADaySession(workout: WorkoutSession | TwoADaySession): workout is TwoADaySession {
  return 'am' in workout && 'pm' in workout;
}