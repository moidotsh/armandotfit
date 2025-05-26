// constants/muscleGroups.ts
// Define all muscle groups for consistency across the app

export enum PrimaryMuscleGroup {
    // Upper Body
    CHEST = 'Chest',
    UPPER_CHEST = 'Upper Chest',
    LOWER_CHEST = 'Lower Chest',
    
    // Back
    UPPER_BACK = 'Upper Back',
    LATS = 'Lats',
    LOWER_BACK = 'Lower Back',
    TRAPS = 'Trapezius',
    RHOMBOIDS = 'Rhomboids',
    
    // Shoulders
    FRONT_DELTS = 'Front Deltoids',
    SIDE_DELTS = 'Side Deltoids',
    REAR_DELTS = 'Rear Deltoids',
    
    // Arms
    BICEPS = 'Biceps',
    TRICEPS = 'Triceps',
    FOREARMS = 'Forearms',
    
    // Core
    ABS = 'Abs',
    LOWER_ABS = 'Lower Abs',
    OBLIQUES = 'Obliques',
    
    // Lower Body
    QUADS = 'Quadriceps',
    HAMSTRINGS = 'Hamstrings',
    GLUTES = 'Glutes',
    CALVES = 'Calves',
    TIBIALIS = 'Tibialis'
  }
  
  // Create groups for UI organization
  export const muscleGroupCategories = {
    CHEST: [
      PrimaryMuscleGroup.CHEST,
      PrimaryMuscleGroup.UPPER_CHEST,
      PrimaryMuscleGroup.LOWER_CHEST
    ],
    BACK: [
      PrimaryMuscleGroup.UPPER_BACK,
      PrimaryMuscleGroup.LATS,
      PrimaryMuscleGroup.LOWER_BACK,
      PrimaryMuscleGroup.TRAPS,
      PrimaryMuscleGroup.RHOMBOIDS
    ],
    SHOULDERS: [
      PrimaryMuscleGroup.FRONT_DELTS,
      PrimaryMuscleGroup.SIDE_DELTS,
      PrimaryMuscleGroup.REAR_DELTS
    ],
    ARMS: [
      PrimaryMuscleGroup.BICEPS,
      PrimaryMuscleGroup.TRICEPS,
      PrimaryMuscleGroup.FOREARMS
    ],
    CORE: [
      PrimaryMuscleGroup.ABS,
      PrimaryMuscleGroup.LOWER_ABS,
      PrimaryMuscleGroup.OBLIQUES
    ],
    LEGS: [
      PrimaryMuscleGroup.QUADS,
      PrimaryMuscleGroup.HAMSTRINGS,
      PrimaryMuscleGroup.GLUTES,
      PrimaryMuscleGroup.CALVES,
      PrimaryMuscleGroup.TIBIALIS
    ]
  };
  
  // Define all muscle groups in a flat array for easy access
  export const allMuscleGroups = Object.values(PrimaryMuscleGroup);