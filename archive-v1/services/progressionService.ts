// services/progressionService.ts - Exercise progression tracking and analytics
import { supabase } from '../lib/supabase';
import { WorkoutSession, LoggedExercise, ExerciseSet } from '../types/workout';

export interface ExerciseProgression {
  exerciseName: string;
  equipment: {
    category: string;
    subType?: string;
    machineType?: string;
    grip?: string;
  };
  sessions: Array<{
    date: string;
    sets: Array<{
      reps: number;
      weight: number;
      volume: number; // weight * reps
    }>;
    maxWeight: number;
    totalVolume: number;
    avgReps: number;
  }>;
  progression: {
    totalSessions: number;
    firstRecorded: string;
    lastRecorded: string;
    startingWeight: number;
    currentWeight: number;
    maxWeight: number;
    weightProgression: number; // percentage increase
    volumeProgression: number; // percentage increase
    strengthGain: number; // total weight gained
  };
  trends: {
    last4Weeks: 'increasing' | 'decreasing' | 'stable';
    last8Weeks: 'increasing' | 'decreasing' | 'stable';
    overallTrend: 'increasing' | 'decreasing' | 'stable';
    consistencyScore: number; // 0-100
  };
  predictions: {
    next1RM?: number;
    recommendedWeight: number;
    recommendedReps: string; // rep range
    deloadRecommended: boolean;
  };
}

export interface StrengthStandards {
  exerciseName: string;
  bodyweight: number;
  standards: {
    beginner: number;
    novice: number;
    intermediate: number;
    advanced: number;
    elite: number;
  };
  currentLevel: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite';
  percentileRank: number;
}

export interface TrainingLoad {
  date: string;
  totalVolume: number;
  intensityScore: number; // 0-100 based on %1RM
  fatigue: number; // calculated based on volume and intensity
  readiness: number; // recovery indicator
  recommendation: 'increase' | 'maintain' | 'decrease' | 'deload';
}

export interface PerformanceInsight {
  type: 'strength_gain' | 'plateau' | 'regression' | 'consistency' | 'volume_increase' | 'technique_focus';
  exerciseName?: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'critical';
  actionable: boolean;
  recommendations?: string[];
  data?: any;
  createdAt: string;
}

class ProgressionService {
  /**
   * Get comprehensive progression data for a specific exercise
   */
  async getExerciseProgression(
    userId: string, 
    exerciseName: string, 
    equipment?: any
  ): Promise<ExerciseProgression | null> {
    try {
      // Get all workout sessions containing this exercise
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error || !sessions) {
        console.error('Error fetching sessions:', error);
        return null;
      }

      // Filter sessions that contain the exercise
      const exerciseSessions = sessions
        .map(session => {
          const exercises = session.exercises as LoggedExercise[];
          const matchingExercise = exercises.find(ex => 
            ex.exerciseName === exerciseName &&
            (!equipment || this.equipmentMatches(ex.equipment, equipment))
          );
          
          if (matchingExercise) {
            return {
              date: session.date,
              exercise: matchingExercise
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{ date: string; exercise: LoggedExercise }>;

      if (exerciseSessions.length === 0) {
        return null;
      }

      // Process sessions into progression data
      const processedSessions = exerciseSessions.map(({ date, exercise }) => {
        const completedSets = exercise.sets.filter(set => set.completed && set.weight);
        const maxWeight = Math.max(...completedSets.map(set => set.weight || 0));
        const totalVolume = completedSets.reduce((sum, set) => 
          sum + ((set.weight || 0) * set.reps), 0
        );
        const avgReps = completedSets.length > 0 
          ? completedSets.reduce((sum, set) => sum + set.reps, 0) / completedSets.length 
          : 0;

        return {
          date,
          sets: completedSets.map(set => ({
            reps: set.reps,
            weight: set.weight || 0,
            volume: (set.weight || 0) * set.reps
          })),
          maxWeight,
          totalVolume,
          avgReps: Math.round(avgReps)
        };
      });

      // Calculate progression metrics
      const progression = this.calculateProgression(processedSessions);
      const trends = this.calculateTrends(processedSessions);
      const predictions = this.calculatePredictions(processedSessions);

      return {
        exerciseName,
        equipment: exerciseSessions[0].exercise.equipment,
        sessions: processedSessions,
        progression,
        trends,
        predictions
      };
    } catch (error) {
      console.error('Error getting exercise progression:', error);
      return null;
    }
  }

  /**
   * Get all exercise progressions for a user
   */
  async getAllExerciseProgressions(userId: string): Promise<ExerciseProgression[]> {
    try {
      // Get unique exercises from all sessions
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('exercises')
        .eq('user_id', userId);

      if (error || !sessions) {
        return [];
      }

      // Extract unique exercises
      const uniqueExercises = new Map<string, any>();
      sessions.forEach(session => {
        const exercises = session.exercises as LoggedExercise[];
        exercises.forEach(exercise => {
          const key = `${exercise.exerciseName}_${JSON.stringify(exercise.equipment)}`;
          if (!uniqueExercises.has(key)) {
            uniqueExercises.set(key, {
              name: exercise.exerciseName,
              equipment: exercise.equipment
            });
          }
        });
      });

      // Get progression for each unique exercise
      const progressions: ExerciseProgression[] = [];
      for (const exercise of uniqueExercises.values()) {
        const progression = await this.getExerciseProgression(
          userId, 
          exercise.name, 
          exercise.equipment
        );
        if (progression) {
          progressions.push(progression);
        }
      }

      return progressions.sort((a, b) => 
        new Date(b.progression.lastRecorded).getTime() - 
        new Date(a.progression.lastRecorded).getTime()
      );
    } catch (error) {
      console.error('Error getting all progressions:', error);
      return [];
    }
  }

  /**
   * Calculate strength standards for exercises
   */
  async getStrengthStandards(
    userId: string, 
    exerciseName: string, 
    bodyweight: number
  ): Promise<StrengthStandards | null> {
    try {
      // Get current max for the exercise
      const progression = await this.getExerciseProgression(userId, exerciseName);
      if (!progression) return null;

      // Simplified strength standards (would be more comprehensive in real app)
      const baseStandards = this.getBaseStrengthStandards(exerciseName);
      if (!baseStandards) return null;

      const standards = {
        beginner: baseStandards.beginner * bodyweight,
        novice: baseStandards.novice * bodyweight,
        intermediate: baseStandards.intermediate * bodyweight,
        advanced: baseStandards.advanced * bodyweight,
        elite: baseStandards.elite * bodyweight
      };

      const currentMax = progression.progression.maxWeight;
      const currentLevel = this.determineStrengthLevel(currentMax, standards);
      const percentileRank = this.calculatePercentileRank(currentMax, standards);

      return {
        exerciseName,
        bodyweight,
        standards,
        currentLevel,
        percentileRank
      };
    } catch (error) {
      console.error('Error calculating strength standards:', error);
      return null;
    }
  }

  /**
   * Analyze training load and recovery
   */
  async analyzeTrainingLoad(userId: string, days: number = 30): Promise<TrainingLoad[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true });

      if (error || !sessions) {
        return [];
      }

      return sessions.map(session => {
        const exercises = session.exercises as LoggedExercise[];
        const totalVolume = exercises.reduce((sessionVolume, exercise) => 
          sessionVolume + exercise.sets
            .filter(set => set.completed && set.weight)
            .reduce((exerciseVolume, set) => 
              exerciseVolume + ((set.weight || 0) * set.reps), 0
            ), 0
        );

        // Simplified intensity score calculation
        const intensityScore = this.calculateIntensityScore(exercises);
        const fatigue = this.calculateFatigue(totalVolume, intensityScore);
        const readiness = this.calculateReadiness(fatigue);
        const recommendation = this.getTrainingRecommendation(fatigue, readiness);

        return {
          date: session.date,
          totalVolume,
          intensityScore,
          fatigue,
          readiness,
          recommendation
        };
      });
    } catch (error) {
      console.error('Error analyzing training load:', error);
      return [];
    }
  }

  /**
   * Generate performance insights and recommendations
   */
  async generatePerformanceInsights(userId: string): Promise<PerformanceInsight[]> {
    try {
      const progressions = await this.getAllExerciseProgressions(userId);
      const insights: PerformanceInsight[] = [];

      // Analyze each exercise progression
      progressions.forEach(progression => {
        // Check for plateaus
        if (progression.trends.last4Weeks === 'stable' && 
            progression.progression.totalSessions > 4) {
          insights.push({
            type: 'plateau',
            exerciseName: progression.exerciseName,
            title: `Plateau Detected: ${progression.exerciseName}`,
            description: `No progress in the last 4 weeks. Consider changing rep ranges, adding volume, or taking a deload.`,
            severity: 'warning',
            actionable: true,
            recommendations: [
              'Try a different rep range',
              'Increase training volume gradually',
              'Focus on form and technique',
              'Consider a deload week'
            ],
            createdAt: new Date().toISOString()
          });
        }

        // Check for consistent strength gains
        if (progression.progression.weightProgression > 10 && 
            progression.trends.overallTrend === 'increasing') {
          insights.push({
            type: 'strength_gain',
            exerciseName: progression.exerciseName,
            title: `Great Progress: ${progression.exerciseName}`,
            description: `You've increased your strength by ${progression.progression.weightProgression.toFixed(1)}%! Keep up the excellent work.`,
            severity: 'success',
            actionable: false,
            data: { progressionPercentage: progression.progression.weightProgression },
            createdAt: new Date().toISOString()
          });
        }

        // Check for regression
        if (progression.trends.last4Weeks === 'decreasing') {
          insights.push({
            type: 'regression',
            exerciseName: progression.exerciseName,
            title: `Performance Decline: ${progression.exerciseName}`,
            description: `Performance has decreased recently. Consider reviewing technique, rest, or nutrition.`,
            severity: 'critical',
            actionable: true,
            recommendations: [
              'Review exercise form and technique',
              'Ensure adequate rest between sessions',
              'Check nutrition and hydration',
              'Consider reducing training load temporarily'
            ],
            createdAt: new Date().toISOString()
          });
        }

        // Check consistency
        if (progression.trends.consistencyScore < 60) {
          insights.push({
            type: 'consistency',
            exerciseName: progression.exerciseName,
            title: `Inconsistent Training: ${progression.exerciseName}`,
            description: `More consistent training could improve your progress. Try to maintain regular sessions.`,
            severity: 'info',
            actionable: true,
            recommendations: [
              'Schedule regular workout times',
              'Set smaller, achievable goals',
              'Track your consistency',
              'Find accountability partners'
            ],
            createdAt: new Date().toISOString()
          });
        }
      });

      return insights.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  // Private helper methods

  private equipmentMatches(equipment1: any, equipment2: any): boolean {
    return equipment1.category === equipment2.category &&
           equipment1.subType === equipment2.subType &&
           equipment1.machineType === equipment2.machineType &&
           equipment1.grip === equipment2.grip;
  }

  private calculateProgression(sessions: any[]) {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        firstRecorded: '',
        lastRecorded: '',
        startingWeight: 0,
        currentWeight: 0,
        maxWeight: 0,
        weightProgression: 0,
        volumeProgression: 0,
        strengthGain: 0
      };
    }

    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    const maxWeight = Math.max(...sessions.map(s => s.maxWeight));
    
    const startingWeight = firstSession.maxWeight;
    const currentWeight = lastSession.maxWeight;
    const weightProgression = startingWeight > 0 
      ? ((currentWeight - startingWeight) / startingWeight) * 100 
      : 0;

    const firstVolume = firstSession.totalVolume;
    const lastVolume = lastSession.totalVolume;
    const volumeProgression = firstVolume > 0 
      ? ((lastVolume - firstVolume) / firstVolume) * 100 
      : 0;

    return {
      totalSessions: sessions.length,
      firstRecorded: firstSession.date,
      lastRecorded: lastSession.date,
      startingWeight,
      currentWeight,
      maxWeight,
      weightProgression,
      volumeProgression,
      strengthGain: currentWeight - startingWeight
    };
  }

  private calculateTrends(sessions: any[]) {
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

    const last4WeeksSessions = sessions.filter(s => new Date(s.date) >= fourWeeksAgo);
    const last8WeeksSessions = sessions.filter(s => new Date(s.date) >= eightWeeksAgo);

    const last4WeeksTrend = this.calculateTrendDirection(last4WeeksSessions);
    const last8WeeksTrend = this.calculateTrendDirection(last8WeeksSessions);
    const overallTrend = this.calculateTrendDirection(sessions);

    // Calculate consistency score based on frequency
    const expectedSessions = Math.min(sessions.length, 12); // 3x per week for 4 weeks
    const actualSessions = last4WeeksSessions.length;
    const consistencyScore = expectedSessions > 0 
      ? Math.min(100, (actualSessions / expectedSessions) * 100) 
      : 0;

    return {
      last4Weeks: last4WeeksTrend,
      last8Weeks: last8WeeksTrend,
      overallTrend,
      consistencyScore: Math.round(consistencyScore)
    };
  }

  private calculateTrendDirection(sessions: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (sessions.length < 2) return 'stable';

    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.maxWeight, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.maxWeight, 0) / secondHalf.length;

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  private calculatePredictions(sessions: any[]) {
    if (sessions.length === 0) {
      return {
        recommendedWeight: 0,
        recommendedReps: '8-10',
        deloadRecommended: false
      };
    }

    const lastSession = sessions[sessions.length - 1];
    const currentMax = lastSession.maxWeight;
    
    // Simple progressive overload recommendation
    const recommendedWeight = Math.round(currentMax * 1.025); // 2.5% increase
    
    // Check if deload is recommended (simplified logic)
    const recentSessions = sessions.slice(-3);
    const hasPlateaued = recentSessions.every(s => 
      Math.abs(s.maxWeight - currentMax) / currentMax < 0.05
    );
    
    return {
      next1RM: Math.round(currentMax * 1.3), // Rough 1RM estimate
      recommendedWeight,
      recommendedReps: '6-8',
      deloadRecommended: hasPlateaued && sessions.length > 6
    };
  }

  private getBaseStrengthStandards(exerciseName: string) {
    // Simplified strength standards as multipliers of bodyweight
    const standards: { [key: string]: any } = {
      'Bench Press': {
        beginner: 0.5,
        novice: 0.75,
        intermediate: 1.0,
        advanced: 1.25,
        elite: 1.5
      },
      'Squat': {
        beginner: 0.75,
        novice: 1.0,
        intermediate: 1.25,
        advanced: 1.75,
        elite: 2.0
      },
      'Deadlift': {
        beginner: 1.0,
        novice: 1.25,
        intermediate: 1.5,
        advanced: 2.0,
        elite: 2.5
      }
    };

    return standards[exerciseName] || null;
  }

  private determineStrengthLevel(currentMax: number, standards: any): any {
    if (currentMax >= standards.elite) return 'elite';
    if (currentMax >= standards.advanced) return 'advanced';
    if (currentMax >= standards.intermediate) return 'intermediate';
    if (currentMax >= standards.novice) return 'novice';
    return 'beginner';
  }

  private calculatePercentileRank(currentMax: number, standards: any): number {
    const levels = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];
    const values = levels.map(level => standards[level]);
    
    for (let i = 0; i < values.length - 1; i++) {
      if (currentMax >= values[i] && currentMax < values[i + 1]) {
        const progress = (currentMax - values[i]) / (values[i + 1] - values[i]);
        return Math.round((i + progress) * 20); // Each level is 20 percentile points
      }
    }
    
    return currentMax >= values[values.length - 1] ? 100 : 0;
  }

  private calculateIntensityScore(exercises: LoggedExercise[]): number {
    // Simplified intensity calculation based on weight relative to estimated max
    let totalIntensity = 0;
    let totalSets = 0;

    exercises.forEach(exercise => {
      exercise.sets.filter(set => set.completed && set.weight).forEach(set => {
        // Rough %1RM calculation using Epley formula
        const estimated1RM = (set.weight || 0) * (1 + set.reps / 30);
        const intensity = ((set.weight || 0) / estimated1RM) * 100;
        totalIntensity += intensity;
        totalSets++;
      });
    });

    return totalSets > 0 ? totalIntensity / totalSets : 0;
  }

  private calculateFatigue(volume: number, intensity: number): number {
    // Simplified fatigue calculation
    return Math.min(100, (volume / 1000) * 0.3 + intensity * 0.7);
  }

  private calculateReadiness(fatigue: number): number {
    return Math.max(0, 100 - fatigue);
  }

  private getTrainingRecommendation(fatigue: number, readiness: number): 'increase' | 'maintain' | 'decrease' | 'deload' {
    if (fatigue > 80 || readiness < 20) return 'deload';
    if (fatigue > 60 || readiness < 40) return 'decrease';
    if (fatigue < 40 && readiness > 70) return 'increase';
    return 'maintain';
  }
}

export const progressionService = new ProgressionService();