// services/realTimeWorkoutService.ts - Real-time workout sharing and live updates
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { WorkoutSession } from '../context/WorkoutDataContext';

export interface LiveWorkoutSession {
  id: string;
  userId: string;
  displayName: string;
  currentExercise: string;
  exerciseIndex: number;
  totalExercises: number;
  startedAt: string;
  duration: number; // in seconds
  splitType: 'oneADay' | 'twoADay';
  day: number;
  isActive: boolean;
  sharedWith: string[];
}

export interface WorkoutShare {
  id: string;
  workoutId: string;
  sharedBy: string;
  sharedWith: string;
  sharedByName: string;
  message?: string;
  workoutData: WorkoutSession;
  readAt?: string;
  createdAt: string;
}

export interface WorkoutUpdate {
  type: 'started' | 'exercise_changed' | 'completed' | 'paused' | 'resumed';
  sessionId: string;
  userId: string;
  data: any;
  timestamp: string;
}

type WorkoutEventHandler = (event: WorkoutUpdate) => void;
type ShareEventHandler = (share: WorkoutShare) => void;
type LiveSessionHandler = (sessions: LiveWorkoutSession[]) => void;

class RealTimeWorkoutService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private eventHandlers: Map<string, WorkoutEventHandler[]> = new Map();
  private shareHandlers: ShareEventHandler[] = [];
  private liveSessionHandlers: LiveSessionHandler[] = [];
  private activeSessions: Map<string, LiveWorkoutSession> = new Map();
  private currentUserSession: LiveWorkoutSession | null = null;

  // ==================== LIVE WORKOUT SESSIONS ====================

  /**
   * Start a live workout session that others can follow
   */
  async startLiveSession(
    userId: string,
    displayName: string,
    sessionData: {
      splitType: 'oneADay' | 'twoADay';
      day: number;
      exercises: string[];
    },
    sharedWith: string[] = []
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const sessionId = `live_${userId}_${Date.now()}`;
      
      const liveSession: LiveWorkoutSession = {
        id: sessionId,
        userId,
        displayName,
        currentExercise: sessionData.exercises[0] || 'Getting started...',
        exerciseIndex: 0,
        totalExercises: sessionData.exercises.length,
        startedAt: new Date().toISOString(),
        duration: 0,
        splitType: sessionData.splitType,
        day: sessionData.day,
        isActive: true,
        sharedWith
      };

      // Store in local state
      this.currentUserSession = liveSession;
      this.activeSessions.set(sessionId, liveSession);

      // Create real-time channel for this session
      const channel = supabase.channel(`workout_session_${sessionId}`)
        .on('broadcast', { event: 'workout_update' }, (payload) => {
          this.handleWorkoutUpdate(payload.payload as WorkoutUpdate);
        })
        .subscribe();

      this.channels.set(sessionId, channel);

      // Broadcast session start
      await this.broadcastWorkoutUpdate({
        type: 'started',
        sessionId,
        userId,
        data: liveSession,
        timestamp: new Date().toISOString()
      });

      // Notify live session handlers
      this.notifyLiveSessionHandlers();

      return { success: true, sessionId };
    } catch (error) {
      console.error('Error starting live session:', error);
      return { success: false, error: 'Failed to start live session' };
    }
  }

  /**
   * Update current exercise in live session
   */
  async updateLiveSessionExercise(
    sessionId: string,
    exerciseIndex: number,
    exerciseName: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) return;

      session.currentExercise = exerciseName;
      session.exerciseIndex = exerciseIndex;
      session.duration = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);

      this.activeSessions.set(sessionId, session);

      await this.broadcastWorkoutUpdate({
        type: 'exercise_changed',
        sessionId,
        userId: session.userId,
        data: {
          currentExercise: exerciseName,
          exerciseIndex,
          duration: session.duration
        },
        timestamp: new Date().toISOString()
      });

      this.notifyLiveSessionHandlers();
    } catch (error) {
      console.error('Error updating live session exercise:', error);
    }
  }

  /**
   * Complete a live workout session
   */
  async completeLiveSession(
    sessionId: string,
    finalSession: WorkoutSession
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;

      session.isActive = false;
      session.duration = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);

      await this.broadcastWorkoutUpdate({
        type: 'completed',
        sessionId,
        userId: session.userId,
        data: {
          finalSession,
          totalDuration: session.duration
        },
        timestamp: new Date().toISOString()
      });

      // Clean up
      this.cleanupSession(sessionId);
      
      if (this.currentUserSession?.id === sessionId) {
        this.currentUserSession = null;
      }

      this.notifyLiveSessionHandlers();
    } catch (error) {
      console.error('Error completing live session:', error);
    }
  }

  /**
   * Subscribe to live workout sessions from friends
   */
  subscribeToLiveSessions(userIds: string[]): void {
    const channel = supabase.channel('live_workouts')
      .on('broadcast', { event: 'workout_update' }, (payload) => {
        const update = payload.payload as WorkoutUpdate;
        if (userIds.includes(update.userId)) {
          this.handleWorkoutUpdate(update);
        }
      })
      .subscribe();

    this.channels.set('live_workouts', channel);
  }

  // ==================== WORKOUT SHARING ====================

  /**
   * Share a completed workout with specific users
   */
  async shareWorkout(
    workoutSession: WorkoutSession,
    sharedWithUsers: string[],
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!workoutSession.userId) {
        return { success: false, error: 'User ID required for sharing' };
      }

      // Get shared by user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', workoutSession.userId)
        .single();

      // Create shares for each recipient
      const shares = sharedWithUsers.map(userId => ({
        workout_id: workoutSession.id,
        shared_by: workoutSession.userId!,
        shared_with: userId,
        message: message || null
      }));

      const { error } = await supabase
        .from('workout_shares')
        .insert(shares);

      if (error) {
        console.error('Error sharing workout:', error);
        return { success: false, error: error.message };
      }

      // Broadcast share notifications
      for (const userId of sharedWithUsers) {
        await this.broadcastShareNotification({
          id: `share_${Date.now()}_${userId}`,
          workoutId: workoutSession.id,
          sharedBy: workoutSession.userId!,
          sharedWith: userId,
          sharedByName: profile?.display_name || 'Unknown User',
          message,
          workoutData: workoutSession,
          createdAt: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error sharing workout:', error);
      return { success: false, error: 'Failed to share workout' };
    }
  }

  /**
   * Get shared workouts for current user
   */
  async getSharedWorkouts(userId: string): Promise<WorkoutShare[]> {
    try {
      const { data, error } = await supabase
        .from('workout_shares')
        .select(`
          *,
          workout_sessions!workout_shares_workout_id_fkey (*),
          shared_by_profile:profiles!workout_shares_shared_by_fkey (display_name)
        `)
        .eq('shared_with', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shared workouts:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        workoutId: item.workout_id,
        sharedBy: item.shared_by,
        sharedWith: item.shared_with,
        sharedByName: item.shared_by_profile?.display_name || 'Unknown User',
        message: item.message,
        workoutData: {
          id: item.workout_sessions.id,
          userId: item.workout_sessions.user_id,
          date: item.workout_sessions.date,
          splitType: item.workout_sessions.split_type,
          day: item.workout_sessions.day,
          exercises: item.workout_sessions.exercises,
          duration: item.workout_sessions.duration,
          createdAt: item.workout_sessions.created_at
        },
        readAt: item.read_at,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error getting shared workouts:', error);
      return [];
    }
  }

  /**
   * Mark shared workout as read
   */
  async markShareAsRead(shareId: string): Promise<void> {
    try {
      await supabase
        .from('workout_shares')
        .update({ read_at: new Date().toISOString() })
        .eq('id', shareId);
    } catch (error) {
      console.error('Error marking share as read:', error);
    }
  }

  /**
   * Subscribe to workout shares for current user
   */
  subscribeToWorkoutShares(userId: string): void {
    const channel = supabase.channel(`user_shares_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_shares',
          filter: `shared_with=eq.${userId}`
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          // Fetch full share data with workout details
          const { data } = await supabase
            .from('workout_shares')
            .select(`
              *,
              workout_sessions!workout_shares_workout_id_fkey (*),
              shared_by_profile:profiles!workout_shares_shared_by_fkey (display_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const share: WorkoutShare = {
              id: data.id,
              workoutId: data.workout_id,
              sharedBy: data.shared_by,
              sharedWith: data.shared_with,
              sharedByName: data.shared_by_profile?.display_name || 'Unknown User',
              message: data.message,
              workoutData: {
                id: data.workout_sessions.id,
                userId: data.workout_sessions.user_id,
                date: data.workout_sessions.date,
                splitType: data.workout_sessions.split_type,
                day: data.workout_sessions.day,
                exercises: data.workout_sessions.exercises,
                duration: data.workout_sessions.duration,
                createdAt: data.workout_sessions.created_at
              },
              readAt: data.read_at,
              createdAt: data.created_at
            };

            this.notifyShareHandlers(share);
          }
        }
      )
      .subscribe();

    this.channels.set(`user_shares_${userId}`, channel);
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Add workout event handler
   */
  onWorkoutUpdate(eventType: string, handler: WorkoutEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Add share event handler
   */
  onWorkoutShare(handler: ShareEventHandler): void {
    this.shareHandlers.push(handler);
  }

  /**
   * Add live session handler
   */
  onLiveSessionUpdate(handler: LiveSessionHandler): void {
    this.liveSessionHandlers.push(handler);
  }

  /**
   * Get current live sessions
   */
  getLiveSessions(): LiveWorkoutSession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  /**
   * Get current user's live session
   */
  getCurrentUserSession(): LiveWorkoutSession | null {
    return this.currentUserSession;
  }

  // ==================== PRIVATE METHODS ====================

  private async broadcastWorkoutUpdate(update: WorkoutUpdate): Promise<void> {
    const channel = this.channels.get(update.sessionId) || this.channels.get('live_workouts');
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'workout_update',
        payload: update
      });
    }
  }

  private async broadcastShareNotification(share: WorkoutShare): Promise<void> {
    const channel = this.channels.get(`user_shares_${share.sharedWith}`);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'workout_shared',
        payload: share
      });
    }
  }

  private handleWorkoutUpdate(update: WorkoutUpdate): void {
    // Update live session if it exists
    if (update.type === 'started' && update.data) {
      this.activeSessions.set(update.sessionId, update.data as LiveWorkoutSession);
    } else if (update.type === 'exercise_changed') {
      const session = this.activeSessions.get(update.sessionId);
      if (session) {
        session.currentExercise = update.data.currentExercise;
        session.exerciseIndex = update.data.exerciseIndex;
        session.duration = update.data.duration;
        this.activeSessions.set(update.sessionId, session);
      }
    } else if (update.type === 'completed') {
      const session = this.activeSessions.get(update.sessionId);
      if (session) {
        session.isActive = false;
        session.duration = update.data.totalDuration;
        this.activeSessions.set(update.sessionId, session);
      }
    }

    // Notify handlers
    const handlers = this.eventHandlers.get(update.type) || [];
    handlers.forEach(handler => handler(update));

    this.notifyLiveSessionHandlers();
  }

  private notifyShareHandlers(share: WorkoutShare): void {
    this.shareHandlers.forEach(handler => handler(share));
  }

  private notifyLiveSessionHandlers(): void {
    const liveSessions = this.getLiveSessions();
    this.liveSessionHandlers.forEach(handler => handler(liveSessions));
  }

  private cleanupSession(sessionId: string): void {
    const channel = this.channels.get(sessionId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(sessionId);
    }
    this.activeSessions.delete(sessionId);
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.eventHandlers.clear();
    this.shareHandlers.length = 0;
    this.liveSessionHandlers.length = 0;
    this.activeSessions.clear();
    this.currentUserSession = null;
  }
}

export const realTimeWorkoutService = new RealTimeWorkoutService();