import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Card, Button, ScrollView } from 'tamagui';
import { Layers, Plus, ArrowRight, TrendingUp, Star, Info } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { exerciseService, ExerciseTemplate, ExerciseVariation } from '../../services/exerciseService';

interface ExerciseVariationManagerProps {
  exercise: ExerciseTemplate;
  onVariationSelect?: (variation: ExerciseVariation) => void;
}

export function ExerciseVariationManager({ exercise, onVariationSelect }: ExerciseVariationManagerProps) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [variations, setVariations] = useState<ExerciseVariation[]>([]);
  const [recommendations, setRecommendations] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVariationsAndRecommendations();
  }, [exercise.id]);

  const loadVariationsAndRecommendations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const [variationsData, recommendationsData] = await Promise.all([
        exerciseService.getExerciseVariations(exercise.id),
        exerciseService.getExerciseRecommendations(user.id, exercise.id)
      ]);

      setVariations(variationsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Error loading variations and recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const formatVariationType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card backgroundColor={colors.cardBackground} padding={spacing.large} alignItems="center">
        <Text color={colors.textMuted}>Loading variations...</Text>
      </Card>
    );
  }

  return (
    <YStack space={spacing.large}>
      {/* Exercise Info */}
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium} borderRadius={borderRadius.medium}>
        <YStack space={spacing.small}>
          <XStack alignItems="center" space={spacing.small}>
            <Layers size={20} color={colors.primary} />
            <Text fontSize={fontSize.large} fontWeight="600" color={colors.text}>
              {exercise.name} Variations
            </Text>
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
            
            {exercise.primaryMuscleGroups.slice(0, 3).map((muscle) => (
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
          </XStack>
        </YStack>
      </Card>

      {/* Exercise Variations */}
      {variations.length > 0 && (
        <YStack space={spacing.medium}>
          <Text fontSize={fontSize.large} fontWeight="600" color={colors.text}>
            Exercise Variations
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack space={spacing.medium} paddingHorizontal={spacing.small}>
              {variations.map((variation) => (
                <Card
                  key={variation.id}
                  backgroundColor={colors.cardBackground}
                  padding={spacing.medium}
                  borderRadius={borderRadius.medium}
                  width={280}
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  onPress={() => onVariationSelect?.(variation)}
                >
                  <YStack space={spacing.small}>
                    <XStack alignItems="center" justifyContent="space-between">
                      <Text fontSize={fontSize.medium} fontWeight="600" color={colors.text} flex={1}>
                        {variation.name}
                      </Text>
                      <ArrowRight size={16} color={colors.textMuted} />
                    </XStack>

                    <Text fontSize={fontSize.small} color={colors.textMuted} numberOfLines={2}>
                      {variation.description}
                    </Text>

                    <XStack space={spacing.small} flexWrap="wrap">
                      <YStack
                        backgroundColor={colors.cardAlt}
                        paddingHorizontal={spacing.small}
                        paddingVertical={spacing.xsmall}
                        borderRadius={borderRadius.small}
                      >
                        <Text fontSize={fontSize.xsmall} color={colors.textMuted}>
                          {formatVariationType(variation.variationType)}
                        </Text>
                      </YStack>

                      {variation.difficultyLevel && (
                        <YStack
                          backgroundColor={getDifficultyColor(variation.difficultyLevel)}
                          paddingHorizontal={spacing.small}
                          paddingVertical={spacing.xsmall}
                          borderRadius={borderRadius.small}
                        >
                          <Text fontSize={fontSize.xsmall} color="white">
                            {variation.difficultyLevel}
                          </Text>
                        </YStack>
                      )}
                    </XStack>

                    {variation.differences && variation.differences.length > 0 && (
                      <YStack space={spacing.xsmall}>
                        <Text fontSize={fontSize.small} fontWeight="500" color={colors.text}>
                          Key Differences:
                        </Text>
                        {variation.differences.slice(0, 2).map((diff, index) => (
                          <XStack key={index} alignItems="flex-start" space={spacing.xsmall}>
                            <Text fontSize={fontSize.xsmall} color={colors.primary}>
                              •
                            </Text>
                            <Text fontSize={fontSize.xsmall} color={colors.textMuted} flex={1}>
                              {diff}
                            </Text>
                          </XStack>
                        ))}
                      </YStack>
                    )}

                    {variation.benefits && variation.benefits.length > 0 && (
                      <YStack space={spacing.xsmall}>
                        <Text fontSize={fontSize.small} fontWeight="500" color={colors.text}>
                          Benefits:
                        </Text>
                        {variation.benefits.slice(0, 1).map((benefit, index) => (
                          <XStack key={index} alignItems="flex-start" space={spacing.xsmall}>
                            <Star size={12} color={colors.warning} />
                            <Text fontSize={fontSize.xsmall} color={colors.textMuted} flex={1}>
                              {benefit}
                            </Text>
                          </XStack>
                        ))}
                      </YStack>
                    )}
                  </YStack>
                </Card>
              ))}
            </XStack>
          </ScrollView>
        </YStack>
      )}

      {/* Recommended Similar Exercises */}
      {recommendations.length > 0 && (
        <YStack space={spacing.medium}>
          <XStack alignItems="center" space={spacing.small}>
            <TrendingUp size={20} color={colors.primary} />
            <Text fontSize={fontSize.large} fontWeight="600" color={colors.text}>
              Similar Exercises
            </Text>
          </XStack>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack space={spacing.medium} paddingHorizontal={spacing.small}>
              {recommendations.map((recommendation) => (
                <Card
                  key={recommendation.id}
                  backgroundColor={colors.cardBackground}
                  padding={spacing.medium}
                  borderRadius={borderRadius.medium}
                  width={260}
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  onPress={() => {
                    // Could navigate to this exercise's details
                  }}
                >
                  <YStack space={spacing.small}>
                    <XStack alignItems="center" justifyContent="space-between">
                      <Text fontSize={fontSize.medium} fontWeight="600" color={colors.text} flex={1}>
                        {recommendation.name}
                      </Text>
                      {recommendation.isCustom && (
                        <Star size={14} color={colors.warning} />
                      )}
                    </XStack>

                    {recommendation.description && (
                      <Text fontSize={fontSize.small} color={colors.textMuted} numberOfLines={2}>
                        {recommendation.description}
                      </Text>
                    )}

                    <XStack space={spacing.small} flexWrap="wrap">
                      <YStack
                        backgroundColor={colors.cardAlt}
                        paddingHorizontal={spacing.small}
                        paddingVertical={spacing.xsmall}
                        borderRadius={borderRadius.small}
                      >
                        <Text fontSize={fontSize.xsmall} color={colors.textMuted}>
                          {recommendation.category.replace('_', ' ')}
                        </Text>
                      </YStack>

                      {recommendation.primaryMuscleGroups.slice(0, 2).map((muscle) => (
                        <YStack
                          key={muscle}
                          backgroundColor={colors.primary}
                          paddingHorizontal={spacing.small}
                          paddingVertical={spacing.xsmall}
                          borderRadius={borderRadius.small}
                        >
                          <Text fontSize={fontSize.xsmall} color="white">
                            {muscle.replace('_', ' ')}
                          </Text>
                        </YStack>
                      ))}

                      {recommendation.difficultyLevel && (
                        <YStack
                          backgroundColor={getDifficultyColor(recommendation.difficultyLevel)}
                          paddingHorizontal={spacing.small}
                          paddingVertical={spacing.xsmall}
                          borderRadius={borderRadius.small}
                        >
                          <Text fontSize={fontSize.xsmall} color="white">
                            {recommendation.difficultyLevel}
                          </Text>
                        </YStack>
                      )}
                    </XStack>

                    {/* Shared muscle groups indicator */}
                    <XStack alignItems="center" space={spacing.xsmall}>
                      <Info size={12} color={colors.textMuted} />
                      <Text fontSize={fontSize.xsmall} color={colors.textMuted}>
                        {recommendation.primaryMuscleGroups.filter(muscle => 
                          exercise.primaryMuscleGroups.includes(muscle)
                        ).length} shared muscle groups
                      </Text>
                    </XStack>
                  </YStack>
                </Card>
              ))}
            </XStack>
          </ScrollView>
        </YStack>
      )}

      {/* No variations found */}
      {variations.length === 0 && recommendations.length === 0 && (
        <Card backgroundColor={colors.cardBackground} padding={spacing.large} alignItems="center">
          <YStack alignItems="center" space={spacing.medium}>
            <Layers size={32} color={colors.textMuted} />
            <Text fontSize={fontSize.medium} color={colors.textMuted} textAlign="center">
              No variations or similar exercises found for this exercise
            </Text>
            <Text fontSize={fontSize.small} color={colors.textMuted} textAlign="center">
              This exercise may be unique or part of a specialized category
            </Text>
          </YStack>
        </Card>
      )}
    </YStack>
  );
}