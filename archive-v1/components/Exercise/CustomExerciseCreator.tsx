import React, { useState } from 'react';
import { YStack, XStack, Text, Card, Button, Input, Select, TextArea, Separator } from 'tamagui';
import { Plus, Save, X, ChevronDown } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { exerciseService } from '../../services/exerciseService';
import { ExerciseCategory, FreeWeightSubType, GripType, MuscleGroup } from '../../types/workout';
import { 
  Exercise, 
  ExerciseVariation
} from '../../types/exercise';
import { 
  EquipmentCategory
} from '../../constants/equipmentTypes';

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
    category: 'FreeWeight' as keyof typeof equipmentOptions,
    primaryMuscleGroups: [] as MuscleGroup[],
    secondaryMuscleGroups: [] as MuscleGroup[],
    supportedGrips: [] as GripType[],
    customGrip: '',
    instructions: '',
    tips: '',
    difficultyLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    equipment: [] as string[],
    customTags: '',
    model: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof equipmentOptions>('FreeWeight');

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

  

  const equipmentOptions = {
    Bodyweight: [
      { id: 'bodyweight', name: 'Bodyweight Only' }
    ],
    FreeWeight: [
      { id: 'dumbbell', name: 'Dumbbell' },
      { id: 'barbell', name: 'Barbell' },
      { id: 'kettlebell', name: 'Kettlebell' },
      { id: 'weight_plate', name: 'Weight Plates' }
    ],
    Station: [
      { id: 'bench', name: 'Flat Bench' },
      { id: 'incline_bench', name: 'Incline Bench' },
      { id: 'decline_bench', name: 'Decline Bench' },
      { id: 'squat_rack', name: 'Squat Rack' },
      { id: 'pull_up_bar', name: 'Pull-up Bar' },
      { id: 'dip_bars', name: 'Dip Bars' }
    ],
    Machine: [
      { id: 'machine_chest_press', name: 'Chest Press Machine' },
      { id: 'machine_leg_press', name: 'Leg Press Machine' },
      { id: 'machine_leg_extension', name: 'Leg Extension Machine' },
      { id: 'machine_leg_curl', name: 'Leg Curl Machine' },
      { id: 'machine_lat_pulldown', name: 'Lat Pulldown Machine' },
      { id: 'machine_seated_row', name: 'Seated Row Machine' },
      { id: 'machine_shoulder_press', name: 'Shoulder Press Machine' },
      { id: 'machine_cable_cross', name: 'Cable Crossover Machine' }
    ],
    Cable: [
      { id: 'cable_rope', name: 'Cable Rope Attachment' },
      { id: 'cable_bar', name: 'Cable Bar Attachment' },
      { id: 'cable_handle', name: 'Cable Handle Attachment' },
      { id: 'cable_v_bar', name: 'Cable V-Bar Attachment' },
      { id: 'cable_single_handle', name: 'Cable Single Handle' }
    ],
    Smith: [
      { id: 'smith_machine', name: 'Smith Machine' }
    ]
  };

  

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

    if (formData.equipment.length === 0) {
      setError('At least one equipment type is required');
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
        customGrip: formData.customGrip.trim() || undefined,
        instructions: formData.instructions.trim() || undefined,
        tips: formData.tips.trim() || undefined,
        difficultyLevel: formData.difficultyLevel,
        equipment: formData.equipment,
        customTags: formData.customTags.trim() || undefined,
        model: formData.model.trim() || undefined
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

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Equipment Category *
            </Text>
            <XStack flexWrap="wrap" gap={spacing.small}>
              {Object.keys(equipmentOptions).map((category) => (
                <Button
                  key={category}
                  size="$2"
                  theme={selectedCategory === category ? 'blue' : undefined}
                  variant={selectedCategory === category ? undefined : 'outlined'}
                  onPress={() => {
                    setSelectedCategory(category as keyof typeof equipmentOptions);
                    // Clear equipment selection when category changes
                    updateFormData('equipment', []);
                  }}
                >
                  {category.replace('_', ' ')}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Equipment *
            </Text>
            <XStack flexWrap="wrap" gap={spacing.small}>
              {equipmentOptions[selectedCategory].map((option) => (
                <Button
                  key={option.id}
                  size="$2"
                  theme={formData.equipment.includes(option.id) ? 'blue' : undefined}
                  variant={formData.equipment.includes(option.id) ? undefined : 'outlined'}
                  onPress={() => toggleArrayItem(
                    formData.equipment, 
                    option.id, 
                    (newArray) => updateFormData('equipment', newArray)
                  )}
                >
                  {option.name}
                </Button>
              ))}
            </XStack>
            {formData.equipment.length === 0 && (
              <Text fontSize="$1" color={colors.textSecondary} marginTop="$1">
                Select at least one equipment option
              </Text>
            )}
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Custom Tags
            </Text>
            <Input
              value={formData.customTags}
              onChangeText={(text) => updateFormData('customTags', text)}
              placeholder="e.g., ecc, wide, chain, pause, bands"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
            />
            <Text fontSize={fontSize.small} color={colors.textSecondary}>
              Enter comma-separated tags for variations and techniques
            </Text>
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Custom Grip
            </Text>
            <Input
              value={formData.customGrip}
              onChangeText={(text) => updateFormData('customGrip', text)}
              placeholder="e.g., wide grip, neutral grip, mixed grip"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
            />
          </YStack>

          <YStack space={spacing.small}>
            <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
              Model (Optional)
            </Text>
            <Input
              value={formData.model}
              onChangeText={(text) => updateFormData('model', text)}
              placeholder="e.g., Signature Series, Pro Plus"
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
            />
          </YStack>

          

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