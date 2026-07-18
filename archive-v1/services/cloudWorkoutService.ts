// services/cloudWorkoutService.ts - Cloud-first workout service with offline sync
import { supabase } from '../lib/supabase';
import { WorkoutSession, UserPreferences } from '../context/WorkoutDataContext';
import { localWorkoutService } from '../data/localWorkoutService';

export interface CloudWorkoutSession extends Omit<WorkoutSession, 'id'> {
  id?: string;
  notes?: string;
  isShared?: boolean;
  sharedWith?: string[];
  syncedAt?: string;
}

export interface UserAnalytics {
  id: string;
  userId: string;
  date: string;
  totalWorkouts: number;
  totalDuration: number;
  currentStreak: number;
  bestStreak: number;
  weeklyGoalProgress: {
    completed: number;
    target: number;
  };
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflicts: any[];
  error?: string;
}

class CloudWorkoutService {
  private isOnline: boolean = true;
  private syncQueue: any[] = [];
  private lastSyncTimestamp: string | null = null;

  constructor() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processSyncQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      this.isOnline = navigator.onLine;
    }
  }

  // ==================== WORKOUT SESSIONS ====================

  /**
   * Save a workout session to cloud with offline fallback
   */
  async saveWorkoutSession(
    sessionData: Omit<WorkoutSession, 'id' | 'createdAt'>,
    userId: string
  ): Promise<{ success: boolean; session?: WorkoutSession; error?: string }> {
    const session: CloudWorkoutSession = {
      ...sessionData,
      userId,
      createdAt: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };

    try {
      if (this.isOnline) {
        // Save to cloud first
        const { data, error } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: userId,
            date: session.date,
            split_type: session.splitType,
            day: session.day,
            exercises: session.exercises,
            duration: session.duration,
            notes: session.notes || '',
            is_shared: session.isShared || false,
            shared_with: session.sharedWith || [],
          })
          .select()
          .single();

        if (error) {
          console.error('Cloud save failed, using local fallback:', error);
          return this.saveToLocalFallback(sessionData, userId);
        }

        // Transform cloud data back to app format
        const savedSession: WorkoutSession = {
          id: data.id,
          userId: data.user_id,
          date: data.date,
          splitType: data.split_type,
          day: data.day,
          exercises: data.exercises,
          duration: data.duration,
          createdAt: data.created_at,
        };

        // Update local cache
        await this.updateLocalCache(savedSession);

        return { success: true, session: savedSession };
      } else {
        // Offline: save to local and queue for sync
        return this.saveToLocalFallback(sessionData, userId);
      }
    } catch (error) {
      console.error('Error saving workout session:', error);
      return this.saveToLocalFallback(sessionData, userId);
    }
  }

  /**
   * Get all workout sessions for a user with cloud sync
   */
  async getWorkoutSessions(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ sessions: WorkoutSession[]; hasMore: boolean; error?: string }> {
    try {
      if (this.isOnline) {
        // Fetch from cloud
        let query = supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }
        if (offset) {
          query = query.range(offset, offset + (limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Cloud fetch failed, using local cache:', error);
          return this.getFromLocalCache(userId, limit, offset);
        }

        // Transform cloud data to app format
        const sessions: WorkoutSession[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          date: item.date,
          splitType: item.split_type,
          day: item.day,
          exercises: item.exercises,
          duration: item.duration,
          createdAt: item.created_at,
        }));

        // Update local cache
        await this.updateLocalCacheMultiple(sessions);

        return { 
          sessions, 
          hasMore: data.length === (limit || 50)
        };
      } else {
        // Offline: use local cache
        return this.getFromLocalCache(userId, limit, offset);
      }
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
      return this.getFromLocalCache(userId, limit, offset);
    }
  }

  /**
   * Delete a workout session
   */
  async deleteWorkoutSession(sessionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isOnline) {
        const { error } = await supabase
          .from('workout_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', userId);

        if (error) {
          console.error('Cloud delete failed:', error);
          this.queueForSync('delete', { sessionId, userId });
          return { success: false, error: error.message };
        }

        // Remove from local cache
        await this.removeFromLocalCache(sessionId);
        return { success: true };
      } else {
        // Offline: queue for sync
        this.queueForSync('delete', { sessionId, userId });
        await this.removeFromLocalCache(sessionId);
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting workout session:', error);
      return { success: false, error: 'Failed to delete workout session' };
    }
  }

  // ==================== USER ANALYTICS ====================

  /**
   * Get user analytics with cloud sync
   */
  async getUserAnalytics(userId: string, days: number = 30): Promise<UserAnalytics[]> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('user_analytics')
          .select('*')
          .eq('user_id', userId)
          .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching analytics:', error);
          return [];
        }

        return data.map(item => ({
          id: item.id,
          userId: item.user_id,
          date: item.date,
          totalWorkouts: item.total_workouts,
          totalDuration: item.total_duration,
          currentStreak: item.current_streak,
          bestStreak: item.best_streak,
          weeklyGoalProgress: item.weekly_goal_progress,
        }));
      } else {
        // Offline: return cached analytics or calculate from local data
        return this.calculateLocalAnalytics(userId, days);
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return [];
    }
  }

  /**
   * Calculate and update user streaks
   */
  async updateUserStreaks(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase.rpc('calculate_user_streaks', {
          target_user_id: userId
        });

        if (error) {
          console.error('Error calculating streaks:', error);
          return { currentStreak: 0, bestStreak: 0 };
        }

        return {
          currentStreak: data[0]?.current_streak || 0,
          bestStreak: data[0]?.best_streak || 0,
        };
      } else {
        // Offline: calculate from local data
        return this.calculateLocalStreaks(userId);
      }
    } catch (error) {
      console.error('Error updating streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }

  // ==================== SYNC MANAGEMENT ====================

  /**
   * Sync all pending changes to cloud
   */
  async syncToCloud(userId: string): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, syncedCount: 0, conflicts: [], error: 'Device is offline' };
    }

    try {
      let syncedCount = 0;
      const conflicts: any[] = [];

      // Process sync queue
      for (const operation of this.syncQueue) {
        try {
          await this.processSyncOperation(operation);
          syncedCount++;
        } catch (error) {
          console.error('Sync operation failed:', error);
          conflicts.push({ operation, error });
        }
      }

      // Clear processed operations
      this.syncQueue = [];
      this.lastSyncTimestamp = new Date().toISOString();

      return { success: true, syncedCount, conflicts };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, syncedCount: 0, conflicts: [], error: 'Sync failed' };
    }
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get sync queue size
   */
  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  // ==================== PRIVATE METHODS ====================

  private async saveToLocalFallback(
    sessionData: Omit<WorkoutSession, 'id' | 'createdAt'>,
    userId: string
  ): Promise<{ success: boolean; session?: WorkoutSession; error?: string }> {
    try {
      // Save to local storage
      await localWorkoutService.saveSession(sessionData, userId);
      
      // Queue for cloud sync
      this.queueForSync('create', { sessionData, userId });

      // Create session object for return
      const session: WorkoutSession = {
        ...sessionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      return { success: true, session };
    } catch (error) {
      console.error('Local fallback save failed:', error);
      return { success: false, error: 'Failed to save workout session' };
    }
  }

  private async getFromLocalCache(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ sessions: WorkoutSession[]; hasMore: boolean }> {
    try {
      const data = await localWorkoutService.getData(userId);
      let sessions = data.sessions;

      if (offset) {
        sessions = sessions.slice(offset);
      }
      if (limit) {
        sessions = sessions.slice(0, limit);
      }

      return { 
        sessions, 
        hasMore: offset ? data.sessions.length > (offset + (limit || 50)) : false
      };
    } catch (error) {
      console.error('Error reading local cache:', error);
      return { sessions: [], hasMore: false };
    }
  }

  private async updateLocalCache(session: WorkoutSession): Promise<void> {
    try {
      // Update local storage to keep it in sync
      await localWorkoutService.saveSession(session, session.userId);
    } catch (error) {
      console.error('Error updating local cache:', error);
    }
  }

  private async updateLocalCacheMultiple(sessions: WorkoutSession[]): Promise<void> {
    try {
      // Update local cache with multiple sessions
      for (const session of sessions) {
        await this.updateLocalCache(session);
      }
    } catch (error) {
      console.error('Error updating local cache:', error);
    }
  }

  private async removeFromLocalCache(sessionId: string): Promise<void> {
    try {
      // Remove from local storage
      // This would need to be implemented in localWorkoutService
      console.log('Removing session from local cache:', sessionId);
    } catch (error) {
      console.error('Error removing from local cache:', error);
    }
  }

  private queueForSync(operation: string, data: any): void {
    this.syncQueue.push({
      operation,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  private async processSyncOperation(operation: any): Promise<void> {
    // Process individual sync operations
    switch (operation.operation) {
      case 'create':
        await this.saveWorkoutSession(operation.data.sessionData, operation.data.userId);
        break;
      case 'delete':
        await this.deleteWorkoutSession(operation.data.sessionId, operation.data.userId);
        break;
      // Add more operations as needed
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length > 0 && this.isOnline) {
      console.log(`Processing ${this.syncQueue.length} pending sync operations`);
      // Process sync queue when coming back online
      // This could be improved with debouncing
      setTimeout(() => {
        if (this.syncQueue.length > 0) {
          this.syncQueue.forEach(operation => {
            this.processSyncOperation(operation).catch(console.error);
          });
          this.syncQueue = [];
        }
      }, 1000);
    }
  }

  private async calculateLocalAnalytics(userId: string, days: number): Promise<UserAnalytics[]> {
    try {
      const data = await localWorkoutService.getData(userId);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Group sessions by date and calculate analytics
      const dailyStats = new Map<string, UserAnalytics>();
      
      data.sessions
        .filter(session => new Date(session.date) >= cutoffDate)
        .forEach(session => {
          const dateKey = session.date.split('T')[0];
          const existing = dailyStats.get(dateKey);
          
          if (existing) {
            existing.totalWorkouts += 1;
            existing.totalDuration += session.duration;
          } else {
            dailyStats.set(dateKey, {
              id: `local-${dateKey}`,
              userId,
              date: dateKey,
              totalWorkouts: 1,
              totalDuration: session.duration,
              currentStreak: 0, // Would need to calculate
              bestStreak: 0, // Would need to calculate
              weeklyGoalProgress: { completed: 1, target: 4 },
            });
          }
        });

      return Array.from(dailyStats.values());
    } catch (error) {
      console.error('Error calculating local analytics:', error);
      return [];
    }
  }

  private async calculateLocalStreaks(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      const data = await localWorkoutService.getData(userId);
      
      // Simple streak calculation from local data
      const dates = data.sessions
        .map(s => s.date.split('T')[0])
        .sort()
        .reverse();

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      const today = new Date().toISOString().split('T')[0];
      let checkDate = today;

      // Calculate current streak
      for (const date of dates) {
        if (date === checkDate) {
          currentStreak++;
          checkDate = new Date(new Date(checkDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else {
          break;
        }
      }

      // Calculate best streak (simplified)
      bestStreak = Math.max(currentStreak, data.sessions.length > 0 ? 1 : 0);

      return { currentStreak, bestStreak };
    } catch (error) {
      console.error('Error calculating local streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }
}

export const cloudWorkoutService = new CloudWorkoutService();