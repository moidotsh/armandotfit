// hooks/useExerciseFilter.ts
// A custom hook for filtering exercises based on various criteria

import { useState, useMemo } from 'react';
import { Exercise } from '../types/exercise';
import { PrimaryMuscleGroup } from '../constants/muscleGroups';
import { EquipmentCategory } from '../constants/equipmentTypes';

type FilterCriteria = {
  muscleGroups?: PrimaryMuscleGroup[];
  equipmentTypes?: EquipmentCategory[];
  difficulty?: number[];
  searchText?: string;
};

/**
 * A hook for filtering exercises based on various criteria
 * 
 * @param exercises The collection of exercises to filter
 * @returns Filtering utilities and filtered exercises
 */
export function useExerciseFilter(exercises: Record<string, Exercise>) {
  const [filters, setFilters] = useState<FilterCriteria>({
    muscleGroups: [],
    equipmentTypes: [],
    difficulty: [],
    searchText: '',
  });

  // Convert exercises object to array for easier filtering
  const exerciseArray = useMemo(() => {
    return Object.values(exercises);
  }, [exercises]);

  // Apply all active filters to the exercise array
  const filteredExercises = useMemo(() => {
    return exerciseArray.filter(exercise => {
      // Filter by muscle groups
      if (filters.muscleGroups && filters.muscleGroups.length > 0) {
        const hasTargetMuscle = exercise.primaryMuscles.some(muscle => 
          filters.muscleGroups?.includes(muscle)
        ) || exercise.secondaryMuscles.some(muscle => 
          filters.muscleGroups?.includes(muscle)
        );
        
        if (!hasTargetMuscle) return false;
      }
      
      // Filter by equipment types
      if (filters.equipmentTypes && filters.equipmentTypes.length > 0) {
        const hasRequiredEquipment = exercise.equipment.some(eq => 
          filters.equipmentTypes?.includes(eq.category)
        );
        
        if (!hasRequiredEquipment) return false;
      }
      
      // Filter by difficulty
      if (filters.difficulty && filters.difficulty.length > 0 && exercise.difficulty) {
        if (!filters.difficulty.includes(exercise.difficulty)) {
          return false;
        }
      }
      
      // Filter by search text
      if (filters.searchText && filters.searchText.trim() !== '') {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = exercise.name.toLowerCase().includes(searchLower);
        const extraMatch = exercise.extra?.toLowerCase().includes(searchLower) || false;
        const descMatch = exercise.description?.toLowerCase().includes(searchLower) || false;
        
        if (!nameMatch && !extraMatch && !descMatch) {
          return false;
        }
      }
      
      // If it passed all filters, include it
      return true;
    });
  }, [exerciseArray, filters]);

  // Helper functions for setting filters
  const updateMuscleGroupFilters = (muscleGroups: PrimaryMuscleGroup[]) => {
    setFilters(prev => ({ ...prev, muscleGroups }));
  };

  const updateEquipmentFilters = (equipmentTypes: EquipmentCategory[]) => {
    setFilters(prev => ({ ...prev, equipmentTypes }));
  };

  const updateDifficultyFilters = (difficulty: number[]) => {
    setFilters(prev => ({ ...prev, difficulty }));
  };

  const updateSearchText = (searchText: string) => {
    setFilters(prev => ({ ...prev, searchText }));
  };

  const clearAllFilters = () => {
    setFilters({
      muscleGroups: [],
      equipmentTypes: [],
      difficulty: [],
      searchText: '',
    });
  };

  // Return filtered exercises and filter utilities
  return {
    filters,
    filteredExercises,
    updateMuscleGroupFilters,
    updateEquipmentFilters,
    updateDifficultyFilters,
    updateSearchText,
    clearAllFilters,
  };
}