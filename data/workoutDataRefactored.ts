// data/workoutDataRefactored.ts

export interface Exercise {
    category: string;
    name: string;
    extra?: string;
    sets?: 1 | 2 | 3 | 4 | 5 | 6;
    reps?: [8, 10] | [8, 12] | [10, 12] | [12, 15] | [15, 20];
  }
  
  export const exercises: Record<string, Exercise> = {
    "barbell-press-incline": {"category": "Chest", "name": "Barbell Press", "extra": "Incline", "sets": 3, "reps": [8, 10]},
    "dumbbell-press-incline": {"category": "Chest", "name": "Dumbbell Press", "extra": "Incline", "sets": 3, "reps": [8, 10]},
    "dumbbell-fly-incline": {"category": "Chest", "name": "Dumbbell Fly", "extra": "Incline", "sets": 3, "reps": [12, 15]},
    "chest-fly-machine": {"category": "Chest", "name": "Chest Fly", "extra": "Machine", "sets": 3, "reps": [12, 15]},
    "overhead-tricep-extension-cable": {"category": "Arms", "name": "Tricep Extension", "extra": "Cable Overhead", "sets": 3, "reps": [8, 10]},
    "tricep-kickback-cable": {"category": "Arms", "name": "Tricep Kickback", "extra": "Cable", "sets": 3, "reps": [8, 10]},
    "tricep-dip-machine": {"category": "Arms", "name": "Tricep Dip", "extra": "Machine", "sets": 3, "reps": [8, 10]},
    "reverse-plus-hammer-curl-superset": {"category": "Arms", "name": "Reverse + Hammer Curl", "extra": "Superset", "sets": 3, "reps": [8, 12]},
    "dumbbell-curl-seated-incline": {"category": "Arms", "name": "Dumbbell Curl", "extra": "Seated Incline", "sets": 3, "reps": [8, 10]},
    "lateral-raise-cable": {"category": "Shoulders", "name": "Lateral Raise", "extra": "Cable", "sets": 3, "reps": [12, 15]},
    "dumbbell-lateral-raise-standing": {"category": "Shoulders", "name": "Dumbbell Lateral Raise", "extra": "Standing", "sets": 3, "reps": [15, 20]},
    "reverse-flyes-cable": {"category": "Shoulders", "name": "Reverse Flyes", "extra": "Cable", "sets": 3, "reps": [12, 15]},
    "face-pull-cable-rope-grip": {"category": "Shoulders", "name": "Face Pull", "extra": "Cable Rope Grip", "sets": 3, "reps": [12, 15]},
    "lower-back-extension-calisthenic": {"category": "Back", "name": "Back Extension", "extra": "Calisthenic", "sets": 3, "reps": [15, 20]},
    "seated-cable-row-v-grip": {"category": "Back", "name": "Seated Cable Row", "extra": "V Grip", "sets": 3, "reps": [8, 10]},
    "lat-pulldown-reverse-grip": {"category": "Back", "name": "Lat Pulldown", "extra": "Reverse Grip", "sets": 3, "reps": [8, 10]},
    "dumbbell-pullover-bridge-position": {"category": "Back", "name": "Dumbbell Pullover", "extra": "Bridge Position", "sets": 3, "reps": [8, 10]},
    "lever-row-chest-supported": {"category": "Back", "name": "Lever Row", "extra": "Chest Supported", "sets": 3, "reps": [8, 10]},
    "leg-press-machine": {"category": "UpperLeg", "name": "Leg Press", "extra": "Machine", "sets": 3, "reps": [8, 10]},
    "bulgarian-split-squat-dumbbell": {"category": "UpperLeg", "name": "Bulgarian Split Squat", "extra": "Dumbbell", "sets": 3, "reps": [8, 10]},
    "machine-leg-curl-seated": {"category": "UpperLeg", "name": "Machine Leg Curl", "extra": "Seated", "sets": 3, "reps": [10, 12]},
    "leg-extension-machine": {"category": "UpperLeg", "name": "Leg Extension", "extra": "Machine", "sets": 3, "reps": [10, 12]},
    "hip-adduction-machine": {"category": "UpperLeg", "name": "Hip Adduction", "extra": "Machine", "sets": 3, "reps": [12, 15]},
    "tibia-raise-machine-or-band": {"category": "LowerLeg", "name": "Tibia Raise", "extra": "Machine or Band", "sets": 3, "reps": [15, 20]},
    "calf-raise-leg-press-machine": {"category": "LowerLeg", "name": "Calf Raise", "extra": "Leg Press Machine", "sets": 3, "reps": [15, 20]},
    "machine-calf-raise-standing": {"category": "LowerLeg", "name": "Machine Calf Raise", "extra": "Standing", "sets": 3, "reps": [15, 20]},
    "leg-raise-captains-chair": {"category": "Abs", "name": "Leg Raise", "extra": "Captain's Chair", "sets": 3, "reps": [15, 20]},
    "machine-ab-crunch-eccentric-emphasized": {"category": "Abs", "name": "Machine Ab Crunch", "extra": "Eccentric-Emphasized", "sets": 3, "reps": [15, 20]},
  };
  
  export const oneADaySplits = [
    {
      "day": 1,
      "title": "Full Body Day 1",
      "exercises": [
        "barbell-press-incline",
        "overhead-tricep-extension-cable",
        "lateral-raise-cable",
        "lower-back-extension-calisthenic",
        "leg-press-machine",
        "tibia-raise-machine-or-band",
        "leg-raise-captains-chair"
      ]
    },
    {
      "day": 2,
      "title": "Full Body Day 2",
      "exercises": [
        "chest-fly-machine",
        "dumbbell-curl-seated-incline",
        "reverse-flyes-cable",
        "lat-pulldown-reverse-grip",
        "machine-leg-curl-seated",
        "machine-calf-raise-standing",
        "machine-ab-crunch-eccentric-emphasized"
      ]
    },
    {
      "day": 3,
      "title": "Full Body Day 3",
      "exercises": [
        "dumbbell-press-incline",
        "tricep-dip-machine",
        "dumbbell-lateral-raise-standing",
        "dumbbell-pullover-bridge-position",
        "bulgarian-split-squat-dumbbell",
        "tibia-raise-machine-or-band",
        "leg-raise-captains-chair"
      ]
    },
    {
      "day": 4,
      "title": "Full Body Day 4",
      "exercises": [
        "dumbbell-fly-incline",
        "reverse-plus-hammer-curl-superset",
        "face-pulls-cable-rope-grip",
        "lever-row-chest-supported",
        "leg-extension-machine",
        "calf-raise-leg-press-machine",
        "machine-ab-crunch-eccentric-emphasized"
      ]
    }
  ];
  
  export const twoADaySplits = [
    {
      "day": 1,
      "title": "Chest Press / Triceps / Side Delts",
      "am": [
        "barbell-press-incline",
        "leg-press-machine",
        "overhead-tricep-extension-cable",
        "lateral-raise-cable",
      ],
      "pm": [
        "tibia-raise-machine-or-band",
        "lower-back-extension-calisthenic",
        "leg-raise-captains-chair",
        "tricep-kickback-cable"
      ]
    },
    {
      "day": 2,
      "title": "Chest Fly / Biceps / Rear Delts",
      "am": [
        "seated-cable-row-v-grip",
        "dumbbell-curl-seated-incline",
        "chest-fly-machine",
        "machine-leg-curl-seated"
      ],
      "pm": [
        "reverse-flyes-cable",
        "machine-calf-raise-standing",
        "face-pull-cable-rope-grip",
        "machine-ab-crunch-eccentric-emphasized"
      ]
    },
    {
      "day": 3,
      "title": "Chest Press / Triceps / Side Delts",
      "am": [
        "dumbbell-press-incline",
        "tricep-dip-machine",
        "dumbbell-lateral-raise-standing",
        "bulgarian-split-squat-dumbbell"
      ],
      "pm": [
        "tibia-raise-machine-or-band",
        "dumbbell-pullover-bridge-position",
        "leg-raise-captains-chair",
        "hip-adduction-machine"
      ]
    },
    {
      "day": 4,
      "title": "Chest Fly / Biceps / Rear Delts",
      "am": [
        "lat-pulldown-reverse-grip",
        "leg-extension-machine",
        "dumbbell-fly-incline",
        "reverse-plus-hammer-curl-superset"
      ],
      "pm": [
        "face-pull-cable-rope-grip",
        "calf-raise-leg-press-machine",
        "machine-ab-crunch-eccentric-emphasized",
        "lever-row-chest-supported"
      ]
    }
  ];
  