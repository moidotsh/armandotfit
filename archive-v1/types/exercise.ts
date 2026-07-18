// types/exercise.ts
// Enhanced exercise interfaces to include all our new fields

import { EquipmentCategory, FreeWeightType, Equipment, EquipmentManufacturer } from '../constants/equipmentTypes';
import { PrimaryMuscleGroup } from '../constants/muscleGroups';

// Common exercise abbreviations and tags
export interface ExerciseTag {
  id: string;
  tag: string;           // e.g., "ECC", "WIDE", "NARROW", "CHAIN"
  name: string;          // Full name e.g., "Eccentric-focused", "Wide grip"
  category: 'variation' | 'emphasis' | 'technique' | 'equipment';
  description?: string;
}

// Exercise variation for different equipment and techniques
export interface ExerciseVariation {
  id: string;
  name: string;                    // e.g., "Machine - Lifefitness", "Eccentric-focused"
  description?: string;
  
  // Equipment-specific information
  equipmentType: Equipment;        // Equipment needed for this variation
  manufacturer?: EquipmentManufacturer; // Equipment manufacturer if applicable
  model?: string;                  // Specific equipment model
  weightRatio?: number;            // Weight ratio relative to standard (default: 1.0)
  
  // Variations and modifications
  tags: ExerciseTag[];             // Tags for this variation
  gripType?: string;               // Grip variation
  stance?: string;                 // Stance variation
  emphasis?: string;               // Primary emphasis (e.g., "eccentric", "concentric")
  
  // Performance characteristics
  difficultyModifier?: number;     // Difficulty adjustment relative to base exercise (-2 to +2)
  
  // Gym-specific information
  gymSpecificId?: string;          // Gym-specific equipment identifier
  locationNotes?: string;          // e.g., "Near entrance", "By windows"
}

// Represents a base exercise (without specific equipment or variations)
export interface Exercise {
  id: string;             // Unique identifier
  category: string;       // General category (Chest, Back, etc.)
  name: string;           // Base name of the exercise
  extra?: string;         // Additional description (e.g. "Incline")
  
  // Muscular details
  primaryMuscles: PrimaryMuscleGroup[];    // Main muscles targeted
  secondaryMuscles: PrimaryMuscleGroup[];  // Secondary muscles worked
  
  // Equipment possibilities
  compatibleEquipment: EquipmentCategory[];  // Types of equipment that can be used
  
  // Programming details
  sets?: 1 | 2 | 3 | 4 | 5 | 6;            // Recommended sets
  reps?: [8, 10] | [8, 12] | [10, 12] | [12, 15] | [15, 20]; // Rep ranges
  
  // Additional information
  description?: string;                   // Detailed description of the exercise
  tips?: string[];                        // Form tips or coaching cues
  commonMistakes?: string[];              // Common form errors
  
  // Difficulty rating (1-5, with 5 being most difficult)
  difficulty?: 1 | 2 | 3 | 4 | 5;
  
  // Variation information
  commonVariations: ExerciseVariation[];   // Predefined common variations
  hasUnilateralVariation?: boolean;
  
  // Community data
  popularTags?: ExerciseTag[];            // Most commonly used tags
  
  // System data
  isCustom?: boolean;
  createdBy?: string;
  createdAt?: Date;
}

// Represents a specific exercise instance in a workout
export interface ExerciseInstance {
  baseExerciseId: string;     // Reference to base exercise
  variationId?: string;       // Specific variation used (if any)
  customVariation?: string;   // Free-form variation text
  
  // User-defined customizations
  customGrip?: string;
  customStance?: string;
  customEquipment?: string;   // e.g., "LF-CP1" for gym-specific equipment
  customNotes?: string;
  
  // Performance data
  sets: number;
  reps: number | string;      // Support rep ranges like "8-12"
  weight?: number;
  unit?: 'lbs' | 'kg';
  rpe?: number;               // Rate of Perceived Exertion (1-10)
  rir?: number;               // Reps in Reserve (0-5)
  rest?: number;              // Rest time in seconds
  
  // Auto-parsed information
  parsedTags?: ExerciseTag[];  // Tags parsed from custom fields
}

// Gym-specific equipment registry
export interface EquipmentRegistry {
  id: string;
  gymId: string;
  
  // Equipment identification
  baseEquipment: Equipment;
  manufacturer?: EquipmentManufacturer;
  model?: string;
  customIdentifier?: string;   // e.g., "CP-1" for Chest Press 1
  
  // Location and notes
  location?: string;           // e.g., "Near entrance", "Cardio area"
  notes?: string;
  
  // Performance characteristics
  weightRatio?: number;        // Weight adjustment factor
  
  // Visual identification
  photo?: string;              // URL to equipment photo
  
  // System data
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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