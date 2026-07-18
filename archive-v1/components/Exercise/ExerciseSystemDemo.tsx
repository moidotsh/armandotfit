// components/Exercise/ExerciseSystemDemo.tsx
// Demo component showing integrated exercise categorization system

import React, { useState } from 'react';
import { YStack, XStack, Text, Card, Button, ScrollView, Separator, Tabs } from 'tamagui';
import { Play, Plus, Search, Database, Settings } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { SmartExerciseInput } from './SmartExerciseInput';
import { CustomExerciseCreator } from './CustomExerciseCreator';
import { ExerciseDatabaseBrowser } from './ExerciseDatabaseBrowser';
import { EquipmentRegistry } from '../Equipment/EquipmentRegistry';
import { ExerciseInstance, EquipmentRegistry as EquipmentRegistryType } from '../../types/exercise';

export function ExerciseSystemDemo() {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const [activeTab, setActiveTab] = useState('input');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInstance | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentRegistryType | null>(null);

  // Mock gym ID - in a real app, this would come from user context
  const mockGymId = 'gym-demo-123';

  const handleExerciseSelect = (instance: ExerciseInstance) => {
    setSelectedExercise(instance);
    console.log('Selected exercise:', instance);
  };

  const handleEquipmentSelect = (equipment: EquipmentRegistryType) => {
    setSelectedEquipment(equipment);
    console.log('Selected equipment:', equipment);
  };

  const handleCreateExercise = (name: string) => {
    setActiveTab('creator');
    console.log('Creating exercise:', name);
  };

  return (
    <YStack flex={1} backgroundColor={colors.background}>
      <Card backgroundColor={colors.card} borderRadius="$4" margin="$3" padding="$4">
        <Text fontSize="$5" color={colors.text} fontWeight="700" textAlign="center">
          Exercise Categorization System Demo
        </Text>
        <Text fontSize="$2" color={colors.textSecondary} textAlign="center" marginTop="$2">
          Enhanced exercise tracking with equipment differentiation and smart input
        </Text>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        flexDirection="column"
        backgroundColor={colors.background}
        marginHorizontal="$3"
      >
        <Tabs.List
          backgroundColor={colors.card}
          borderRadius="$3"
          padding="$1"
          marginBottom="$3"
        >
          <Tabs.Tab
            value="input"
            backgroundColor={activeTab === 'input' ? colors.primary : 'transparent'}
            borderRadius="$2"
            flex={1}
          >
            <XStack justifyContent="center" alignItems="center" gap="$1">
              <Search size={16} color={activeTab === 'input' ? 'white' : colors.text} />
              <Text color={activeTab === 'input' ? 'white' : colors.text}>
                Smart Input
              </Text>
            </XStack>
          </Tabs.Tab>

          <Tabs.Tab
            value="browser"
            backgroundColor={activeTab === 'browser' ? colors.primary : 'transparent'}
            borderRadius="$2"
            flex={1}
          >
            <XStack justifyContent="center" alignItems="center" gap="$1">
              <Database size={16} color={activeTab === 'browser' ? 'white' : colors.text} />
              <Text color={activeTab === 'browser' ? 'white' : colors.text}>
                Browser
              </Text>
            </XStack>
          </Tabs.Tab>

          <Tabs.Tab
            value="creator"
            backgroundColor={activeTab === 'creator' ? colors.primary : 'transparent'}
            borderRadius="$2"
            flex={1}
          >
            <XStack justifyContent="center" alignItems="center" gap="$1">
              <Plus size={16} color={activeTab === 'creator' ? 'white' : colors.text} />
              <Text color={activeTab === 'creator' ? 'white' : colors.text}>
                Creator
              </Text>
            </XStack>
          </Tabs.Tab>

          <Tabs.Tab
            value="equipment"
            backgroundColor={activeTab === 'equipment' ? colors.primary : 'transparent'}
            borderRadius="$2"
            flex={1}
          >
            <XStack justifyContent="center" alignItems="center" gap="$1">
              <Settings size={16} color={activeTab === 'equipment' ? 'white' : colors.text} />
              <Text color={activeTab === 'equipment' ? 'white' : colors.text}>
                Equipment
              </Text>
            </XStack>
          </Tabs.Tab>
        </Tabs.List>

        <YStack flex={1}>
          <Tabs.Content value="input">
            <YStack gap="$4" padding="$3">
              <Card backgroundColor={colors.card} borderRadius="$3" padding="$4">
                <Text fontSize="$3" color={colors.text} fontWeight="600" marginBottom="$3">
                  Smart Exercise Input
                </Text>
                <Text fontSize="$1" color={colors.textSecondary} marginBottom="$3">
                  Try entering exercises with variations and equipment identifiers:
                </Text>
                <XStack flexWrap="wrap" gap="$1" marginBottom="$3">
                  <Text fontSize="$1" color={colors.primary} padding="$1" backgroundColor={colors.primary + '20'} borderRadius="$1">
                    Bench Press WIDE LF-CP1
                  </Text>
                  <Text fontSize="$1" color={colors.primary} padding="$1" backgroundColor={colors.primary + '20'} borderRadius="$1">
                    Squat ECC SUMO
                  </Text>
                  <Text fontSize="$1" color={colors.primary} padding="$1" backgroundColor={colors.primary + '20'} borderRadius="$1">
                    Deadlift CHAIN
                  </Text>
                </XStack>

                <SmartExerciseInput
                  onExerciseSelect={handleExerciseSelect}
                  onExerciseCreate={handleCreateExercise}
                  gymId={mockGymId}
                  autoFocus
                  showAdvancedOptions={true}
                />
              </Card>

              {selectedExercise && (
                <Card backgroundColor={colors.card} borderRadius="$3" padding="$4">
                  <Text fontSize="$3" color={colors.text} fontWeight="600" marginBottom="$3">
                    Selected Exercise Instance
                  </Text>
                  <YStack gap="$2">
                    <Text fontSize="$2" color={colors.text}>
                      Base Exercise ID: {selectedExercise.baseExerciseId}
                    </Text>
                    {selectedExercise.variationId && (
                      <Text fontSize="$2" color={colors.text}>
                        Variation: {selectedExercise.variationId}
                      </Text>
                    )}
                    {selectedExercise.customEquipment && (
                      <Text fontSize="$2" color={colors.text}>
                        Equipment: {selectedExercise.customEquipment}
                      </Text>
                    )}
                    {selectedExercise.parsedTags && selectedExercise.parsedTags.length > 0 && (
                      <XStack gap="$1" flexWrap="wrap">
                        {selectedExercise.parsedTags.map((tag, index) => (
                          <Text key={index} fontSize="$1" color={colors.primary} padding="$1" backgroundColor={colors.primary + '20'} borderRadius="$1">
                            {tag.tag}
                          </Text>
                        ))}
                      </XStack>
                    )}
                    <Text fontSize="$2" color={colors.text}>
                      Sets: {selectedExercise.sets} | Reps: {selectedExercise.reps}
                    </Text>
                  </YStack>
                </Card>
              )}
            </YStack>
          </Tabs.Content>

          <Tabs.Content value="browser">
            <YStack padding="$3">
              <ExerciseDatabaseBrowser
                onExerciseSelect={(exercise) => {
                  console.log('Exercise selected from browser:', exercise);
                }}
                showCreateButton={true}
                allowSelection={true}
              />
            </YStack>
          </Tabs.Content>

          <Tabs.Content value="creator">
            <YStack padding="$3">
              <CustomExerciseCreator
                onExerciseCreated={(exerciseId) => {
                  console.log('Custom exercise created:', exerciseId);
                  setActiveTab('browser');
                }}
                onCancel={() => setActiveTab('input')}
              />
            </YStack>
          </Tabs.Content>

          <Tabs.Content value="equipment">
            <YStack padding="$3">
              <EquipmentRegistry
                gymId={mockGymId}
                onEquipmentSelect={handleEquipmentSelect}
                showSelection={false}
                allowManagement={true}
              />

              {selectedEquipment && (
                <Card backgroundColor={colors.card} borderRadius="$3" padding="$4" marginTop="$3">
                  <Text fontSize="$3" color={colors.text} fontWeight="600" marginBottom="$3">
                    Selected Equipment
                  </Text>
                  <YStack gap="$2">
                    <Text fontSize="$2" color={colors.text}>
                      ID: {selectedEquipment.id}
                    </Text>
                    <Text fontSize="$2" color={colors.text}>
                      Type: {selectedEquipment.baseEquipment.category.replace('_', ' ')}
                    </Text>
                    {selectedEquipment.manufacturer && (
                      <Text fontSize="$2" color={colors.text}>
                        Manufacturer: {selectedEquipment.manufacturer}
                      </Text>
                    )}
                    {selectedEquipment.customIdentifier && (
                      <Text fontSize="$2" color={colors.text}>
                        Custom ID: {selectedEquipment.customIdentifier}
                      </Text>
                    )}
                    {selectedEquipment.location && (
                      <Text fontSize="$2" color={colors.text}>
                        Location: {selectedEquipment.location}
                      </Text>
                    )}
                    {selectedEquipment.weightRatio && selectedEquipment.weightRatio !== 1 && (
                      <Text fontSize="$2" color={colors.text}>
                        Weight Ratio: {selectedEquipment.weightRatio}x
                      </Text>
                    )}
                  </YStack>
                </Card>
              )}
            </YStack>
          </Tabs.Content>
        </YStack>
      </Tabs>

      <Card backgroundColor={colors.card} borderRadius="$4" margin="$3" padding="$4">
        <Text fontSize="$3" color={colors.text} fontWeight="600" marginBottom="$2">
          Features Demonstrated
        </Text>
        <YStack gap="$1">
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$1" color={colors.primary}>✓</Text>
            <Text fontSize="$1" color={colors.text}>Smart input parsing with tag recognition</Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$1" color={colors.primary}>✓</Text>
            <Text fontSize="$1" color={colors.text}>Equipment manufacturer differentiation</Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$1" color={colors.primary}>✓</Text>
            <Text fontSize="$1" color={colors.text}>Exercise variations and custom tags</Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$1" color={colors.primary}>✓</Text>
            <Text fontSize="$1" color={colors.text}>Gym-specific equipment registry</Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$1" color={colors.primary}>✓</Text>
            <Text fontSize="$1" color={colors.text}>Enhanced filtering and search</Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$1" color={colors.primary}>✓</Text>
            <Text fontSize="$1" color={colors.text}>Custom exercise creation</Text>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
