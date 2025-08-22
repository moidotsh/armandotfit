import React, { useState } from 'react';
import { YStack, XStack, Text, Card, Button, Input, Select, TextArea, Separator } from 'tamagui';
import { Plus, Save, X, ChevronDown } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { exerciseService } from '../../services/exerciseService';
import { ExerciseCategory, FreeWeightSubType, GripType, MuscleGroup } from '../../types/workout';

interface CustomExerciseCreatorProps {
  onExerciseCreated?: (exerciseId: string) => void;
  onCancel?: () => void;
}

export function CustomExerciseCreator({ onExerciseCreated, onCancel }: CustomExerciseCreatorProps) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'free_weight' as ExerciseCategory,
    primaryMuscleGroups: [] as MuscleGroup[],
    secondaryMuscleGroups: [] as MuscleGroup[],
    supportedGrips: [] as GripType[],
    freeWeightSubTypes: [] as FreeWeightSubType[],
    instructions: '',
    tips: '',
    difficultyLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'core', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body'
  ];

  const gripTypes: GripType[] = [
    'overhand', 'underhand', 'neutral', 'mixed', 'hook', 
    'wide', 'narrow', 'close', 'standard'
  ];

  const freeWeightSubTypes: FreeWeightSubType[] = ['dumbbells', 'barbell'];

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (formData.primaryMuscleGroups.length === 0) {
      setError('At least one primary muscle group is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const exerciseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        primaryMuscleGroups: formData.primaryMuscleGroups,
        secondaryMuscleGroups: formData.secondaryMuscleGroups,
        supportedGrips: formData.supportedGrips,
        freeWeightSubTypes: formData.category === 'free_weight' ? formData.freeWeightSubTypes : undefined,
        instructions: formData.instructions.trim() || undefined,
        tips: formData.tips.trim() || undefined,
        difficultyLevel: formData.difficultyLevel
      };

      const result = await exerciseService.createCustomExercise(exerciseData, user.id);

      if (result.success && result.exerciseId) {
        onExerciseCreated?.(result.exerciseId);
      } else {
        setError(result.error || 'Failed to create exercise');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating custom exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = <T,>(array: T[], item: T, setter: (newArray: T[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card backgroundColor={colors.cardBackground} padding={spacing.large} borderRadius={borderRadius.large}>
      <YStack space={spacing.large}>
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize={fontSize.xlarge} fontWeight="600" color={colors.text}>
            Create Custom Exercise
          </Text>
          {onCancel && (
            <Button
              size="$2"
              circular
              backgroundColor="transparent"
              onPress={onCancel}
            >
              <X size={20} color={colors.textMuted} />
            </Button>
          )}
        </XStack>

        {error && (
          <Card backgroundColor={colors.error} padding={spacing.small}>
            <Text color="white" fontSize={fontSize.small}>
              {error}
            </Text>
          </Card>
        )}

        <YStack space={spacing.medium}>
          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Exercise Name *
            </Text>
            <Input
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="e.g., Incline Dumbbell Press"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
            />
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Description
            </Text>
            <TextArea
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              placeholder="Brief description of the exercise"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
              minHeight={60}
            />
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Category *
            </Text>
            <Select
              value={formData.category}
              onValueChange={(value) => updateFormData('category', value as ExerciseCategory)}
            >
              <Select.Trigger backgroundColor={colors.inputBackground} borderColor={colors.border}>
                <Select.Value color={colors.text} />
                <ChevronDown size={16} color={colors.textMuted} />
              </Select.Trigger>
              <Select.Content>
                <Select.Viewport>
                  <Select.Item value="calisthenic">
                    <Select.ItemText>Calisthenic</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="free_weight">
                    <Select.ItemText>Free Weight</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="cables">
                    <Select.ItemText>Cables</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="machine">
                    <Select.ItemText>Machine</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select>
          </YStack>

          {formData.category === 'free_weight' && (
            <YStack space={spacing.small}>
              <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
                Free Weight Sub-Types
              </Text>
              <XStack flexWrap="wrap" gap={spacing.small}>
                {freeWeightSubTypes.map((subType) => (
                  <Button
                    key={subType}
                    size="$2"
                    theme={formData.freeWeightSubTypes.includes(subType) ? 'blue' : undefined}
                    variant={formData.freeWeightSubTypes.includes(subType) ? undefined : 'outlined'}
                    onPress={() => toggleArrayItem(
                      formData.freeWeightSubTypes, 
                      subType, 
                      (newArray) => updateFormData('freeWeightSubTypes', newArray)
                    )}
                  >
                    {subType.charAt(0).toUpperCase() + subType.slice(1)}
                  </Button>
                ))}
              </XStack>
            </YStack>
          )}

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Primary Muscle Groups *
            </Text>
            <XStack flexWrap="wrap" gap={spacing.small}>
              {muscleGroups.map((muscle) => (
                <Button
                  key={muscle}
                  size="$2"
                  theme={formData.primaryMuscleGroups.includes(muscle) ? 'blue' : undefined}
                  variant={formData.primaryMuscleGroups.includes(muscle) ? undefined : 'outlined'}
                  onPress={() => toggleArrayItem(
                    formData.primaryMuscleGroups, 
                    muscle, 
                    (newArray) => updateFormData('primaryMuscleGroups', newArray)
                  )}
                >
                  {muscle.replace('_', ' ')}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Secondary Muscle Groups
            </Text>
            <XStack flexWrap="wrap" gap={spacing.small}>
              {muscleGroups.map((muscle) => (
                <Button
                  key={muscle}
                  size="$2"
                  theme={formData.secondaryMuscleGroups.includes(muscle) ? 'orange' : undefined}
                  variant={formData.secondaryMuscleGroups.includes(muscle) ? undefined : 'outlined'}
                  onPress={() => toggleArrayItem(
                    formData.secondaryMuscleGroups, 
                    muscle, 
                    (newArray) => updateFormData('secondaryMuscleGroups', newArray)
                  )}
                >
                  {muscle.replace('_', ' ')}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Supported Grips
            </Text>
            <XStack flexWrap="wrap" gap={spacing.small}>
              {gripTypes.map((grip) => (
                <Button
                  key={grip}
                  size="$2"
                  theme={formData.supportedGrips.includes(grip) ? 'green' : undefined}
                  variant={formData.supportedGrips.includes(grip) ? undefined : 'outlined'}
                  onPress={() => toggleArrayItem(
                    formData.supportedGrips, 
                    grip, 
                    (newArray) => updateFormData('supportedGrips', newArray)
                  )}
                >
                  {grip}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Difficulty Level
            </Text>
            <XStack space={spacing.small}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <Button
                  key={level}
                  flex={1}
                  size="$2"
                  theme={formData.difficultyLevel === level ? 'blue' : undefined}
                  variant={formData.difficultyLevel === level ? undefined : 'outlined'}
                  onPress={() => updateFormData('difficultyLevel', level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          <Separator />

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Instructions
            </Text>
            <TextArea
              value={formData.instructions}
              onChangeText={(text) => updateFormData('instructions', text)}
              placeholder="Step-by-step instructions for performing the exercise"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
              minHeight={80}
            />
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Tips
            </Text>
            <TextArea
              value={formData.tips}
              onChangeText={(text) => updateFormData('tips', text)}
              placeholder="Helpful tips and form cues"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
              minHeight={60}
            />
          </YStack>
        </YStack>

        <XStack space={spacing.medium} marginTop={spacing.large}>
          {onCancel && (
            <Button
              flex={1}
              variant="outlined"
              onPress={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            flex={1}
            backgroundColor={colors.primary}
            onPress={handleSubmit}
            disabled={loading || !formData.name.trim() || formData.primaryMuscleGroups.length === 0}
            opacity={loading ? 0.7 : 1}
          >
            <XStack alignItems="center" space={spacing.small}>
              {loading ? (
                <Text color="white">Creating...</Text>
              ) : (
                <>
                  <Save size={16} color="white" />
                  <Text color="white" fontWeight="600">
                    Create Exercise
                  </Text>
                </>
              )}
            </XStack>
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}