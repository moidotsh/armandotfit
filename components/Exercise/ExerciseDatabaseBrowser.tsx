import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Card, Button, Input, Select, ScrollView } from 'tamagui';
import { Search, Filter, Plus, Star, Trash2, Edit, ChevronDown } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { exerciseService, ExerciseTemplate, ExerciseFilters } from '../../services/exerciseService';
import { ExerciseCategory, MuscleGroup } from '../../types/workout';
import { CustomExerciseCreator } from './CustomExerciseCreator';

interface ExerciseDatabaseBrowserProps {
  onExerciseSelect?: (exercise: ExerciseTemplate) => void;
  showCreateButton?: boolean;
  allowSelection?: boolean;
}

export function ExerciseDatabaseBrowser({ 
  onExerciseSelect, 
  showCreateButton = true, 
  allowSelection = true 
}: ExerciseDatabaseBrowserProps) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [exercises, setExercises] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const [filters, setFilters] = useState<ExerciseFilters>({
    category: undefined,
    primaryMuscleGroup: undefined,
    difficulty: undefined,
    isCustom: undefined
  });

  const muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'core', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body'
  ];

  const categories: ExerciseCategory[] = ['calisthenic', 'free_weight', 'cables', 'machine'];

  useEffect(() => {
    loadExercises();
  }, [searchQuery, filters]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const results = await exerciseService.searchExercises(searchQuery, filters);
      setExercises(results);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!user?.id) return;

    try {
      const result = await exerciseService.deleteCustomExercise(exerciseId, user.id);
      if (result.success) {
        setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const handleExerciseCreated = (exerciseId: string) => {
    setShowCreator(false);
    loadExercises(); // Refresh the list
  };

  const updateFilters = (key: keyof ExerciseFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: undefined,
      primaryMuscleGroup: undefined,
      difficulty: undefined,
      isCustom: undefined
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  if (showCreator) {
    return (
      <CustomExerciseCreator
        onExerciseCreated={handleExerciseCreated}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  return (
    <YStack flex={1} space={spacing.medium}>
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={fontSize.xlarge} fontWeight="600" color={colors.text}>
          Exercise Database
        </Text>
        {showCreateButton && (
          <Button
            size="$3"
            backgroundColor={colors.primary}
            onPress={() => setShowCreator(true)}
          >
            <XStack alignItems="center" space={spacing.small}>
              <Plus size={16} color="white" />
              <Text color="white" fontWeight="600">
                Create
              </Text>
            </XStack>
          </Button>
        )}
      </XStack>

      {/* Search and Filters */}
      <YStack space={spacing.small}>
        <XStack space={spacing.small}>
          <YStack flex={1}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              backgroundColor={colors.inputBackground}
              borderColor={colors.border}
              color={colors.text}
            />
          </YStack>
          <Button
            size="$3"
            variant="outlined"
            onPress={() => setShowFilters(!showFilters)}
            theme={hasActiveFilters ? 'blue' : undefined}
          >
            <Filter size={16} color={hasActiveFilters ? colors.primary : colors.textMuted} />
          </Button>
        </XStack>

        {showFilters && (
          <Card backgroundColor={colors.cardBackground} padding={spacing.medium} borderRadius={borderRadius.medium}>
            <YStack space={spacing.medium}>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={fontSize.medium} fontWeight="500" color={colors.text}>
                  Filters
                </Text>
                {hasActiveFilters && (
                  <Button size="$2" variant="outlined" onPress={clearFilters}>
                    Clear All
                  </Button>
                )}
              </XStack>

              <XStack space={spacing.small} flexWrap="wrap">
                <YStack flex={1} minWidth={120}>
                  <Text fontSize={fontSize.small} color={colors.textMuted} marginBottom={spacing.xsmall}>
                    Category
                  </Text>
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => updateFilters('category', value === 'all' ? undefined : value)}
                  >
                    <Select.Trigger backgroundColor={colors.inputBackground} borderColor={colors.border}>
                      <Select.Value color={colors.text} />
                      <ChevronDown size={14} color={colors.textMuted} />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        <Select.Item value="all">
                          <Select.ItemText>All Categories</Select.ItemText>
                        </Select.Item>
                        {categories.map((category) => (
                          <Select.Item key={category} value={category}>
                            <Select.ItemText>
                              {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack flex={1} minWidth={120}>
                  <Text fontSize={fontSize.small} color={colors.textMuted} marginBottom={spacing.xsmall}>
                    Muscle Group
                  </Text>
                  <Select
                    value={filters.primaryMuscleGroup || 'all'}
                    onValueChange={(value) => updateFilters('primaryMuscleGroup', value === 'all' ? undefined : value)}
                  >
                    <Select.Trigger backgroundColor={colors.inputBackground} borderColor={colors.border}>
                      <Select.Value color={colors.text} />
                      <ChevronDown size={14} color={colors.textMuted} />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        <Select.Item value="all">
                          <Select.ItemText>All Muscles</Select.ItemText>
                        </Select.Item>
                        {muscleGroups.map((muscle) => (
                          <Select.Item key={muscle} value={muscle}>
                            <Select.ItemText>
                              {muscle.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>
              </XStack>

              <XStack space={spacing.small}>
                <YStack flex={1}>
                  <Text fontSize={fontSize.small} color={colors.textMuted} marginBottom={spacing.xsmall}>
                    Difficulty
                  </Text>
                  <Select
                    value={filters.difficulty || 'all'}
                    onValueChange={(value) => updateFilters('difficulty', value === 'all' ? undefined : value)}
                  >
                    <Select.Trigger backgroundColor={colors.inputBackground} borderColor={colors.border}>
                      <Select.Value color={colors.text} />
                      <ChevronDown size={14} color={colors.textMuted} />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        <Select.Item value="all">
                          <Select.ItemText>All Levels</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="beginner">
                          <Select.ItemText>Beginner</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="intermediate">
                          <Select.ItemText>Intermediate</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="advanced">
                          <Select.ItemText>Advanced</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack flex={1}>
                  <Text fontSize={fontSize.small} color={colors.textMuted} marginBottom={spacing.xsmall}>
                    Type
                  </Text>
                  <Select
                    value={filters.isCustom === undefined ? 'all' : (filters.isCustom ? 'custom' : 'system')}
                    onValueChange={(value) => updateFilters('isCustom', value === 'all' ? undefined : value === 'custom')}
                  >
                    <Select.Trigger backgroundColor={colors.inputBackground} borderColor={colors.border}>
                      <Select.Value color={colors.text} />
                      <ChevronDown size={14} color={colors.textMuted} />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        <Select.Item value="all">
                          <Select.ItemText>All Exercises</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="system">
                          <Select.ItemText>System Exercises</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="custom">
                          <Select.ItemText>Custom Exercises</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        )}
      </YStack>

      {/* Results */}
      <YStack flex={1}>
        {loading ? (
          <Card backgroundColor={colors.cardBackground} padding={spacing.large} alignItems="center">
            <Text color={colors.textMuted}>Loading exercises...</Text>
          </Card>
        ) : exercises.length === 0 ? (
          <Card backgroundColor={colors.cardBackground} padding={spacing.large} alignItems="center">
            <Text color={colors.textMuted} textAlign="center">
              No exercises found matching your criteria
            </Text>
            {showCreateButton && (
              <Button
                marginTop={spacing.medium}
                onPress={() => setShowCreator(true)}
                backgroundColor={colors.primary}
              >
                Create Custom Exercise
              </Button>
            )}
          </Card>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack space={spacing.small} paddingBottom={spacing.large}>
              {exercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  backgroundColor={colors.cardBackground}
                  padding={spacing.medium}
                  borderRadius={borderRadius.medium}
                  pressStyle={allowSelection ? { scale: 0.98, opacity: 0.9 } : undefined}
                  onPress={allowSelection ? () => onExerciseSelect?.(exercise) : undefined}
                >
                  <YStack space={spacing.small}>
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" space={spacing.small} flex={1}>
                        <Text
                          fontSize={fontSize.medium}
                          fontWeight="600"
                          color={colors.text}
                          flex={1}
                        >
                          {exercise.name}
                        </Text>
                        {exercise.isCustom && (
                          <XStack alignItems="center" space={spacing.xsmall}>
                            <Star size={14} color={colors.warning} />
                            <Text fontSize={fontSize.small} color={colors.warning}>
                              Custom
                            </Text>
                          </XStack>
                        )}
                      </XStack>

                      {exercise.isCustom && user?.id && (
                        <XStack space={spacing.xsmall}>
                          <Button
                            size="$2"
                            circular
                            backgroundColor="transparent"
                            onPress={(e) => {
                              e.stopPropagation();
                              // Handle edit - could open creator in edit mode
                            }}
                          >
                            <Edit size={16} color={colors.textMuted} />
                          </Button>
                          <Button
                            size="$2"
                            circular
                            backgroundColor="transparent"
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(exercise.id);
                            }}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </Button>
                        </XStack>
                      )}
                    </XStack>

                    {exercise.description && (
                      <Text fontSize={fontSize.small} color={colors.textMuted}>
                        {exercise.description}
                      </Text>
                    )}

                    <XStack space={spacing.small} flexWrap="wrap">
                      <YStack
                        backgroundColor={colors.cardAlt}
                        paddingHorizontal={spacing.small}
                        paddingVertical={spacing.xsmall}
                        borderRadius={borderRadius.small}
                      >
                        <Text fontSize={fontSize.small} color={colors.textMuted}>
                          {exercise.category.replace('_', ' ')}
                        </Text>
                      </YStack>
                      
                      {exercise.primaryMuscleGroups.slice(0, 2).map((muscle) => (
                        <YStack
                          key={muscle}
                          backgroundColor={colors.primary}
                          paddingHorizontal={spacing.small}
                          paddingVertical={spacing.xsmall}
                          borderRadius={borderRadius.small}
                        >
                          <Text fontSize={fontSize.small} color="white">
                            {muscle.replace('_', ' ')}
                          </Text>
                        </YStack>
                      ))}

                      {exercise.primaryMuscleGroups.length > 2 && (
                        <YStack
                          backgroundColor={colors.textMuted}
                          paddingHorizontal={spacing.small}
                          paddingVertical={spacing.xsmall}
                          borderRadius={borderRadius.small}
                        >
                          <Text fontSize={fontSize.small} color="white">
                            +{exercise.primaryMuscleGroups.length - 2}
                          </Text>
                        </YStack>
                      )}

                      {exercise.difficultyLevel && (
                        <YStack
                          backgroundColor={
                            exercise.difficultyLevel === 'beginner' ? colors.success :
                            exercise.difficultyLevel === 'intermediate' ? colors.warning :
                            colors.error
                          }
                          paddingHorizontal={spacing.small}
                          paddingVertical={spacing.xsmall}
                          borderRadius={borderRadius.small}
                        >
                          <Text fontSize={fontSize.small} color="white">
                            {exercise.difficultyLevel}
                          </Text>
                        </YStack>
                      )}
                    </XStack>
                  </YStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </YStack>
  );
}