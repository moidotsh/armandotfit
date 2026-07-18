// components/Equipment/EquipmentRegistry.tsx
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Card, Button, Input, Select, ScrollView, Separator, Image } from 'tamagui';
import { Plus, Edit, Trash2, Camera, Check, X, MapPin, Package } from '@tamagui/lucide-icons';
import { useAppTheme } from '../ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { exerciseService } from '../../services/exerciseService';
import { 
  EquipmentRegistry, 
  Equipment
} from '../../types/exercise';
import { 
  EquipmentCategory, 
  MachineType,
  FreeWeightType,
  StationType,
  CableAttachment
} from '../../constants/equipmentTypes';
import { 
  EquipmentCategory as EquipmentCategoryEnum,
  createEquipment,
  CommonEquipment
} from '../../constants/equipmentTypes';

interface EquipmentRegistryProps {
  gymId: string;
  onEquipmentSelect?: (equipment: EquipmentRegistry) => void;
  showSelection?: boolean;
  allowManagement?: boolean;
}

export function EquipmentRegistry({
  gymId,
  onEquipmentSelect,
  showSelection = false,
  allowManagement = true
}: EquipmentRegistryProps) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentRegistry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    equipment: 'dumbbell',
    model: '',
    customIdentifier: '',
    location: '',
    notes: '',
    weightRatio: 1.0,
    photo: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof equipmentOptions>('FreeWeight');

  useEffect(() => {
    loadEquipment();
  }, [gymId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const equipmentList = await exerciseService.getGymEquipment(gymId);
      setEquipment(equipmentList);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEquipment = async () => {
    if (!user?.id) return;

    try {
      const equipmentData: Omit<EquipmentRegistry, 'id' | 'createdAt' | 'updatedAt'> = {
        gymId,
        baseEquipment: createEquipment('FreeWeight' as any), // Will be updated based on equipment selection
        model: formData.model.trim() || undefined,
        customIdentifier: formData.customIdentifier.trim() || undefined,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        weightRatio: formData.weightRatio,
        photo: formData.photo.trim() || undefined,
        isActive: true
      };

      const result = await exerciseService.upsertEquipmentRegistry(equipmentData);
      
      if (result.success) {
        setShowAddForm(false);
        setEditingEquipment(null);
        resetForm();
        loadEquipment();
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!user?.id) return;

    try {
      // In a real implementation, you'd have a delete method
      // For now, we'll just mark it as inactive
      const result = await exerciseService.upsertEquipmentRegistry({
        gymId,
        baseEquipment: equipment.find(e => e.id === equipmentId)!.baseEquipment,
        isActive: false
      });
      
      if (result.success) {
        loadEquipment();
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      equipment: 'dumbbell',
      model: '',
      customIdentifier: '',
      location: '',
      notes: '',
      weightRatio: 1.0,
      photo: ''
    });
  };

  const startEdit = (equipmentItem: EquipmentRegistry) => {
    setEditingEquipment(equipmentItem);
    setFormData({
      equipment: 'dumbbell', // Default, could be improved to map from existing equipment
      model: equipmentItem.model || '',
      customIdentifier: equipmentItem.customIdentifier || '',
      location: equipmentItem.location || '',
      notes: equipmentItem.notes || '',
      weightRatio: equipmentItem.weightRatio || 1.0,
      photo: equipmentItem.photo || ''
    });
    setShowAddForm(true);
  };

  const equipmentCategories = Object.values(EquipmentCategoryEnum);

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

  const renderEquipmentCard = (equipmentItem: EquipmentRegistry) => (
    <Card
      key={equipmentItem.id}
      backgroundColor={colors.card}
      borderRadius="$3"
      padding="$3"
      marginVertical="$1"
    >
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1}>
            <Text fontSize="$3" color={colors.text} fontWeight="600">
              {equipmentItem.customIdentifier || `${equipmentItem.baseEquipment.category.replace('_', ' ')}`}
            </Text>
            
            {equipmentItem.model && (
              <Text fontSize="$2" color={colors.textSecondary}>
                Model: {equipmentItem.model}
              </Text>
            )}
            
            <XStack gap="$2" alignItems="center" marginTop="$1">
              <Package size="$1" color={colors.textSecondary} />
              <Text fontSize="$1" color={colors.textSecondary}>
                {equipmentItem.baseEquipment.category.replace('_', ' ')}
              </Text>
            </XStack>

            {equipmentItem.location && (
              <XStack gap="$1" alignItems="center" marginTop="$1">
                <MapPin size="$1" color={colors.textSecondary} />
                <Text fontSize="$1" color={colors.textSecondary}>
                  {equipmentItem.location}
                </Text>
              </XStack>
            )}

            {equipmentItem.weightRatio && equipmentItem.weightRatio !== 1 && (
              <Text fontSize="$1" color={colors.textSecondary} marginTop="$1">
                Weight Ratio: {equipmentItem.weightRatio}x
              </Text>
            )}
          </YStack>

          {allowManagement && (
            <XStack gap="$2">
              <Button
                size="$2"
                circular
                icon={Edit}
                backgroundColor="transparent"
                color={colors.textSecondary}
                onPress={() => startEdit(equipmentItem)}
              />
              <Button
                size="$2"
                circular
                icon={Trash2}
                backgroundColor="transparent"
                color={colors.textSecondary}
                onPress={() => handleDeleteEquipment(equipmentItem.id)}
              />
            </XStack>
          )}
        </XStack>

        {showSelection && (
          <Button
            size="$2"
            backgroundColor={colors.primary}
            color="white"
            onPress={() => onEquipmentSelect?.(equipmentItem)}
          >
            Select Equipment
          </Button>
        )}
      </YStack>
    </Card>
  );

  if (showAddForm) {
    return (
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$4" color={colors.text} fontWeight="600">
            {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
          </Text>
          <Button
            size="$2"
            circular
            icon={X}
            backgroundColor="transparent"
            color={colors.textSecondary}
            onPress={() => {
              setShowAddForm(false);
              setEditingEquipment(null);
              resetForm();
            }}
          />
        </XStack>

        <Card backgroundColor={colors.card} borderRadius="$3" padding="$4">
          <YStack gap="$3">
            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Equipment Category</Text>
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
                      setFormData(prev => ({ ...prev, equipment: '' }));
                    }}
                  >
                    {category.replace('_', ' ')}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Equipment Type</Text>
              <XStack flexWrap="wrap" gap={spacing.small}>
                {equipmentOptions[selectedCategory].map((option) => (
                  <Button
                    key={option.id}
                    size="$2"
                    theme={formData.equipment === option.id ? 'blue' : undefined}
                    variant={formData.equipment === option.id ? undefined : 'outlined'}
                    onPress={() => setFormData(prev => ({ ...prev, equipment: option.id }))}
                  >
                    {option.name}
                  </Button>
                ))}
              </XStack>
            </YStack>

            

            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Custom Identifier</Text>
              <Input
                value={formData.customIdentifier}
                onChangeText={(text) => setFormData(prev => ({ ...prev, customIdentifier: text }))}
                placeholder="e.g., CP-1, DL-2"
                backgroundColor={colors.inputBackground}
                borderColor={colors.border}
                color={colors.text}
              />
            </YStack>

            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Model</Text>
              <Input
                value={formData.model}
                onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}
                placeholder="e.g., Signature Series"
                backgroundColor={colors.inputBackground}
                borderColor={colors.border}
                color={colors.text}
              />
            </YStack>

            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Location</Text>
              <Input
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="e.g., Near entrance, Cardio area"
                backgroundColor={colors.inputBackground}
                borderColor={colors.border}
                color={colors.text}
              />
            </YStack>

            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Weight Ratio</Text>
              <Input
                value={formData.weightRatio.toString()}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  weightRatio: parseFloat(text) || 1.0 
                }))}
                placeholder="1.0"
                keyboardType="numeric"
                backgroundColor={colors.inputBackground}
                borderColor={colors.border}
                color={colors.text}
              />
              <Text fontSize="$1" color={colors.textSecondary} marginTop="$1">
                Adjustment factor for weight differences between equipment
              </Text>
            </YStack>

            <YStack>
              <Text fontSize="$2" color={colors.textSecondary}>Notes</Text>
              <Input
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes about this equipment"
                multiline
                backgroundColor={colors.inputBackground}
                borderColor={colors.border}
                color={colors.text}
                minHeight={80}
              />
            </YStack>

            <XStack gap="$2">
              <Button
                flex={1}
                backgroundColor={colors.primary}
                color="white"
                onPress={handleSaveEquipment}
              >
                <Check size="$1" />
                Save Equipment
              </Button>
              <Button
                flex={1}
                variant="outlined"
                onPress={() => {
                  setShowAddForm(false);
                  setEditingEquipment(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    );
  }

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" color={colors.text} fontWeight="600">
          Equipment Registry
        </Text>
        {allowManagement && (
          <Button
            size="$3"
            backgroundColor={colors.primary}
            color="white"
            icon={Plus}
            onPress={() => setShowAddForm(true)}
          >
            Add Equipment
          </Button>
        )}
      </XStack>

      {loading ? (
        <Text>Loading equipment...</Text>
      ) : equipment.length === 0 ? (
        <Card backgroundColor={colors.card} borderRadius="$3" padding="$4">
          <Text color={colors.textSecondary} textAlign="center">
            No equipment registered for this gym.
          </Text>
          {allowManagement && (
            <Button
              marginTop="$3"
              backgroundColor={colors.primary}
              color="white"
              icon={Plus}
              onPress={() => setShowAddForm(true)}
            >
              Add First Equipment
            </Button>
          )}
        </Card>
      ) : (
        <ScrollView maxHeight={400}>
          <YStack gap="$1">
            {equipment.map(renderEquipmentCard)}
          </YStack>
        </ScrollView>
      )}
    </YStack>
  );
}
