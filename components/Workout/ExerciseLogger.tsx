// components/Workout/ExerciseLogger.tsx - Detailed exercise logging component
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, Card, ScrollView } from 'tamagui';
import { Plus, Minus, Clock, Weight, RotateCcw, Check, X, Edit3 } from '@tamagui/lucide-icons';
import { 
  LoggedExercise, 
  ExerciseSet, 
  RepRange, 
  ExerciseEquipment,
  ExerciseCategory,
  FreeWeightSubType,
  GripType,
  REP_RANGES,
  EXERCISE_CATEGORIES,
  FREE_WEIGHT_SUBTYPES,
  GRIP_TYPES,
  getRepRangeMiddle,
  isRepInRange
} from '../../types/workout';
import { useAppTheme } from '../ThemeProvider';

interface ExerciseLoggerProps {
  exercise: LoggedExercise;
  onUpdateExercise: (exercise: LoggedExercise) => void;
  onRemoveExercise: () => void;
  isActive?: boolean;
}

export function ExerciseLogger({
  exercise,
  onUpdateExercise,
  onRemoveExercise,
  isActive = false
}: ExerciseLoggerProps) {
  const { colors, spacing } = useAppTheme();
  const [showEquipmentEditor, setShowEquipmentEditor] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restStartTime, setRestStartTime] = useState<Date | null>(null);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (restTimer !== null && restStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - restStartTime.getTime()) / 1000);
        if (elapsed >= restTimer) {
          setRestTimer(null);
          setRestStartTime(null);
          // Could add notification here
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimer, restStartTime]);

  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `set_${Date.now()}`,
      setNumber: exercise.sets.length + 1,
      reps: getRepRangeMiddle(exercise.targetRepRange),
      repRange: exercise.targetRepRange,
      weight: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].weight : 0,
      completed: false,
      timestamp: new Date().toISOString()
    };

    const updatedExercise = {
      ...exercise,
      sets: [...exercise.sets, newSet],
      totalSets: exercise.sets.length + 1
    };

    onUpdateExercise(updatedExercise);
  };

  const removeSet = (setId: string) => {
    const updatedSets = exercise.sets.filter(set => set.id !== setId);
    const updatedExercise = {
      ...exercise,
      sets: updatedSets,
      totalSets: updatedSets.length
    };

    onUpdateExercise(updatedExercise);
  };

  const updateSet = (setId: string, updates: Partial<ExerciseSet>) => {
    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, ...updates } : set
    );

    const updatedExercise = {
      ...exercise,
      sets: updatedSets
    };

    onUpdateExercise(updatedExercise);
  };

  const completeSet = (setId: string) => {
    updateSet(setId, { 
      completed: true, 
      timestamp: new Date().toISOString() 
    });
  };

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    setRestStartTime(new Date());
  };

  const updateEquipment = (equipment: ExerciseEquipment) => {
    const updatedExercise = {
      ...exercise,
      equipment
    };
    onUpdateExercise(updatedExercise);
    setShowEquipmentEditor(false);
  };

  const getSetStatusColor = (set: ExerciseSet) => {
    if (set.completed) return colors.success;
    if (!isRepInRange(set.reps, set.repRange)) return colors.warning;
    return colors.textMuted;
  };

  const formatRestTime = (): string => {
    if (!restTimer || !restStartTime) return '';
    const elapsed = Math.floor((Date.now() - restStartTime.getTime()) / 1000);
    const remaining = Math.max(0, restTimer - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      backgroundColor={colors.cardBackground}
      borderColor={isActive ? colors.primary : colors.border}
      borderWidth={isActive ? 2 : 1}
      padding={spacing.medium}
      marginBottom={spacing.medium}
    >
      <YStack space={spacing.medium}>
        {/* Exercise Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <YStack flex={1}>
            <Text fontSize={18} fontWeight="600" color={colors.text}>
              {exercise.exerciseName}
            </Text>
            <Text fontSize={12} color={colors.textMuted}>
              {exercise.equipment.category}
              {exercise.equipment.subType && ` - ${exercise.equipment.subType}`}
              {exercise.equipment.grip && ` - ${exercise.equipment.grip} grip`}
            </Text>
          </YStack>
          
          <XStack space={spacing.small}>
            <Button
              size="$2"
              variant="outlined"
              onPress={() => setShowEquipmentEditor(!showEquipmentEditor)}
              icon={<Edit3 size={14} />}
            >
              Equipment
            </Button>
            <Button
              size="$2"
              variant="outlined"
              onPress={onRemoveExercise}
              icon={<X size={14} />}
            >
              Remove
            </Button>
          </XStack>
        </XStack>

        {/* Equipment Editor */}
        {showEquipmentEditor && (
          <EquipmentEditor
            equipment={exercise.equipment}
            onUpdate={updateEquipment}
            onCancel={() => setShowEquipmentEditor(false)}
          />
        )}

        {/* Target Rep Range */}
        <XStack alignItems="center" space={spacing.small}>
          <Text fontSize={14} color={colors.textMuted}>Target Range:</Text>
          <Text fontSize={14} fontWeight="500" color={colors.text}>
            {exercise.targetRepRange} reps
          </Text>
        </XStack>

        {/* Sets List */}
        <YStack space={spacing.small}>
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={16} fontWeight="500" color={colors.text}>
              Sets ({exercise.sets.length})
            </Text>
            <Button size="$2" onPress={addSet} icon={<Plus size={16} />}>
              Add Set
            </Button>
          </XStack>

          {exercise.sets.map((set, index) => (
            <SetLogger
              key={set.id}
              set={set}
              setNumber={index + 1}
              onUpdate={(updates) => updateSet(set.id, updates)}
              onComplete={() => completeSet(set.id)}
              onRemove={() => removeSet(set.id)}
              onStartRest={startRestTimer}
              colors={colors}
              spacing={spacing}
            />
          ))}
        </YStack>

        {/* Rest Timer */}
        {restTimer && restStartTime && (
          <Card backgroundColor={colors.cardAlt} padding={spacing.small}>
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" space={spacing.small}>
                <Clock size={16} color={colors.primary} />
                <Text fontSize={14} color={colors.text}>Rest Timer</Text>
              </XStack>
              <XStack alignItems="center" space={spacing.small}>
                <Text fontSize={16} fontWeight="600" color={colors.primary}>
                  {formatRestTime()}
                </Text>
                <Button
                  size="$2"
                  variant="outlined"
                  onPress={() => {
                    setRestTimer(null);
                    setRestStartTime(null);
                  }}
                >
                  Stop
                </Button>
              </XStack>
            </XStack>
          </Card>
        )}

        {/* Exercise Summary */}
        {exercise.sets.length > 0 && (
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={12} color={colors.textMuted}>
              Completed: {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} sets
            </Text>
            <Text fontSize={12} color={colors.textMuted}>
              Total Reps: {exercise.sets.filter(s => s.completed).reduce((sum, s) => sum + s.reps, 0)}
            </Text>
          </XStack>
        )}
      </YStack>
    </Card>
  );
}

// Set logging component
interface SetLoggerProps {
  set: ExerciseSet;
  setNumber: number;
  onUpdate: (updates: Partial<ExerciseSet>) => void;
  onComplete: () => void;
  onRemove: () => void;
  onStartRest: (seconds: number) => void;
  colors: any;
  spacing: any;
}

function SetLogger({
  set,
  setNumber,
  onUpdate,
  onComplete,
  onRemove,
  onStartRest,
  colors,
  spacing
}: SetLoggerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getStatusColor = () => {
    if (set.completed) return colors.success;
    if (!isRepInRange(set.reps, set.repRange)) return colors.warning;
    return colors.textMuted;
  };

  return (
    <Card
      backgroundColor={set.completed ? colors.cardAlt : colors.cardBackground}
      borderColor={getStatusColor()}
      borderWidth={1}
      padding={spacing.small}
    >
      <YStack space={spacing.small}>
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize={14} fontWeight="500" color={colors.text}>
            Set {setNumber}
          </Text>
          <XStack space={spacing.xsmall}>
            {!set.completed && (
              <Button
                size="$1"
                theme="green"
                onPress={onComplete}
                icon={<Check size={12} />}
              >
                Complete
              </Button>
            )}
            <Button
              size="$1"
              variant="outlined"
              onPress={onRemove}
              icon={<Minus size={12} />}
            />
          </XStack>
        </XStack>

        <XStack space={spacing.small} alignItems="center">
          {/* Weight Input */}
          <YStack space={spacing.xsmall}>
            <Text fontSize={10} color={colors.textMuted}>Weight</Text>
            <Input
              size="$2"
              width={80}
              value={set.weight?.toString() || ''}
              onChangeText={(text) => onUpdate({ weight: parseFloat(text) || 0 })}
              placeholder="0"
              keyboardType="numeric"
              disabled={set.completed}
            />
          </YStack>

          {/* Reps Input */}
          <YStack space={spacing.xsmall}>
            <Text fontSize={10} color={colors.textMuted}>Reps</Text>
            <Input
              size="$2"
              width={60}
              value={set.reps.toString()}
              onChangeText={(text) => onUpdate({ reps: parseInt(text) || 0 })}
              keyboardType="numeric"
              disabled={set.completed}
            />
          </YStack>

          {/* Rep Range Indicator */}
          <YStack space={spacing.xsmall}>
            <Text fontSize={10} color={colors.textMuted}>Range</Text>
            <Text
              fontSize={12}
              color={isRepInRange(set.reps, set.repRange) ? colors.success : colors.warning}
              fontWeight="500"
            >
              {set.repRange}
            </Text>
          </YStack>

          {/* Rest Timer Buttons */}
          {set.completed && (
            <YStack space={spacing.xsmall}>
              <Text fontSize={10} color={colors.textMuted}>Rest</Text>
              <XStack space={spacing.xsmall}>
                <Button size="$1" onPress={() => onStartRest(60)}>1m</Button>
                <Button size="$1" onPress={() => onStartRest(90)}>1.5m</Button>
                <Button size="$1" onPress={() => onStartRest(120)}>2m</Button>
              </XStack>
            </YStack>
          )}
        </XStack>

        {/* Notes */}
        {isEditing && (
          <Input
            size="$2"
            placeholder="Set notes..."
            value={set.notes || ''}
            onChangeText={(text) => onUpdate({ notes: text })}
            onBlur={() => setIsEditing(false)}
          />
        )}
        
        {!isEditing && !set.notes && (
          <Button
            size="$1"
            variant="outlined"
            onPress={() => setIsEditing(true)}
          >
            Add Notes
          </Button>
        )}
        
        {!isEditing && set.notes && (
          <Text fontSize={12} color={colors.textMuted} onPress={() => setIsEditing(true)}>
            {set.notes}
          </Text>
        )}
      </YStack>
    </Card>
  );
}

// Equipment editor component
interface EquipmentEditorProps {
  equipment: ExerciseEquipment;
  onUpdate: (equipment: ExerciseEquipment) => void;
  onCancel: () => void;
}

function EquipmentEditor({ equipment, onUpdate, onCancel }: EquipmentEditorProps) {
  const { colors, spacing } = useAppTheme();
  const [localEquipment, setLocalEquipment] = useState<ExerciseEquipment>(equipment);

  const updateLocalEquipment = (updates: Partial<ExerciseEquipment>) => {
    setLocalEquipment(prev => ({ ...prev, ...updates }));
  };

  return (
    <Card backgroundColor={colors.cardAlt} padding={spacing.medium}>
      <YStack space={spacing.medium}>
        <Text fontSize={16} fontWeight="500" color={colors.text}>
          Equipment Setup
        </Text>

        {/* Category Selection */}
        <YStack space={spacing.small}>
          <Text fontSize={14} color={colors.textMuted}>Category</Text>
          <XStack space={spacing.small} flexWrap="wrap">
            {EXERCISE_CATEGORIES.map(category => (
              <Button
                key={category}
                size="$2"
                theme={localEquipment.category === category ? 'blue' : undefined}
                variant={localEquipment.category === category ? undefined : 'outlined'}
                onPress={() => updateLocalEquipment({ category, subType: undefined })}
              >
                {category.replace('_', ' ')}
              </Button>
            ))}
          </XStack>
        </YStack>

        {/* Free Weight Subtype */}
        {localEquipment.category === 'free_weight' && (
          <YStack space={spacing.small}>
            <Text fontSize={14} color={colors.textMuted}>Type</Text>
            <XStack space={spacing.small}>
              {FREE_WEIGHT_SUBTYPES.map(subType => (
                <Button
                  key={subType}
                  size="$2"
                  theme={localEquipment.subType === subType ? 'blue' : undefined}
                  variant={localEquipment.subType === subType ? undefined : 'outlined'}
                  onPress={() => updateLocalEquipment({ subType })}
                >
                  {subType}
                </Button>
              ))}
            </XStack>
          </YStack>
        )}

        {/* Machine Type Input */}
        {(localEquipment.category === 'machine' || localEquipment.category === 'cables') && (
          <YStack space={spacing.small}>
            <Text fontSize={14} color={colors.textMuted}>Machine/Equipment</Text>
            <Input
              placeholder="e.g., Hammer Strength, Life Fitness..."
              value={localEquipment.machineType || ''}
              onChangeText={(text) => updateLocalEquipment({ machineType: text })}
            />
          </YStack>
        )}

        {/* Grip Selection */}
        <YStack space={spacing.small}>
          <Text fontSize={14} color={colors.textMuted}>Grip (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack space={spacing.small}>
              <Button
                size="$2"
                variant={localEquipment.grip ? 'outlined' : 'solid'}
                onPress={() => updateLocalEquipment({ grip: undefined })}
              >
                None
              </Button>
              {GRIP_TYPES.map(grip => (
                <Button
                  key={grip}
                  size="$2"
                  theme={localEquipment.grip === grip ? 'blue' : undefined}
                  variant={localEquipment.grip === grip ? undefined : 'outlined'}
                  onPress={() => updateLocalEquipment({ grip })}
                >
                  {grip}
                </Button>
              ))}
            </XStack>
          </ScrollView>
        </YStack>

        {/* Notes */}
        <YStack space={spacing.small}>
          <Text fontSize={14} color={colors.textMuted}>Notes (Optional)</Text>
          <Input
            placeholder="Additional equipment details..."
            value={localEquipment.notes || ''}
            onChangeText={(text) => updateLocalEquipment({ notes: text })}
          />
        </YStack>

        {/* Actions */}
        <XStack space={spacing.small}>
          <Button flex={1} variant="outlined" onPress={onCancel}>
            Cancel
          </Button>
          <Button flex={1} theme="blue" onPress={() => onUpdate(localEquipment)}>
            Save
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}