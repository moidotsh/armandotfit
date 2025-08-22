// components/Workout/ExerciseSelector.tsx - Exercise selection modal
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Card, Sheet } from 'tamagui';
import { Search, Plus, Filter, X, Target, Dumbbell } from '@tamagui/lucide-icons';
import { 
  ExerciseTemplate,
  ExerciseCategory,
  ExerciseEquipment,
  RepRange,
  REP_RANGES,
  EXERCISE_CATEGORIES 
} from '../../types/workout';
import { useAppTheme } from '../ThemeProvider';
import { ExerciseDatabaseBrowser } from '../Exercise/ExerciseDatabaseBrowser';
import { ExerciseTemplate as ServiceExerciseTemplate } from '../../services/exerciseService';

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: ExerciseTemplate) => void;
  onCancel: () => void;
}

// Mock exercise database - in a real app this would come from a service
const EXERCISE_DATABASE: ExerciseTemplate[] = [
  // Push exercises
  {
    id: 'push_bench_press',
    name: 'Bench Press',
    category: 'free_weight',
    defaultEquipment: {
      category: 'free_weight',
      subType: 'barbell',
      grip: 'standard'
    },
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    defaultSets: 3,
    defaultRepRange: '6-8',
    isCustom: false
  },
  {
    id: 'push_incline_db_press',
    name: 'Incline Dumbbell Press',
    category: 'free_weight',
    defaultEquipment: {
      category: 'free_weight',
      subType: 'dumbbells',
      grip: 'neutral'
    },
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    defaultSets: 3,
    defaultRepRange: '6-8',
    isCustom: false
  },
  {
    id: 'push_chest_fly',
    name: 'Cable Chest Fly',
    category: 'cables',
    defaultEquipment: {
      category: 'cables',
      machineType: 'Cable Machine',
      grip: 'neutral'
    },
    muscleGroups: ['chest'],
    defaultSets: 3,
    defaultRepRange: '10-12',
    isCustom: false
  },
  {
    id: 'push_shoulder_press',
    name: 'Shoulder Press Machine',
    category: 'machine',
    defaultEquipment: {
      category: 'machine',
      machineType: 'Shoulder Press Machine'
    },
    muscleGroups: ['shoulders', 'triceps'],
    defaultSets: 3,
    defaultRepRange: '8-10',
    isCustom: false
  },
  {
    id: 'push_pushups',
    name: 'Push-ups',
    category: 'calisthenic',
    defaultEquipment: {
      category: 'calisthenic'
    },
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    defaultSets: 3,
    defaultRepRange: '10-12',
    isCustom: false
  },
  // Pull exercises
  {
    id: 'pull_pull_ups',
    name: 'Pull-ups',
    category: 'calisthenic',
    defaultEquipment: {
      category: 'calisthenic',
      grip: 'overhand'
    },
    muscleGroups: ['lats', 'biceps', 'rear_delts'],
    defaultSets: 3,
    defaultRepRange: '6-8',
    isCustom: false
  },
  {
    id: 'pull_lat_pulldown',
    name: 'Lat Pulldown',
    category: 'machine',
    defaultEquipment: {
      category: 'machine',
      machineType: 'Lat Pulldown Machine',
      grip: 'wide'
    },
    muscleGroups: ['lats', 'biceps', 'rear_delts'],
    defaultSets: 3,
    defaultRepRange: '8-10',
    isCustom: false
  },
  {
    id: 'pull_cable_row',
    name: 'Cable Row',
    category: 'cables',
    defaultEquipment: {
      category: 'cables',
      machineType: 'Cable Machine',
      grip: 'neutral'
    },
    muscleGroups: ['lats', 'rhomboids', 'biceps'],
    defaultSets: 3,
    defaultRepRange: '8-10',
    isCustom: false
  },
  {
    id: 'pull_db_row',
    name: 'Dumbbell Row',
    category: 'free_weight',
    defaultEquipment: {
      category: 'free_weight',
      subType: 'dumbbells',
      grip: 'neutral'
    },
    muscleGroups: ['lats', 'rhomboids', 'biceps'],
    defaultSets: 3,
    defaultRepRange: '8-10',
    isCustom: false
  },
  // Leg exercises
  {
    id: 'legs_squat',
    name: 'Barbell Squat',
    category: 'free_weight',
    defaultEquipment: {
      category: 'free_weight',
      subType: 'barbell'
    },
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    defaultSets: 3,
    defaultRepRange: '6-8',
    isCustom: false
  },
  {
    id: 'legs_leg_press',
    name: 'Leg Press',
    category: 'machine',
    defaultEquipment: {
      category: 'machine',
      machineType: 'Leg Press Machine'
    },
    muscleGroups: ['quads', 'glutes'],
    defaultSets: 3,
    defaultRepRange: '10-12',
    isCustom: false
  },
  {
    id: 'legs_romanian_dl',
    name: 'Romanian Deadlift',
    category: 'free_weight',
    defaultEquipment: {
      category: 'free_weight',
      subType: 'barbell'
    },
    muscleGroups: ['hamstrings', 'glutes'],
    defaultSets: 3,
    defaultRepRange: '8-10',
    isCustom: false
  },
  {
    id: 'legs_calf_raise',
    name: 'Calf Raises',
    category: 'machine',
    defaultEquipment: {
      category: 'machine',
      machineType: 'Calf Raise Machine'
    },
    muscleGroups: ['calves'],
    defaultSets: 4,
    defaultRepRange: '15-20',
    isCustom: false
  }
];

export function ExerciseSelector({ onSelectExercise, onCancel }: ExerciseSelectorProps) {
  const { colors, spacing } = useAppTheme();

  const handleExerciseSelect = (exercise: ServiceExerciseTemplate) => {
    // Convert service exercise template to workout exercise template
    const workoutExercise: ExerciseTemplate = {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      defaultEquipment: {
        category: exercise.category,
        subType: exercise.category === 'free_weight' ? (exercise.freeWeightSubTypes?.[0] || 'dumbbells') : undefined,
        grip: exercise.supportedGrips?.[0] || 'standard'
      },
      muscleGroups: exercise.primaryMuscleGroups as any[], // Type conversion
      defaultSets: 3, // Default value
      defaultRepRange: '8-10', // Default value
      isCustom: exercise.isCustom || false
    };
    
    onSelectExercise(workoutExercise);
  };

  return (
    <Sheet
      modal
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      snapPoints={[90]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Handle />
      <Sheet.Frame backgroundColor={colors.background} padding={spacing.medium}>
        <YStack flex={1}>
          <XStack alignItems="center" justifyContent="space-between" marginBottom={spacing.medium}>
            <Text fontSize={20} fontWeight="600" color={colors.text}>
              Add Exercise
            </Text>
            <Button
              size="$2"
              circular
              variant="outlined"
              onPress={onCancel}
              icon={<X size={16} />}
            />
          </XStack>

          <ExerciseDatabaseBrowser
            onExerciseSelect={handleExerciseSelect}
            allowSelection={true}
            showCreateButton={true}
          />
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}

// Exercise card component
interface ExerciseCardProps {
  exercise: ExerciseTemplate;
  onSelect: () => void;
  colors: any;
  spacing: any;
  getCategoryColor: (category: ExerciseCategory) => string;
}

function ExerciseCard({ exercise, onSelect, colors, spacing, getCategoryColor }: ExerciseCardProps) {
  return (
    <Button
      backgroundColor="transparent"
      borderWidth={0}
      padding={0}
      onPress={onSelect}
      justifyContent="flex-start"
      pressStyle={{ opacity: 0.7 }}
    >
      <Card
        backgroundColor={colors.cardBackground}
        borderColor={colors.border}
        borderWidth={1}
        padding={spacing.medium}
        width="100%"
      >
        <YStack space={spacing.small}>
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              {exercise.name}
            </Text>
            <YStack
              backgroundColor={getCategoryColor(exercise.category)}
              paddingHorizontal={spacing.small}
              paddingVertical={spacing.xsmall}
              borderRadius={4}
            >
              <Text fontSize={10} color={colors.cardBackground} fontWeight="600">
                {exercise.category.replace('_', ' ').toUpperCase()}
              </Text>
            </YStack>
          </XStack>

          <XStack alignItems="center" space={spacing.small}>
            <Text fontSize={12} color={colors.textMuted}>
              {exercise.muscleGroups.join(', ')}
            </Text>
          </XStack>

          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={12} color={colors.textMuted}>
              {exercise.defaultSets} sets × {exercise.defaultRepRange} reps
            </Text>
            
            <XStack alignItems="center" space={spacing.xsmall}>
              {exercise.defaultEquipment.subType && (
                <Text fontSize={10} color={colors.textMuted}>
                  {exercise.defaultEquipment.subType}
                </Text>
              )}
              {exercise.defaultEquipment.grip && (
                <Text fontSize={10} color={colors.textMuted}>
                  {exercise.defaultEquipment.grip} grip
                </Text>
              )}
            </XStack>
          </XStack>
        </YStack>
      </Card>
    </Button>
  );
}