// Structured workout data parsed from the splits.txt file

export interface Exercise {
  category: string;
  name: string;
}

export interface OneADayWorkout {
  day: number;
  title: string;
  exercises: Exercise[];
}

export interface TwoADayWorkout {
  day: number;
  title: string;
  amExercises: Exercise[];
  pmExercises: Exercise[];
}

export interface WorkoutData {
  oneADay: OneADayWorkout[];
  twoADay: TwoADayWorkout[];
}

export const workoutData: WorkoutData = {
  oneADay: [
    {
      day: 1,
      title: "Full Body Day 1",
      exercises: [
        {
          category: "Chest",
          name: "Incline Barbell Press"
        },
        {
          category: "Arms",
          name: "Overhead Cable Tricep Extension"
        },
        {
          category: "Shoulders",
          name: "Egyptian Cable Lateral Raise"
        },
        {
          category: "Back",
          name: "Lower Back Extension"
        },
        {
          category: "UpperLeg",
          name: "Leg Press"
        },
        {
          category: "LowerLeg",
          name: "Tibia Raise Machine"
        },
        {
          category: "Abs",
          name: "Captain's Chair Leg Raise"
        }
      ]
    },
    {
      day: 2,
      title: "Full Body Day 2",
      exercises: [
        {
          category: "Chest",
          name: "Machine Fly"
        },
        {
          category: "Arms",
          name: "Incline Dumbbell Curl"
        },
        {
          category: "Shoulders",
          name: "Cable Reverse Flyes"
        },
        {
          category: "Back",
          name: "Reverse Grip Lat Pulldown"
        },
        {
          category: "UpperLeg",
          name: "Seated Leg Curl"
        },
        {
          category: "LowerLeg",
          name: "Standing Calf Raise"
        },
        {
          category: "Abs",
          name: "Machine Ab Crunch"
        }
      ]
    },
    {
      day: 3,
      title: "Full Body Day 3",
      exercises: [
        {
          category: "Chest",
          name: "Incline Dumbbell Press"
        },
        {
          category: "Arms",
          name: "Machine Tricep Dip"
        },
        {
          category: "Shoulders",
          name: "Chest-Supported Dumbbell Lateral Raise"
        },
        {
          category: "Back",
          name: "Dumbbell Pullover"
        },
        {
          category: "UpperLeg",
          name: "Bulgarian Split Squat"
        },
        {
          category: "LowerLeg",
          name: "Tibia Raise Machine"
        },
        {
          category: "Abs",
          name: "Captain's Chair Leg Raise"
        }
      ]
    },
    {
      day: 4,
      title: "Full Body Day 4",
      exercises: [
        {
          category: "Chest",
          name: "Incline Dumbbell Fly"
        },
        {
          category: "Arms",
          name: "Reverse Curl + Hammer Curl Superset"
        },
        {
          category: "Shoulders",
          name: "Rope Face Pulls"
        },
        {
          category: "Back",
          name: "Chest-Supported Lever Row"
        },
        {
          category: "UpperLeg",
          name: "Leg Extension"
        },
        {
          category: "LowerLeg",
          name: "Leg Press Calf Raise"
        },
        {
          category: "Abs",
          name: "Machine Ab Crunch"
        }
      ]
    }
  ],
  twoADay: [
    {
      day: 1,
      title: "Chest Press / Triceps / Side Delts",
      amExercises: [
        {
          category: "Chest",
          name: "Incline Barbell Press"
        },
        {
          category: "UpperLeg",
          name: "Leg Press"
        },
        {
          category: "Arms",
          name: "Overhead Cable Tricep Extension"
        },
        {
          category: "Shoulders",
          name: "Egyptian Cable Lateral Raise"
        }
      ],
      pmExercises: [
        {
          category: "LowerLeg",
          name: "Tibia Raise Machine"
        },
        {
          category: "Back",
          name: "Lower Back Extension"
        },
        {
          category: "Abs",
          name: "Captain's Chair Leg Raise"
        },
        {
          category: "Arms",
          name: "Cable Tricep Kickback"
        }
      ]
    },
    {
      day: 2,
      title: "Chest Fly / Biceps / Rear Delts",
      amExercises: [
        {
          category: "Back",
          name: "Seated Cable Row"
        },
        {
          category: "Arms",
          name: "Incline Dumbbell Curl"
        },
        {
          category: "Chest",
          name: "Machine Fly"
        },
        {
          category: "UpperLeg",
          name: "Seated Leg Curl"
        }
      ],
      pmExercises: [
        {
          category: "Shoulders",
          name: "Cable Reverse Flyes"
        },
        {
          category: "LowerLeg",
          name: "Standing Calf Raise"
        },
        {
          category: "Back/Shoulders",
          name: "Rope Grip Face Pull"
        },
        {
          category: "Abs",
          name: "Machine Ab Crunch"
        }
      ]
    },
    {
      day: 3,
      title: "Chest Press / Triceps / Side Delts",
      amExercises: [
        {
          category: "Chest",
          name: "Incline Dumbbell Press"
        },
        {
          category: "Arms",
          name: "Machine Tricep Dip"
        },
        {
          category: "Shoulders",
          name: "Chest-Supported Dumbbell Lateral Raise"
        },
        {
          category: "UpperLeg",
          name: "Bulgarian Split Squat"
        }
      ],
      pmExercises: [
        {
          category: "LowerLeg",
          name: "Tibia Raise Machine"
        },
        {
          category: "Back",
          name: "Dumbbell Pullover"
        },
        {
          category: "Abs",
          name: "Captain's Chair Leg Raise"
        },
        {
          category: "UpperLeg",
          name: "Hip Adduction Machine"
        }
      ]
    },
    {
      day: 4,
      title: "Chest Fly / Biceps / Rear Delts",
      amExercises: [
        {
          category: "Back",
          name: "Reverse Grip Lat Pulldown"
        },
        {
          category: "UpperLeg",
          name: "Leg Extension"
        },
        {
          category: "Chest",
          name: "Incline Dumbbell Fly"
        },
        {
          category: "Arms",
          name: "Reverse Curl + Hammer Curl Superset"
        }
      ],
      pmExercises: [
        {
          category: "Shoulders",
          name: "Rope Face Pulls"
        },
        {
          category: "LowerLeg",
          name: "Leg Press Calf Raise"
        },
        {
          category: "Abs",
          name: "Machine Ab Crunch"
        },
        {
          category: "Back",
          name: "Chest-Supported Lever Row"
        }
      ]
    }
  ]
};