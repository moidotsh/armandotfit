// services/exerciseService.ts - Exercise database and management service
import { supabase } from '../lib/supabase';
import { 
  ExerciseTemplate, 
  ExerciseCategory, 
  ExerciseEquipment,
  RepRange,
  GripType
} from '../types/workout';

export interface ExerciseVariation {
  id: string;
  baseExerciseId: string;
  name: string;
  description: string;
  equipment: ExerciseEquipment;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  progressions: string[];
  regressions: string[];
  isCustom: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  category: 'primary' | 'secondary';
  bodyPart: 'upper' | 'lower' | 'core';
  commonExercises: string[];
}

export interface ExerciseFilter {
  category?: ExerciseCategory[];
  muscleGroups?: string[];
  equipment?: ExerciseCategory[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  isCustom?: boolean;
  searchQuery?: string;
}

export interface ExerciseStats {
  exerciseId: string;
  totalUsers: number;
  avgRating: number;
  totalSessions: number;
  popularEquipment: Array<{
    equipment: ExerciseEquipment;
    usage: number;
  }>;
  commonRepRanges: Array<{
    range: RepRange;
    usage: number;
  }>;
}

class ExerciseService {
  /**
   * Get all exercises with optional filtering
   */
  async getExercises(
    filter?: ExerciseFilter,
    userId?: string
  ): Promise<ExerciseTemplate[]> {
    try {
      let query = supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      // Apply filters
      if (filter?.category && filter.category.length > 0) {
        query = query.in('category', filter.category);
      }

      if (filter?.muscleGroups && filter.muscleGroups.length > 0) {
        query = query.overlaps('muscle_groups', filter.muscleGroups);
      }

      if (filter?.difficulty && filter.difficulty.length > 0) {
        query = query.in('difficulty', filter.difficulty);
      }

      if (filter?.isCustom !== undefined) {
        if (filter.isCustom && userId) {
          query = query.eq('created_by', userId);
        } else if (!filter.isCustom) {
          query = query.is('created_by', null);
        }
      }

      if (filter?.searchQuery) {
        query = query.or(`name.ilike.%${filter.searchQuery}%,description.ilike.%${filter.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching exercises:', error);
        return this.getSystemExercises(filter);
      }

      // Convert database format to app format
      const exercises: ExerciseTemplate[] = data.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        defaultEquipment: exercise.default_equipment,
        muscleGroups: exercise.muscle_groups,
        description: exercise.description,
        instructions: exercise.instructions,
        defaultSets: exercise.default_sets,
        defaultRepRange: exercise.default_rep_range,
        isCustom: !!exercise.created_by
      }));

      // If no database results and no custom filter, return system exercises
      if (exercises.length === 0 && !filter?.isCustom) {
        return this.getSystemExercises(filter);
      }

      return exercises;
    } catch (error) {
      console.error('Error getting exercises:', error);
      return this.getSystemExercises(filter);
    }
  }

  /**
   * Create a custom exercise
   */
  async createCustomExercise(
    exercise: Omit<ExerciseTemplate, 'id' | 'isCustom'>,
    userId: string
  ): Promise<{ success: boolean; exerciseId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: exercise.name,
          category: exercise.category,
          default_equipment: exercise.defaultEquipment,
          muscle_groups: exercise.muscleGroups,
          description: exercise.description,
          instructions: exercise.instructions,
          default_sets: exercise.defaultSets,
          default_rep_range: exercise.defaultRepRange,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating exercise:', error);
        return { success: false, error: error.message };
      }

      return { success: true, exerciseId: data.id };
    } catch (error) {
      console.error('Error creating custom exercise:', error);
      return { success: false, error: 'Failed to create exercise' };
    }
  }

  /**
   * Update a custom exercise
   */
  async updateCustomExercise(
    exerciseId: string,
    updates: Partial<ExerciseTemplate>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          name: updates.name,
          category: updates.category,
          default_equipment: updates.defaultEquipment,
          muscle_groups: updates.muscleGroups,
          description: updates.description,
          instructions: updates.instructions,
          default_sets: updates.defaultSets,
          default_rep_range: updates.defaultRepRange,
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId)
        .eq('created_by', userId);

      if (error) {
        console.error('Error updating exercise:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating custom exercise:', error);
      return { success: false, error: 'Failed to update exercise' };
    }
  }

  /**
   * Delete a custom exercise
   */
  async deleteCustomExercise(
    exerciseId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)
        .eq('created_by', userId);

      if (error) {
        console.error('Error deleting exercise:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting custom exercise:', error);
      return { success: false, error: 'Failed to delete exercise' };
    }
  }

  /**
   * Get exercise variations
   */
  async getExerciseVariations(baseExerciseId: string): Promise<ExerciseVariation[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_variations')
        .select('*')
        .eq('base_exercise_id', baseExerciseId)
        .order('difficulty', { ascending: true });

      if (error) {
        console.error('Error fetching variations:', error);
        return [];
      }

      return data.map(variation => ({
        id: variation.id,
        baseExerciseId: variation.base_exercise_id,
        name: variation.name,
        description: variation.description,
        equipment: variation.equipment,
        difficulty: variation.difficulty,
        targetMuscles: variation.target_muscles,
        secondaryMuscles: variation.secondary_muscles,
        instructions: variation.instructions,
        tips: variation.tips,
        commonMistakes: variation.common_mistakes,
        progressions: variation.progressions,
        regressions: variation.regressions,
        isCustom: !!variation.created_by,
        createdBy: variation.created_by,
        createdAt: variation.created_at
      }));
    } catch (error) {
      console.error('Error getting exercise variations:', error);
      return [];
    }
  }

  /**
   * Create an exercise variation
   */
  async createExerciseVariation(
    variation: Omit<ExerciseVariation, 'id' | 'isCustom' | 'createdAt'>,
    userId: string
  ): Promise<{ success: boolean; variationId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('exercise_variations')
        .insert({
          base_exercise_id: variation.baseExerciseId,
          name: variation.name,
          description: variation.description,
          equipment: variation.equipment,
          difficulty: variation.difficulty,
          target_muscles: variation.targetMuscles,
          secondary_muscles: variation.secondaryMuscles,
          instructions: variation.instructions,
          tips: variation.tips,
          common_mistakes: variation.commonMistakes,
          progressions: variation.progressions,
          regressions: variation.regressions,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating variation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, variationId: data.id };
    } catch (error) {
      console.error('Error creating exercise variation:', error);
      return { success: false, error: 'Failed to create variation' };
    }
  }

  /**
   * Get muscle groups
   */
  getMuscleGroups(): MuscleGroup[] {
    return [
      // Upper Body - Primary
      { id: 'chest', name: 'Chest', category: 'primary', bodyPart: 'upper', commonExercises: ['Bench Press', 'Push-ups', 'Chest Fly'] },
      { id: 'back', name: 'Back', category: 'primary', bodyPart: 'upper', commonExercises: ['Pull-ups', 'Rows', 'Lat Pulldown'] },
      { id: 'shoulders', name: 'Shoulders', category: 'primary', bodyPart: 'upper', commonExercises: ['Shoulder Press', 'Lateral Raises'] },
      { id: 'biceps', name: 'Biceps', category: 'primary', bodyPart: 'upper', commonExercises: ['Bicep Curls', 'Hammer Curls'] },
      { id: 'triceps', name: 'Triceps', category: 'primary', bodyPart: 'upper', commonExercises: ['Tricep Dips', 'Tricep Extensions'] },
      { id: 'forearms', name: 'Forearms', category: 'primary', bodyPart: 'upper', commonExercises: ['Wrist Curls', 'Farmer Walks'] },

      // Lower Body - Primary
      { id: 'quads', name: 'Quadriceps', category: 'primary', bodyPart: 'lower', commonExercises: ['Squats', 'Leg Press', 'Lunges'] },
      { id: 'hamstrings', name: 'Hamstrings', category: 'primary', bodyPart: 'lower', commonExercises: ['Romanian Deadlift', 'Leg Curls'] },
      { id: 'glutes', name: 'Glutes', category: 'primary', bodyPart: 'lower', commonExercises: ['Hip Thrusts', 'Bulgarian Split Squats'] },
      { id: 'calves', name: 'Calves', category: 'primary', bodyPart: 'lower', commonExercises: ['Calf Raises', 'Seated Calf Raises'] },

      // Core
      { id: 'abs', name: 'Abs', category: 'primary', bodyPart: 'core', commonExercises: ['Planks', 'Crunches', 'Leg Raises'] },
      { id: 'obliques', name: 'Obliques', category: 'primary', bodyPart: 'core', commonExercises: ['Side Planks', 'Russian Twists'] },
      { id: 'lower_back', name: 'Lower Back', category: 'primary', bodyPart: 'core', commonExercises: ['Deadlifts', 'Back Extensions'] },

      // Secondary/Stabilizer muscles
      { id: 'rear_delts', name: 'Rear Delts', category: 'secondary', bodyPart: 'upper', commonExercises: ['Face Pulls', 'Reverse Fly'] },
      { id: 'lats', name: 'Lats', category: 'secondary', bodyPart: 'upper', commonExercises: ['Pull-ups', 'Lat Pulldown'] },
      { id: 'rhomboids', name: 'Rhomboids', category: 'secondary', bodyPart: 'upper', commonExercises: ['Rows', 'Shrugs'] },
      { id: 'serratus', name: 'Serratus', category: 'secondary', bodyPart: 'upper', commonExercises: ['Push-ups Plus', 'Overhead Press'] }
    ];
  }

  /**
   * Get exercise statistics
   */
  async getExerciseStats(exerciseId: string): Promise<ExerciseStats> {
    try {
      // Get usage statistics from workout sessions
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('exercises')
        .contains('exercises', [{ exerciseName: exerciseId }]);

      if (error || !sessions) {
        return {
          exerciseId,
          totalUsers: 0,
          avgRating: 0,
          totalSessions: 0,
          popularEquipment: [],
          commonRepRanges: []
        };
      }

      // Analyze usage patterns
      const equipmentUsage = new Map<string, number>();
      const repRangeUsage = new Map<RepRange, number>();
      let totalSessions = 0;

      sessions.forEach(session => {
        const exercises = session.exercises || [];
        exercises.forEach((exercise: any) => {
          if (exercise.exerciseName === exerciseId) {
            totalSessions++;
            
            // Track equipment usage
            const equipmentKey = JSON.stringify(exercise.equipment);
            equipmentUsage.set(equipmentKey, (equipmentUsage.get(equipmentKey) || 0) + 1);
            
            // Track rep range usage
            const repRange = exercise.targetRepRange;
            if (repRange) {
              repRangeUsage.set(repRange, (repRangeUsage.get(repRange) || 0) + 1);
            }
          }
        });
      });

      // Convert to sorted arrays
      const popularEquipment = Array.from(equipmentUsage.entries())
        .map(([equipmentStr, usage]) => ({
          equipment: JSON.parse(equipmentStr),
          usage
        }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 3);

      const commonRepRanges = Array.from(repRangeUsage.entries())
        .map(([range, usage]) => ({ range, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 3);

      return {
        exerciseId,
        totalUsers: new Set(sessions.map(s => s.user_id)).size,
        avgRating: 4.2, // Would calculate from actual ratings
        totalSessions,
        popularEquipment,
        commonRepRanges
      };
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      return {
        exerciseId,
        totalUsers: 0,
        avgRating: 0,
        totalSessions: 0,
        popularEquipment: [],
        commonRepRanges: []
      };
    }
  }

  /**
   * Search exercises with intelligent suggestions
   */
  async searchExercises(
    query: string,
    context?: {
      currentWorkout?: string[];
      targetMuscles?: string[];
      availableEquipment?: ExerciseCategory[];
    }
  ): Promise<ExerciseTemplate[]> {
    try {
      const filter: ExerciseFilter = {
        searchQuery: query,
        equipment: context?.availableEquipment
      };

      const exercises = await this.getExercises(filter);

      // Sort by relevance
      return exercises.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Exact name match bonus
        if (a.name.toLowerCase().includes(query.toLowerCase())) scoreA += 10;
        if (b.name.toLowerCase().includes(query.toLowerCase())) scoreB += 10;

        // Muscle group match bonus
        if (context?.targetMuscles) {
          const aMatches = a.muscleGroups.filter(muscle => 
            context.targetMuscles!.includes(muscle)
          ).length;
          const bMatches = b.muscleGroups.filter(muscle => 
            context.targetMuscles!.includes(muscle)
          ).length;
          scoreA += aMatches * 5;
          scoreB += bMatches * 5;
        }

        // Equipment availability bonus
        if (context?.availableEquipment?.includes(a.category)) scoreA += 3;
        if (context?.availableEquipment?.includes(b.category)) scoreB += 3;

        return scoreB - scoreA;
      });
    } catch (error) {
      console.error('Error searching exercises:', error);
      return [];
    }
  }

  /**
   * Get exercise recommendations
   */
  async getExerciseRecommendations(
    currentExercises: string[],
    targetMuscles: string[],
    equipment: ExerciseCategory[]
  ): Promise<ExerciseTemplate[]> {
    try {
      const filter: ExerciseFilter = {
        equipment,
        muscleGroups: targetMuscles
      };

      const allExercises = await this.getExercises(filter);

      // Filter out already selected exercises
      const availableExercises = allExercises.filter(exercise => 
        !currentExercises.includes(exercise.name)
      );

      // Score exercises based on muscle group coverage
      return availableExercises
        .map(exercise => ({
          ...exercise,
          score: exercise.muscleGroups.filter(muscle => 
            targetMuscles.includes(muscle)
          ).length
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ score, ...exercise }) => exercise);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Private helper methods

  private getSystemExercises(filter?: ExerciseFilter): ExerciseTemplate[] {
    const systemExercises: ExerciseTemplate[] = [
      {
        id: 'system_bench_press',
        name: 'Bench Press',
        category: 'free_weight',
        defaultEquipment: {
          category: 'free_weight',
          subType: 'barbell',
          grip: 'standard'
        },
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        description: 'The king of upper body exercises. Builds chest, triceps, and front deltoids.',
        instructions: [
          'Lie flat on bench with feet planted on floor',
          'Grip bar slightly wider than shoulder-width',
          'Lower bar to chest with control',
          'Press bar up to full arm extension'
        ],
        defaultSets: 3,
        defaultRepRange: '6-8',
        isCustom: false
      },
      {
        id: 'system_squat',
        name: 'Barbell Squat',
        category: 'free_weight',
        defaultEquipment: {
          category: 'free_weight',
          subType: 'barbell'
        },
        muscleGroups: ['quads', 'glutes', 'hamstrings'],
        description: 'The king of lower body exercises. Builds overall leg strength and mass.',
        instructions: [
          'Position bar on upper traps',
          'Stand with feet shoulder-width apart',
          'Squat down by pushing hips back',
          'Drive through heels to stand up'
        ],
        defaultSets: 3,
        defaultRepRange: '6-8',
        isCustom: false
      },
      {
        id: 'system_deadlift',
        name: 'Deadlift',
        category: 'free_weight',
        defaultEquipment: {
          category: 'free_weight',
          subType: 'barbell'
        },
        muscleGroups: ['hamstrings', 'glutes', 'back', 'forearms'],
        description: 'The ultimate full-body strength exercise. Builds posterior chain power.',
        instructions: [
          'Stand with feet hip-width apart',
          'Grip bar with mixed or double overhand grip',
          'Keep back straight, lift by extending hips and knees',
          'Stand tall, then lower with control'
        ],
        defaultSets: 3,
        defaultRepRange: '4-6',
        isCustom: false
      },
      {
        id: 'system_overhead_press',
        name: 'Overhead Press',
        category: 'free_weight',
        defaultEquipment: {
          category: 'free_weight',
          subType: 'barbell'
        },
        muscleGroups: ['shoulders', 'triceps', 'abs'],
        description: 'Builds shoulder strength and stability. Great for overhead power.',
        instructions: [
          'Start with bar at shoulder height',
          'Grip bar slightly wider than shoulders',
          'Press bar straight up overhead',
          'Lower with control to starting position'
        ],
        defaultSets: 3,
        defaultRepRange: '6-8',
        isCustom: false
      },
      {
        id: 'system_pull_ups',
        name: 'Pull-ups',
        category: 'calisthenic',
        defaultEquipment: {
          category: 'calisthenic',
          grip: 'overhand'
        },
        muscleGroups: ['lats', 'biceps', 'rear_delts'],
        description: 'The ultimate upper body pulling exercise. Builds back width and strength.',
        instructions: [
          'Hang from bar with overhand grip',
          'Pull body up until chin clears bar',
          'Lower with control to full extension',
          'Maintain straight body throughout'
        ],
        defaultSets: 3,
        defaultRepRange: '6-8',
        isCustom: false
      }
    ];

    // Apply filters if provided
    if (!filter) return systemExercises;

    return systemExercises.filter(exercise => {
      if (filter.category && !filter.category.includes(exercise.category)) {
        return false;
      }
      
      if (filter.muscleGroups && !filter.muscleGroups.some(muscle => 
        exercise.muscleGroups.includes(muscle)
      )) {
        return false;
      }

      if (filter.searchQuery && !exercise.name.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }
}

export const exerciseService = new ExerciseService();