// services/analyticsService.ts - Cloud-based analytics and insights service
import { supabase } from '../lib/supabase';
import { WorkoutSession } from '../context/WorkoutDataContext';

export interface WorkoutAnalytics {
  totalWorkouts: number;
  totalDuration: number; // in minutes
  currentStreak: number;
  bestStreak: number;
  averageWorkoutDuration: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  weeklyGoalProgress: {
    completed: number;
    target: number;
    percentage: number;
  };
  favoriteExercises: string[];
  mostActiveDay: string;
  mostActiveTimeOfDay: 'morning' | 'afternoon' | 'evening';
}

export interface WeeklyProgress {
  week: string; // ISO week string
  workouts: number;
  duration: number;
  goal: number;
  achieved: boolean;
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  totalWorkouts: number;
  totalDuration: number;
  averageDuration: number;
  streakDays: number;
  topExercises: Array<{ exercise: string; count: number }>;
}

export interface ProgressTrend {
  period: 'week' | 'month' | 'quarter';
  data: Array<{
    date: string;
    workouts: number;
    duration: number;
    streak: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

class AnalyticsService {
  /**
   * Get comprehensive analytics for a user
   */
  async getUserAnalytics(userId: string): Promise<WorkoutAnalytics> {
    try {
      // Get all workout sessions for the user
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching workout sessions:', error);
        return this.getDefaultAnalytics();
      }

      if (!sessions || sessions.length === 0) {
        return this.getDefaultAnalytics();
      }

      // Calculate basic metrics
      const totalWorkouts = sessions.length;
      const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
      const averageWorkoutDuration = totalDuration / totalWorkouts;

      // Calculate time-based metrics
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const workoutsThisWeek = sessions.filter(session => 
        new Date(session.date) >= weekStart
      ).length;

      const workoutsThisMonth = sessions.filter(session => 
        new Date(session.date) >= monthStart
      ).length;

      // Calculate streaks
      const { currentStreak, bestStreak } = await this.calculateStreaks(userId);

      // Analyze exercise patterns
      const favoriteExercises = this.calculateFavoriteExercises(sessions);
      const mostActiveDay = this.calculateMostActiveDay(sessions);
      const mostActiveTimeOfDay = this.calculateMostActiveTimeOfDay(sessions);

      // Get user's weekly goal (default to 4 if not set)
      const weeklyGoal = await this.getUserWeeklyGoal(userId);
      const weeklyGoalProgress = {
        completed: workoutsThisWeek,
        target: weeklyGoal,
        percentage: Math.round((workoutsThisWeek / weeklyGoal) * 100)
      };

      return {
        totalWorkouts,
        totalDuration,
        currentStreak,
        bestStreak,
        averageWorkoutDuration: Math.round(averageWorkoutDuration),
        workoutsThisWeek,
        workoutsThisMonth,
        weeklyGoalProgress,
        favoriteExercises,
        mostActiveDay,
        mostActiveTimeOfDay
      };
    } catch (error) {
      console.error('Error calculating user analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  /**
   * Get weekly progress data for charts
   */
  async getWeeklyProgress(userId: string, weeks: number = 12): Promise<WeeklyProgress[]> {
    try {
      const weeklyGoal = await this.getUserWeeklyGoal(userId);
      const progress: WeeklyProgress[] = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('duration')
          .eq('user_id', userId)
          .gte('date', weekStart.toISOString())
          .lte('date', weekEnd.toISOString());

        const workouts = sessions?.length || 0;
        const duration = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0;

        progress.push({
          week: `${weekStart.getFullYear()}-W${this.getWeekNumber(weekStart)}`,
          workouts,
          duration,
          goal: weeklyGoal,
          achieved: workouts >= weeklyGoal
        });
      }

      return progress;
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      return [];
    }
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(userId: string, months: number = 6): Promise<MonthlyStats[]> {
    try {
      const stats: MonthlyStats[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString());

        const totalWorkouts = sessions?.length || 0;
        const totalDuration = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0;
        const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

        // Calculate top exercises for the month
        const exerciseCounts = new Map<string, number>();
        sessions?.forEach(session => {
          session.exercises.forEach((exercise: string) => {
            exerciseCounts.set(exercise, (exerciseCounts.get(exercise) || 0) + 1);
          });
        });

        const topExercises = Array.from(exerciseCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([exercise, count]) => ({ exercise, count }));

        stats.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          totalWorkouts,
          totalDuration,
          averageDuration,
          streakDays: 0, // Would need more complex calculation
          topExercises
        });
      }

      return stats;
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return [];
    }
  }

  /**
   * Get progress trends with analysis
   */
  async getProgressTrends(userId: string, period: 'week' | 'month' | 'quarter' = 'week'): Promise<ProgressTrend> {
    try {
      const periods = period === 'week' ? 8 : period === 'month' ? 6 : 4;
      const data: ProgressTrend['data'] = [];

      for (let i = periods - 1; i >= 0; i--) {
        let startDate: Date;
        let endDate: Date;
        let dateLabel: string;

        if (period === 'week') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - (i * 7) - startDate.getDay());
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          dateLabel = `W${this.getWeekNumber(startDate)}`;
        } else if (period === 'month') {
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - i, 1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          dateLabel = startDate.toLocaleDateString('en-US', { month: 'short' });
        } else {
          // quarter
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - (i * 3), 1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
          dateLabel = `Q${Math.floor(startDate.getMonth() / 3) + 1}`;
        }

        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('duration')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString());

        data.push({
          date: dateLabel,
          workouts: sessions?.length || 0,
          duration: sessions?.reduce((sum, s) => sum + s.duration, 0) || 0,
          streak: 0 // Simplified for now
        });
      }

      // Analyze trend
      const recent = data.slice(-3);
      const older = data.slice(0, 3);
      const recentAvg = recent.reduce((sum, d) => sum + d.workouts, 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + d.workouts, 0) / older.length;
      
      let trend: ProgressTrend['trend'];
      let changePercentage = 0;

      if (olderAvg > 0) {
        changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (changePercentage > 10) trend = 'increasing';
        else if (changePercentage < -10) trend = 'decreasing';
        else trend = 'stable';
      } else {
        trend = recentAvg > 0 ? 'increasing' : 'stable';
      }

      return {
        period,
        data,
        trend,
        changePercentage: Math.round(changePercentage)
      };
    } catch (error) {
      console.error('Error calculating progress trends:', error);
      return {
        period,
        data: [],
        trend: 'stable',
        changePercentage: 0
      };
    }
  }

  /**
   * Update user analytics after workout completion
   */
  async updateAnalyticsAfterWorkout(userId: string, session: WorkoutSession): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update or create daily analytics record
      const { error } = await supabase
        .from('user_analytics')
        .upsert({
          user_id: userId,
          date: today,
          total_workouts: 1,
          total_duration: session.duration,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error updating analytics:', error);
      }

      // Recalculate streaks
      await this.updateUserStreaks(userId);
    } catch (error) {
      console.error('Error updating analytics after workout:', error);
    }
  }

  // Private helper methods

  private async calculateStreaks(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      const { data, error } = await supabase.rpc('calculate_user_streaks', {
        target_user_id: userId
      });

      if (error || !data || data.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
      }

      return {
        currentStreak: data[0].current_streak || 0,
        bestStreak: data[0].best_streak || 0
      };
    } catch (error) {
      console.error('Error calculating streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }

  private calculateFavoriteExercises(sessions: any[]): string[] {
    const exerciseCounts = new Map<string, number>();
    
    sessions.forEach(session => {
      session.exercises.forEach((exercise: string) => {
        exerciseCounts.set(exercise, (exerciseCounts.get(exercise) || 0) + 1);
      });
    });

    return Array.from(exerciseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([exercise]) => exercise);
  }

  private calculateMostActiveDay(sessions: any[]): string {
    const dayCounts = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    sessions.forEach(session => {
      const dayOfWeek = new Date(session.date).getDay();
      const dayName = dayNames[dayOfWeek];
      dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
    });

    if (dayCounts.size === 0) return 'Monday';

    return Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  private calculateMostActiveTimeOfDay(sessions: any[]): 'morning' | 'afternoon' | 'evening' {
    const timeCounts = { morning: 0, afternoon: 0, evening: 0 };
    
    sessions.forEach(session => {
      const hour = new Date(session.date).getHours();
      if (hour < 12) timeCounts.morning++;
      else if (hour < 18) timeCounts.afternoon++;
      else timeCounts.evening++;
    });

    const maxTime = Object.entries(timeCounts).reduce((a, b) => 
      timeCounts[a[0] as keyof typeof timeCounts] > timeCounts[b[0] as keyof typeof timeCounts] ? a : b
    );

    return maxTime[0] as 'morning' | 'afternoon' | 'evening';
  }

  private async getUserWeeklyGoal(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('weekly_goal')
        .eq('id', userId)
        .single();

      return data?.weekly_goal || 4;
    } catch (error) {
      return 4; // Default weekly goal
    }
  }

  private async updateUserStreaks(userId: string): Promise<void> {
    try {
      const { currentStreak, bestStreak } = await this.calculateStreaks(userId);
      
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_analytics')
        .upsert({
          user_id: userId,
          date: today,
          current_streak: currentStreak,
          best_streak: bestStreak,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });
    } catch (error) {
      console.error('Error updating user streaks:', error);
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getDefaultAnalytics(): WorkoutAnalytics {
    return {
      totalWorkouts: 0,
      totalDuration: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageWorkoutDuration: 0,
      workoutsThisWeek: 0,
      workoutsThisMonth: 0,
      weeklyGoalProgress: {
        completed: 0,
        target: 4,
        percentage: 0
      },
      favoriteExercises: [],
      mostActiveDay: 'Monday',
      mostActiveTimeOfDay: 'morning'
    };
  }
}

export const analyticsService = new AnalyticsService();