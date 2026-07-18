// data/enhancedExerciseData.ts
// Enhanced exercise data with detailed muscle and equipment information

import { Exercise } from '../types/exercise';
import { PrimaryMuscleGroup } from '../constants/muscleGroups';
import { EquipmentCategory, FreeWeightType, StationType, MachineType, CableAttachment, CommonEquipment, createEquipment } from '../constants/equipmentTypes';

// Enhanced exercise dictionary with complete information
export const enhancedExercises: Record<string, Exercise> = {
  // CHEST EXERCISES
  "barbell-press-incline": {
    id: "barbell-press-incline",
    category: "Chest",
    name: "Barbell Press",
    extra: "Incline",
    primaryMuscles: [
      PrimaryMuscleGroup.UPPER_CHEST,
      PrimaryMuscleGroup.FRONT_DELTS
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.TRICEPS,
      PrimaryMuscleGroup.CHEST
    ],
    equipment: [
      CommonEquipment.BARBELL,
      CommonEquipment.INCLINE_BENCH
    ],
    sets: 3,
    reps: [8, 10],
    difficulty: 3,
    description: "Lie on an incline bench and press the barbell upward, focusing on upper chest activation.",
    tips: [
      "Keep your lower back slightly arched",
      "Lower the bar to the upper part of your chest",
      "Ensure your elbows don't flare out too much"
    ]
  },
  
  "dumbbell-press-incline": {
    id: "dumbbell-press-incline",
    category: "Chest",
    name: "Dumbbell Press",
    extra: "Incline",
    primaryMuscles: [
      PrimaryMuscleGroup.UPPER_CHEST,
      PrimaryMuscleGroup.FRONT_DELTS
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.TRICEPS,
      PrimaryMuscleGroup.CHEST
    ],
    equipment: [
      CommonEquipment.DUMBBELL,
      CommonEquipment.INCLINE_BENCH
    ],
    sets: 3,
    reps: [8, 10],
    difficulty: 3,
    description: "Perform a pressing movement with dumbbells while lying on an incline bench to target the upper chest.",
    tips: [
      "Allow for a deeper stretch at the bottom compared to barbell",
      "Control the dumbbells throughout the movement",
      "Keep your elbows at a 45-degree angle from your torso"
    ],
    hasUnilateralVariation: true
  },
  
  "dumbbell-fly-incline": {
    id: "dumbbell-fly-incline",
    category: "Chest",
    name: "Dumbbell Fly",
    extra: "Incline",
    primaryMuscles: [
      PrimaryMuscleGroup.UPPER_CHEST,
      PrimaryMuscleGroup.CHEST
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.FRONT_DELTS,
    ],
    equipment: [
      CommonEquipment.DUMBBELL,
      CommonEquipment.INCLINE_BENCH
    ],
    sets: 3,
    reps: [12, 15],
    difficulty: 2,
    description: "Perform a fly movement with arms slightly bent while lying on an incline bench.",
    tips: [
      "Keep a slight bend in your elbows throughout",
      "Focus on the stretch in your chest at the bottom",
      "Imagine you're hugging a barrel on the way up"
    ],
    hasUnilateralVariation: true
  },
  
  "chest-fly-machine": {
    id: "chest-fly-machine",
    category: "Chest",
    name: "Chest Fly",
    extra: "Machine",
    primaryMuscles: [
      PrimaryMuscleGroup.CHEST,
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.FRONT_DELTS,
    ],
    equipment: [
      CommonEquipment.CHEST_FLY
    ],
    sets: 3,
    reps: [12, 15],
    difficulty: 1,
    description: "Use the chest fly machine to perform a controlled fly movement that isolates the chest muscles.",
    tips: [
      "Adjust the seat height so handles align with chest",
      "Focus on squeezing your chest at the peak of contraction",
      "Control the eccentric (opening) phase"
    ]
  },
  
  // ARM EXERCISES
  "overhead-tricep-extension-cable": {
    id: "overhead-tricep-extension-cable",
    category: "Arms",
    name: "Tricep Extension",
    extra: "Cable Overhead",
    primaryMuscles: [
      PrimaryMuscleGroup.TRICEPS
    ],
    secondaryMuscles: [],
    equipment: [
      createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.ROPE)
    ],
    sets: 3,
    reps: [8, 10],
    difficulty: 2,
    description: "Using a rope attachment on a cable machine, extend your arms overhead to work the triceps.",
    tips: [
      "Keep your upper arms stationary and close to your head",
      "Fully extend your elbows at the end of the movement",
      "Control the weight on the way back to the starting position"
    ]
  },
  
  "tricep-kickback-cable": {
    id: "tricep-kickback-cable",
    category: "Arms",
    name: "Tricep Kickback",
    extra: "Cable",
    primaryMuscles: [
      PrimaryMuscleGroup.TRICEPS
    ],
    secondaryMuscles: [],
    equipment: [
      createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.SINGLE_HANDLE)
    ],
    sets: 3,
    reps: [8, 10],
    difficulty: 2,
    description: "Using a cable machine with a single handle, extend your arm backward while keeping the upper arm parallel to the floor.",
    tips: [
      "Keep your upper arm stationary and parallel to the floor",
      "Fully extend the elbow at the end of the movement",
      "Maintain a neutral spine position"
    ],
    hasUnilateralVariation: true
  },
  
  "tricep-dip-machine": {
    id: "tricep-dip-machine",
    category: "Arms",
    name: "Tricep Dip",
    extra: "Machine",
    primaryMuscles: [
      PrimaryMuscleGroup.TRICEPS,
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.CHEST,
      PrimaryMuscleGroup.FRONT_DELTS
    ],
    equipment: [
      createEquipment(EquipmentCategory.MACHINE, MachineType.TRICEP_EXTENSION)
    ],
    sets: 3,
    reps: [8, 10],
    difficulty: 2,
    description: "Using a machine, perform dips to primarily target the triceps muscles.",
    tips: [
      "Keep your elbows tucked in to target triceps",
      "Control the descent without bouncing at the bottom",
      "Don't lock out the elbows at the top to maintain tension"
    ]
  },
  
  // SHOULDER EXERCISES
  "lateral-raise-cable": {
    id: "lateral-raise-cable",
    category: "Shoulders",
    name: "Lateral Raise",
    extra: "Cable",
    primaryMuscles: [
      PrimaryMuscleGroup.SIDE_DELTS
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.FRONT_DELTS,
      PrimaryMuscleGroup.TRAPS
    ],
    equipment: [
      createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.SINGLE_HANDLE)
    ],
    sets: 3,
    reps: [12, 15],
    difficulty: 2,
    description: "Using a cable machine with a single handle attachment, raise your arm out to the side to target the lateral deltoid.",
    tips: [
      "Keep a slight bend in the elbow",
      "Lead with the elbow, not the hand",
      "Maintain an upright posture throughout the movement"
    ],
    hasUnilateralVariation: true
  },
  
  // LOWER BODY EXERCISES
  "leg-press-machine": {
    id: "leg-press-machine",
    category: "UpperLeg",
    name: "Leg Press",
    extra: "Machine",
    primaryMuscles: [
      PrimaryMuscleGroup.QUADS,
      PrimaryMuscleGroup.GLUTES
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.HAMSTRINGS,
      PrimaryMuscleGroup.CALVES
    ],
    equipment: [
      CommonEquipment.LEG_PRESS
    ],
    sets: 3,
    reps: [8, 10],
    difficulty: 3,
    description: "Push weight away from your body using your legs on a leg press machine.",
    tips: [
      "Don't lock out your knees at the top",
      "Place feet shoulder-width apart for balanced development",
      "Lower the weight until your knees reach about 90 degrees"
    ]
  },
  
  "tibia-raise-machine-or-band": {
    id: "tibia-raise-machine-or-band",
    category: "LowerLeg",
    name: "Tibia Raise",
    extra: "Machine or Band",
    primaryMuscles: [
      PrimaryMuscleGroup.TIBIALIS
    ],
    secondaryMuscles: [],
    equipment: [
      createEquipment(EquipmentCategory.MACHINE, undefined, undefined, "Tibia Dorsiflexion Machine"),
      createEquipment(EquipmentCategory.BODYWEIGHT, undefined, undefined, "Resistance Band")
    ],
    sets: 3,
    reps: [15, 20],
    difficulty: 1,
    description: "Raise your foot upward against resistance to target the tibialis anterior muscle.",
    tips: [
      "Focus on the pulling motion from your foot, not your leg",
      "Control both the raising and lowering phases",
      "Can be performed seated or standing"
    ]
  },
  
  // CORE EXERCISES
  "leg-raise-captains-chair": {
    id: "leg-raise-captains-chair",
    category: "Abs",
    name: "Leg Raise",
    extra: "Captain's Chair",
    primaryMuscles: [
      PrimaryMuscleGroup.LOWER_ABS,
      PrimaryMuscleGroup.ABS
    ],
    secondaryMuscles: [
      PrimaryMuscleGroup.OBLIQUES,
      PrimaryMuscleGroup.QUADS
    ],
    equipment: [
      createEquipment(EquipmentCategory.STATION, undefined, undefined, "Captain's Chair")
    ],
    sets: 3,
    reps: [15, 20],
    difficulty: 3,
    description: "Support yourself on a captain's chair and raise your legs upward to target the lower abdominals.",
    tips: [
      "Avoid swinging or using momentum",
      "Try to curl your pelvis upward at the top for more lower ab activation",
      "Control the descent rather than just dropping your legs"
    ]
  }
  
  // Add more exercises following this pattern...
};

// Export a sample of converted exercises to demonstrate the format
export const sampleConvertedExercises = {
  "barbell-press-incline": enhancedExercises["barbell-press-incline"],
  "leg-press-machine": enhancedExercises["leg-press-machine"],
  "leg-raise-captains-chair": enhancedExercises["leg-raise-captains-chair"]
};

// This function helps with migrating the old exercise format to the new one
export function convertOldExerciseFormat(oldExercise: any): Partial<Exercise> {
  // This would need to be implemented based on your old data structure
  // and would add default values for the new fields
  return {
    // Copy existing fields
    id: oldExercise.id,
    category: oldExercise.category,
    name: oldExercise.name,
    extra: oldExercise.extra,
    sets: oldExercise.sets,
    reps: oldExercise.reps,
    
    // Add default values for new fields
    primaryMuscles: [], // Would need to be filled in manually
    secondaryMuscles: [], // Would need to be filled in manually
    equipment: [] // Would need to be filled in manually
  };
}