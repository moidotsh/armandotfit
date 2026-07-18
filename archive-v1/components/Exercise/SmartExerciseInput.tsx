// components/Exercise/SmartExerciseInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Card, Button, Input, ScrollView, Spacer, Separator } from 'tamagui';
import { Search, Tag, Settings, Plus, ChevronDown, Check, X } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { exerciseService } from '../../services/exerciseService';
import { Exercise, ExerciseVariation, ExerciseTag, ExerciseInstance, EquipmentRegistry } from '../../types/exercise';

interface SmartExerciseInputProps {
  onExerciseSelect?: (instance: ExerciseInstance) => void;
  onExerciseCreate?: (name: string) => void;
  placeholder?: string;
  gymId?: string;
  autoFocus?: boolean;
  showAdvancedOptions?: boolean;
}

export function SmartExerciseInput({
  onExerciseSelect,
  onExerciseCreate,
  placeholder = "Enter exercise name (e.g., 'Bench Press WIDE LF-CP1')",
  gymId,
  autoFocus = false,
  showAdvancedOptions = false
}: SmartExerciseInputProps) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [variationSuggestions, setVariationSuggestions] = useState<ExerciseVariation[]>([]);
  const [parsedInput, setParsedInput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Smart parsing effect
  useEffect(() => {
    if (inputText.trim()) {
      const parsed = exerciseService.parseExerciseInput(inputText);
      setParsedInput(parsed);

      // Load exercise suggestions based on base name
      loadExerciseSuggestions(parsed.baseName);

      // Load variation suggestions if we have a base exercise
      if (suggestions.length > 0 && parsed.extractedTags.length > 0) {
        loadVariationSuggestions(suggestions[0], inputText);
      }
    } else {
      setParsedInput(null);
      setSuggestions([]);
      setVariationSuggestions([]);
    }
  }, [inputText]);

  const loadExerciseSuggestions = async (baseName: string) => {
    try {
      setLoading(true);
      const exercises = await exerciseService.getExercises({
        searchQuery: baseName,
        isCustom: false
      });
      setSuggestions(exercises.slice(0, 5)); // Limit to top 5
    } catch (error) {
      console.error('Error loading exercise suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariationSuggestions = async (exercise: Exercise, userInput: string) => {
    try {
      const variations = await exerciseService.suggestVariations(exercise, userInput, gymId);
      setVariationSuggestions(variations.slice(0, 3)); // Limit to top 3
      setShowVariations(variations.length > 0);
    } catch (error) {
      console.error('Error loading variation suggestions:', error);
    }
  };

  const handleExerciseSelect = (exercise: Exercise, variation?: ExerciseVariation) => {
    const instance: ExerciseInstance = {
      baseExerciseId: exercise.id,
      variationId: variation?.id,
      customVariation: parsedInput?.notes,
      customEquipment: parsedInput?.equipmentInfo,
      parsedTags: parsedInput?.extractedTags || [],
      sets: 3,
      reps: '8-12'
    };

    onExerciseSelect?.(instance);
    setInputText('');
    setParsedInput(null);
    setSuggestions([]);
    setVariationSuggestions([]);
  };

  const handleCreateExercise = () => {
    if (parsedInput?.baseName.trim()) {
      onExerciseCreate?.(parsedInput.baseName);
    }
  };

  const renderParsedTags = () => {
    if (!parsedInput?.extractedTags.length) return null;

    return (
      <XStack gap="$2" flexWrap="wrap" marginTop="$2">
        {parsedInput.extractedTags.map((tag: ExerciseTag, index: number) => (
          <XStack
            key={index}
            backgroundColor={colors.tag}
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$2"
            alignItems="center"
            gap="$1"
          >
            <Tag size="$1" color={colors.textSecondary} />
            <Text fontSize="$1" color={colors.textSecondary}>
              {tag.name}
            </Text>
          </XStack>
        ))}
      </XStack>
    );
  };

  const renderEquipmentInfo = () => {
    if (!parsedInput?.equipmentInfo && !parsedInput?.manufacturer) return null;

    return (
      <XStack gap="$2" alignItems="center" marginTop="$2">
        <Settings size="$1" color={colors.textSecondary} />
        <Text fontSize="$1" color={colors.textSecondary}>
          {parsedInput.equipmentInfo && `Equipment: ${parsedInput.equipmentInfo}`}
          {parsedInput.equipmentInfo && parsedInput.manufacturer && ' • '}
          {parsedInput.manufacturer && `Manufacturer: ${parsedInput.manufacturer}`}
        </Text>
      </XStack>
    );
  };

  return (
    <YStack gap="$2">
      <Card
        backgroundColor={colors.card}
        borderColor={isFocused ? colors.primary : colors.border}
        borderWidth={1}
        borderRadius="$3"
        overflow="hidden"
      >
        <XStack alignItems="center" gap="$2">
          <Search size="$1" color={colors.textSecondary} marginStart="$3" />
          <Input
            ref={inputRef}
            flex={1}
            value={inputText}
            onChangeText={setInputText}
            placeholder={placeholder}
            fontSize="$3"
            color={colors.text}
            placeholderTextColor={colors.textSecondary}
            backgroundColor="transparent"
            borderWidth={0}
            paddingVertical="$2"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {inputText && (
            <Button
              size="$2"
              circular
              icon={X}
              backgroundColor="transparent"
              color={colors.textSecondary}
              onPress={() => setInputText('')}
              marginEnd="$2"
            />
          )}
        </XStack>

        {/* Parsed information display */}
        {parsedInput && isFocused && (
          <>
            {renderParsedTags()}
            {renderEquipmentInfo()}
          </>
        )}
      </Card>

      {/* Exercise suggestions */}
      {suggestions.length > 0 && isFocused && (
        <Card backgroundColor={colors.card} borderRadius="$3" padding="$2">
          <YStack gap="$2">
            <Text fontSize="$2" color={colors.textSecondary} marginHorizontal="$2">
              Exercises
            </Text>
            {suggestions.map((exercise) => (
              <Card
                key={exercise.id}
                backgroundColor={colors.background}
                borderRadius="$2"
                padding="$3"
                pressStyle={{ backgroundColor: colors.border }}
                onPress={() => handleExerciseSelect(exercise)}
              >
                <YStack>
                  <Text fontSize="$3" color={colors.text} fontWeight="600">
                    {exercise.name} {exercise.extra && `(${exercise.extra})`}
                  </Text>
                  <Text fontSize="$1" color={colors.textSecondary} marginTop="$1">
                    {exercise.category} • {exercise.primaryMuscles.join(', ')}
                  </Text>
                </YStack>
              </Card>
            ))}

            {/* Create new exercise option */}
            <Button
              backgroundColor={colors.primary}
              color="white"
              icon={Plus}
              onPress={handleCreateExercise}
            >
              Create "{parsedInput?.baseName}"
            </Button>
          </YStack>
        </Card>
      )}

      {/* Variation suggestions */}
      {showVariations && variationSuggestions.length > 0 && isFocused && (
        <Card backgroundColor={colors.card} borderRadius="$3" padding="$2">
          <YStack gap="$2">
            <Text fontSize="$2" color={colors.textSecondary} marginHorizontal="$2">
              Suggested Variations
            </Text>
            {variationSuggestions.map((variation) => (
              <Card
                key={variation.id}
                backgroundColor={colors.background}
                borderRadius="$2"
                padding="$3"
                pressStyle={{ backgroundColor: colors.border }}
                onPress={() => {
                  const exercise = suggestions[0]; // Use the first suggested exercise
                  handleExerciseSelect(exercise, variation);
                }}
              >
                <YStack>
                  <Text fontSize="$3" color={colors.text} fontWeight="600">
                    {variation.name}
                  </Text>
                  {variation.description && (
                    <Text fontSize="$1" color={colors.textSecondary} marginTop="$1">
                      {variation.description}
                    </Text>
                  )}
                  {variation.tags.length > 0 && (
                    <XStack gap="$1" marginTop="$1">
                      {variation.tags.map((tag, index) => (
                        <Text key={index} fontSize="$1" color={colors.primary}>
                          #{tag.tag}
                        </Text>
                      ))}
                    </XStack>
                  )}
                </YStack>
              </Card>
            ))}
          </YStack>
        </Card>
      )}

      {/* Advanced options */}
      {showAdvancedOptions && (
        <Button
          size="$2"
          backgroundColor="transparent"
          color={colors.textSecondary}
          icon={ChevronDown}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>
      )}

      {showAdvanced && parsedInput && (
        <Card backgroundColor={colors.card} borderRadius="$3" padding="$3">
          <YStack gap="$3">
            <Text fontSize="$3" color={colors.text} fontWeight="600">
              Parsed Information
            </Text>
            <Separator />
            
            <YStack gap="$2">
              <Text fontSize="$2" color={colors.textSecondary}>Base Name:</Text>
              <Text fontSize="$3" color={colors.text}>{parsedInput.baseName}</Text>
            </YStack>

            {parsedInput.equipmentInfo && (
              <YStack gap="$2">
                <Text fontSize="$2" color={colors.textSecondary}>Equipment:</Text>
                <Text fontSize="$3" color={colors.text}>{parsedInput.equipmentInfo}</Text>
              </YStack>
            )}

            {parsedInput.extractedTags.length > 0 && (
              <YStack gap="$2">
                <Text fontSize="$2" color={colors.textSecondary}>Tags:</Text>
                {parsedInput.extractedTags.map((tag: ExerciseTag, index: number) => (
                  <Text key={index} fontSize="$3" color={colors.text}>
                    • {tag.name} ({tag.tag})
                  </Text>
                ))}
              </YStack>
            )}
          </YStack>
        </Card>
      )}
    </YStack>
  );
}
