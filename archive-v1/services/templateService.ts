// services/templateService.ts - Workout templates and routine management
import { supabase } from '../lib/supabase';
import { 
  WorkoutTemplate, 
  ExerciseTemplate, 
  RepRange, 
  ExerciseCategory,
  ExerciseEquipment 
} from '../types/workout';

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting' | 'general';
  templates: WorkoutTemplate[];
  schedule: Array<{
    week: number;
    day: number;
    templateId: string;
    restDay?: boolean;
  }>;
  isCustom: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface TemplateStats {
  templateId: string;
  timesUsed: number;
  avgDuration: number;
  avgVolume: number;
  lastUsed: string;
  completionRate: number; // percentage of exercises completed
}

class TemplateService {
  /**
   * Get all workout templates for a user (custom + system)
   */
  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    try {
      // Get system templates
      const systemTemplates = this.getSystemTemplates();
      
      if (!userId) {
        return systemTemplates;
      }

      // Get user's custom templates from database
      const { data: customTemplates, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching custom templates:', error);
        return systemTemplates;
      }

      // Convert database format to app format
      const userTemplates: WorkoutTemplate[] = customTemplates.map(template => ({
        id: template.id,
        name: template.name,
        splitType: template.split_type,
        day: template.day,
        sessionType: template.session_type,
        exercises: template.exercises.map((ex: any) => ({
          exerciseId: ex.exercise_id,
          order: ex.order,
          sets: ex.sets,
          repRange: ex.rep_range,
          restTime: ex.rest_time,
          equipment: ex.equipment
        })),
        estimatedDuration: template.estimated_duration,
        difficulty: template.difficulty,
        isCustom: true
      }));

      return [...userTemplates, ...systemTemplates];
    } catch (error) {
      console.error('Error getting workout templates:', error);
      return this.getSystemTemplates();
    }
  }

  /**
   * Create a custom workout template
   */
  async createWorkoutTemplate(
    template: Omit<WorkoutTemplate, 'id' | 'isCustom'>,
    userId: string
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .insert({
          name: template.name,
          split_type: template.splitType,
          day: template.day,
          session_type: template.sessionType,
          exercises: template.exercises,
          estimated_duration: template.estimatedDuration,
          difficulty: template.difficulty,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return { success: false, error: error.message };
      }

      return { success: true, templateId: data.id };
    } catch (error) {
      console.error('Error creating workout template:', error);
      return { success: false, error: 'Failed to create template' };
    }
  }

  /**
   * Update a custom workout template
   */
  async updateWorkoutTemplate(
    templateId: string,
    updates: Partial<WorkoutTemplate>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .update({
          name: updates.name,
          exercises: updates.exercises,
          estimated_duration: updates.estimatedDuration,
          difficulty: updates.difficulty,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('created_by', userId);

      if (error) {
        console.error('Error updating template:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating workout template:', error);
      return { success: false, error: 'Failed to update template' };
    }
  }

  /**
   * Delete a custom workout template
   */
  async deleteWorkoutTemplate(
    templateId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', templateId)
        .eq('created_by', userId);

      if (error) {
        console.error('Error deleting template:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting workout template:', error);
      return { success: false, error: 'Failed to delete template' };
    }
  }

  /**
   * Get all workout plans
   */
  async getWorkoutPlans(userId?: string): Promise<WorkoutPlan[]> {
    try {
      // Get system plans
      const systemPlans = this.getSystemPlans();
      
      if (!userId) {
        return systemPlans;
      }

      // Get user's custom plans
      const { data: customPlans, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('created_by', userId);

      if (error) {
        console.error('Error fetching custom plans:', error);
        return systemPlans;
      }

      // Convert database format to app format
      const userPlans: WorkoutPlan[] = customPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        duration: plan.duration,
        difficulty: plan.difficulty,
        goal: plan.goal,
        templates: plan.templates || [],
        schedule: plan.schedule || [],
        isCustom: true,
        createdBy: plan.created_by,
        createdAt: plan.created_at
      }));

      return [...userPlans, ...systemPlans];
    } catch (error) {
      console.error('Error getting workout plans:', error);
      return this.getSystemPlans();
    }
  }

  /**
   * Generate a personalized workout plan
   */
  async generateWorkoutPlan(
    preferences: {
      goal: 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting' | 'general';
      experience: 'beginner' | 'intermediate' | 'advanced';
      daysPerWeek: number;
      sessionDuration: number; // minutes
      equipment: ExerciseCategory[];
      focusAreas?: string[];
    },
    userId?: string
  ): Promise<WorkoutPlan> {
    try {
      // Generate plan based on preferences
      const planName = `${preferences.goal.charAt(0).toUpperCase() + preferences.goal.slice(1)} Plan`;
      const duration = preferences.experience === 'beginner' ? 8 : 12; // weeks

      // Select appropriate templates based on preferences
      const templates = this.generateTemplatesForPlan(preferences);
      const schedule = this.generateScheduleForPlan(templates, preferences.daysPerWeek, duration);

      const plan: WorkoutPlan = {
        id: `generated_${Date.now()}`,
        name: planName,
        description: `A ${duration}-week ${preferences.goal} program designed for ${preferences.experience} level training`,
        duration,
        difficulty: preferences.experience,
        goal: preferences.goal,
        templates,
        schedule,
        isCustom: true,
        createdBy: userId,
        createdAt: new Date().toISOString()
      };

      // Save plan if user is authenticated
      if (userId) {
        await this.saveGeneratedPlan(plan, userId);
      }

      return plan;
    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw error;
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId: string, userId: string): Promise<TemplateStats> {
    try {
      // Get all sessions that used this template
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .contains('template_id', templateId);

      if (error || !sessions) {
        return {
          templateId,
          timesUsed: 0,
          avgDuration: 0,
          avgVolume: 0,
          lastUsed: '',
          completionRate: 0
        };
      }

      const timesUsed = sessions.length;
      const avgDuration = sessions.reduce((sum, s) => sum + s.total_duration, 0) / timesUsed;
      
      // Calculate volume and completion rate
      let totalVolume = 0;
      let totalExercises = 0;
      let completedExercises = 0;

      sessions.forEach(session => {
        const exercises = session.exercises || [];
        exercises.forEach((exercise: any) => {
          totalExercises++;
          const volume = exercise.sets
            ?.filter((set: any) => set.completed && set.weight)
            ?.reduce((sum: number, set: any) => sum + (set.weight * set.reps), 0) || 0;
          totalVolume += volume;
          
          if (exercise.sets?.some((set: any) => set.completed)) {
            completedExercises++;
          }
        });
      });

      const avgVolume = totalVolume / timesUsed;
      const completionRate = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
      const lastUsed = sessions.length > 0 ? sessions[sessions.length - 1].date : '';

      return {
        templateId,
        timesUsed,
        avgDuration: Math.round(avgDuration),
        avgVolume: Math.round(avgVolume),
        lastUsed,
        completionRate: Math.round(completionRate)
      };
    } catch (error) {
      console.error('Error getting template stats:', error);
      return {
        templateId,
        timesUsed: 0,
        avgDuration: 0,
        avgVolume: 0,
        lastUsed: '',
        completionRate: 0
      };
    }
  }

  // Private helper methods

  private getSystemTemplates(): WorkoutTemplate[] {
    return [
      {
        id: 'system_push_1',
        name: 'Push Day - Strength',
        splitType: 'oneADay',
        day: 1,
        exercises: [
          {
            exerciseId: 'bench_press',
            order: 1,
            sets: 5,
            repRange: '4-6',
            restTime: 180,
            equipment: {
              category: 'free_weight',
              subType: 'barbell',
              grip: 'standard'
            }
          },
          {
            exerciseId: 'incline_db_press',
            order: 2,
            sets: 4,
            repRange: '6-8',
            restTime: 120,
            equipment: {
              category: 'free_weight',
              subType: 'dumbbells',
              grip: 'neutral'
            }
          },
          {
            exerciseId: 'shoulder_press',
            order: 3,
            sets: 4,
            repRange: '8-10',
            restTime: 90,
            equipment: {
              category: 'free_weight',
              subType: 'dumbbells'
            }
          },
          {
            exerciseId: 'tricep_dips',
            order: 4,
            sets: 3,
            repRange: '10-12',
            restTime: 60,
            equipment: {
              category: 'calisthenic'
            }
          }
        ],
        estimatedDuration: 75,
        difficulty: 'intermediate',
        isCustom: false
      },
      {
        id: 'system_pull_1',
        name: 'Pull Day - Strength',
        splitType: 'oneADay',
        day: 2,
        exercises: [
          {
            exerciseId: 'deadlift',
            order: 1,
            sets: 5,
            repRange: '4-6',
            restTime: 180,
            equipment: {
              category: 'free_weight',
              subType: 'barbell'
            }
          },
          {
            exerciseId: 'pull_ups',
            order: 2,
            sets: 4,
            repRange: '6-8',
            restTime: 120,
            equipment: {
              category: 'calisthenic',
              grip: 'overhand'
            }
          },
          {
            exerciseId: 'barbell_row',
            order: 3,
            sets: 4,
            repRange: '8-10',
            restTime: 90,
            equipment: {
              category: 'free_weight',
              subType: 'barbell',
              grip: 'overhand'
            }
          },
          {
            exerciseId: 'face_pulls',
            order: 4,
            sets: 3,
            repRange: '12-15',
            restTime: 60,
            equipment: {
              category: 'cables'
            }
          }
        ],
        estimatedDuration: 70,
        difficulty: 'intermediate',
        isCustom: false
      },
      {
        id: 'system_legs_1',
        name: 'Leg Day - Strength',
        splitType: 'oneADay',
        day: 3,
        exercises: [
          {
            exerciseId: 'squat',
            order: 1,
            sets: 5,
            repRange: '4-6',
            restTime: 180,
            equipment: {
              category: 'free_weight',
              subType: 'barbell'
            }
          },
          {
            exerciseId: 'romanian_deadlift',
            order: 2,
            sets: 4,
            repRange: '6-8',
            restTime: 120,
            equipment: {
              category: 'free_weight',
              subType: 'barbell'
            }
          },
          {
            exerciseId: 'bulgarian_split_squat',
            order: 3,
            sets: 3,
            repRange: '10-12',
            restTime: 90,
            equipment: {
              category: 'free_weight',
              subType: 'dumbbells'
            }
          },
          {
            exerciseId: 'calf_raises',
            order: 4,
            sets: 4,
            repRange: '15-20',
            restTime: 60,
            equipment: {
              category: 'machine'
            }
          }
        ],
        estimatedDuration: 80,
        difficulty: 'intermediate',
        isCustom: false
      }
    ];
  }

  private getSystemPlans(): WorkoutPlan[] {
    return [
      {
        id: 'system_ppl',
        name: 'Push Pull Legs',
        description: 'A classic 3-day split focusing on push movements, pull movements, and legs',
        duration: 12,
        difficulty: 'intermediate',
        goal: 'hypertrophy',
        templates: this.getSystemTemplates(),
        schedule: this.generatePPLSchedule(12),
        isCustom: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'system_upper_lower',
        name: 'Upper Lower Split',
        description: 'A 4-day split alternating between upper body and lower body training',
        duration: 8,
        difficulty: 'beginner',
        goal: 'strength',
        templates: [],
        schedule: [],
        isCustom: false,
        createdAt: new Date().toISOString()
      }
    ];
  }

  private generatePPLSchedule(weeks: number) {
    const schedule = [];
    for (let week = 1; week <= weeks; week++) {
      // Push Pull Legs pattern with rest days
      schedule.push(
        { week, day: 1, templateId: 'system_push_1' },
        { week, day: 2, templateId: 'system_pull_1' },
        { week, day: 3, templateId: 'system_legs_1' },
        { week, day: 4, templateId: '', restDay: true },
        { week, day: 5, templateId: 'system_push_1' },
        { week, day: 6, templateId: 'system_pull_1' },
        { week, day: 7, templateId: '', restDay: true }
      );
    }
    return schedule;
  }

  private generateTemplatesForPlan(preferences: any): WorkoutTemplate[] {
    // Simplified template generation based on preferences
    const templates = this.getSystemTemplates();
    
    // Filter templates based on equipment availability
    return templates.filter(template => 
      template.exercises.every(exercise => 
        preferences.equipment.includes(exercise.equipment?.category)
      )
    );
  }

  private generateScheduleForPlan(templates: WorkoutTemplate[], daysPerWeek: number, weeks: number) {
    const schedule = [];
    
    for (let week = 1; week <= weeks; week++) {
      for (let day = 1; day <= 7; day++) {
        if (day <= daysPerWeek) {
          const templateIndex = (day - 1) % templates.length;
          const template = templates[templateIndex];
          schedule.push({
            week,
            day,
            templateId: template?.id || '',
            restDay: !template
          });
        } else {
          schedule.push({
            week,
            day,
            templateId: '',
            restDay: true
          });
        }
      }
    }
    
    return schedule;
  }

  private async saveGeneratedPlan(plan: WorkoutPlan, userId: string): Promise<void> {
    try {
      await supabase
        .from('workout_plans')
        .insert({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          duration: plan.duration,
          difficulty: plan.difficulty,
          goal: plan.goal,
          templates: plan.templates,
          schedule: plan.schedule,
          created_by: userId
        });
    } catch (error) {
      console.error('Error saving generated plan:', error);
    }
  }
}

export const templateService = new TemplateService();