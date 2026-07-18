// context/RealTimeContext.tsx - Real-time workout features context
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { realTimeWorkoutService, LiveWorkoutSession, WorkoutShare } from '../services/realTimeWorkoutService';
import { WorkoutSession } from './WorkoutDataContext';
import { useAuth } from './AuthContext';

// Real-time state interface
interface RealTimeState {
  // Live sessions
  liveSessions: LiveWorkoutSession[];
  currentUserSession: LiveWorkoutSession | null;
  isLiveSessionActive: boolean;
  
  // Workout shares
  sharedWorkouts: WorkoutShare[];
  unreadSharesCount: number;
  
  // Connection status
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}

// Action types for reducer
type RealTimeAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_LIVE_SESSIONS'; payload: LiveWorkoutSession[] }
  | { type: 'SET_USER_SESSION'; payload: LiveWorkoutSession | null }
  | { type: 'SET_SHARED_WORKOUTS'; payload: WorkoutShare[] }
  | { type: 'ADD_SHARED_WORKOUT'; payload: WorkoutShare }
  | { type: 'MARK_SHARE_READ'; payload: string }
  | { type: 'UPDATE_LIVE_SESSION'; payload: { sessionId: string; updates: Partial<LiveWorkoutSession> } };

// Context interface
interface RealTimeContextType extends RealTimeState {
  // Live session methods
  startLiveSession: (sessionData: {
    splitType: 'oneADay' | 'twoADay';
    day: number;
    exercises: string[];
  }, sharedWith?: string[]) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  
  updateCurrentExercise: (exerciseIndex: number, exerciseName: string) => Promise<void>;
  completeLiveSession: (finalSession: WorkoutSession) => Promise<void>;
  
  // Sharing methods
  shareWorkout: (workout: WorkoutSession, sharedWith: string[], message?: string) => Promise<{ success: boolean; error?: string }>;
  markShareAsRead: (shareId: string) => Promise<void>;
  
  // Subscription methods
  subscribeToLiveSessions: (userIds: string[]) => void;
  subscribeToShares: () => void;
  
  // Utility methods
  refreshSharedWorkouts: () => Promise<void>;
  cleanup: () => void;
}

// Initial state
const initialState: RealTimeState = {
  liveSessions: [],
  currentUserSession: null,
  isLiveSessionActive: false,
  sharedWorkouts: [],
  unreadSharesCount: 0,
  isConnected: false,
  loading: false,
  error: null
};

// Reducer
function realTimeReducer(state: RealTimeState, action: RealTimeAction): RealTimeState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'SET_LIVE_SESSIONS':
      return { ...state, liveSessions: action.payload };
    
    case 'SET_USER_SESSION':
      return { 
        ...state, 
        currentUserSession: action.payload,
        isLiveSessionActive: action.payload?.isActive || false
      };
    
    case 'SET_SHARED_WORKOUTS':
      const unreadCount = action.payload.filter(share => !share.readAt).length;
      return { 
        ...state, 
        sharedWorkouts: action.payload,
        unreadSharesCount: unreadCount
      };
    
    case 'ADD_SHARED_WORKOUT':
      const newShares = [action.payload, ...state.sharedWorkouts];
      const newUnreadCount = newShares.filter(share => !share.readAt).length;
      return { 
        ...state, 
        sharedWorkouts: newShares,
        unreadSharesCount: newUnreadCount
      };
    
    case 'MARK_SHARE_READ':
      const updatedShares = state.sharedWorkouts.map(share =>
        share.id === action.payload 
          ? { ...share, readAt: new Date().toISOString() }
          : share
      );
      const updatedUnreadCount = updatedShares.filter(share => !share.readAt).length;
      return { 
        ...state, 
        sharedWorkouts: updatedShares,
        unreadSharesCount: updatedUnreadCount
      };
    
    case 'UPDATE_LIVE_SESSION':
      const updatedLiveSessions = state.liveSessions.map(session =>
        session.id === action.payload.sessionId
          ? { ...session, ...action.payload.updates }
          : session
      );
      
      let updatedUserSession = state.currentUserSession;
      if (state.currentUserSession?.id === action.payload.sessionId) {
        updatedUserSession = { ...state.currentUserSession, ...action.payload.updates };
      }
      
      return {
        ...state,
        liveSessions: updatedLiveSessions,
        currentUserSession: updatedUserSession,
        isLiveSessionActive: updatedUserSession?.isActive || false
      };
    
    default:
      return state;
  }
}

// Create context
const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

// Provider component
export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(realTimeReducer, initialState);
  const { user, profile, isAuthenticated } = useAuth();

  // Setup real-time event handlers
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Live session update handler
    const handleLiveSessionUpdate = (sessions: LiveWorkoutSession[]) => {
      dispatch({ type: 'SET_LIVE_SESSIONS', payload: sessions });
    };

    // Workout share handler
    const handleWorkoutShare = (share: WorkoutShare) => {
      dispatch({ type: 'ADD_SHARED_WORKOUT', payload: share });
    };

    // Exercise change handler
    const handleExerciseChange = (update: any) => {
      if (update.type === 'exercise_changed') {
        dispatch({
          type: 'UPDATE_LIVE_SESSION',
          payload: {
            sessionId: update.sessionId,
            updates: {
              currentExercise: update.data.currentExercise,
              exerciseIndex: update.data.exerciseIndex,
              duration: update.data.duration
            }
          }
        });
      }
    };

    // Register event handlers
    realTimeWorkoutService.onLiveSessionUpdate(handleLiveSessionUpdate);
    realTimeWorkoutService.onWorkoutShare(handleWorkoutShare);
    realTimeWorkoutService.onWorkoutUpdate('exercise_changed', handleExerciseChange);

    // Subscribe to workout shares
    realTimeWorkoutService.subscribeToWorkoutShares(user.id);

    // Set connection status
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });

    return () => {
      // Cleanup will be handled by the cleanup method
    };
  }, [user?.id, isAuthenticated]);

  // Load initial shared workouts
  const loadSharedWorkouts = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const shares = await realTimeWorkoutService.getSharedWorkouts(user.id);
      dispatch({ type: 'SET_SHARED_WORKOUTS', payload: shares });
    } catch (error) {
      console.error('Error loading shared workouts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load shared workouts' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id, isAuthenticated]);

  // Load initial data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadSharedWorkouts();
    }
  }, [isAuthenticated, user?.id, loadSharedWorkouts]);

  // Context methods
  const startLiveSession = useCallback(async (
    sessionData: {
      splitType: 'oneADay' | 'twoADay';
      day: number;
      exercises: string[];
    },
    sharedWith: string[] = []
  ) => {
    if (!isAuthenticated || !user?.id || !profile?.displayName) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await realTimeWorkoutService.startLiveSession(
        user.id,
        profile.displayName,
        sessionData,
        sharedWith
      );

      if (result.success && result.sessionId) {
        const currentSession = realTimeWorkoutService.getCurrentUserSession();
        dispatch({ type: 'SET_USER_SESSION', payload: currentSession });
      }

      return result;
    } catch (error) {
      console.error('Error starting live session:', error);
      return { success: false, error: 'Failed to start live session' };
    }
  }, [user?.id, profile?.displayName, isAuthenticated]);

  const updateCurrentExercise = useCallback(async (exerciseIndex: number, exerciseName: string) => {
    if (!state.currentUserSession) return;

    try {
      await realTimeWorkoutService.updateLiveSessionExercise(
        state.currentUserSession.id,
        exerciseIndex,
        exerciseName
      );
    } catch (error) {
      console.error('Error updating current exercise:', error);
    }
  }, [state.currentUserSession]);

  const completeLiveSession = useCallback(async (finalSession: WorkoutSession) => {
    if (!state.currentUserSession) return;

    try {
      await realTimeWorkoutService.completeLiveSession(
        state.currentUserSession.id,
        finalSession
      );
      dispatch({ type: 'SET_USER_SESSION', payload: null });
    } catch (error) {
      console.error('Error completing live session:', error);
    }
  }, [state.currentUserSession]);

  const shareWorkout = useCallback(async (
    workout: WorkoutSession,
    sharedWith: string[],
    message?: string
  ) => {
    try {
      return await realTimeWorkoutService.shareWorkout(workout, sharedWith, message);
    } catch (error) {
      console.error('Error sharing workout:', error);
      return { success: false, error: 'Failed to share workout' };
    }
  }, []);

  const markShareAsRead = useCallback(async (shareId: string) => {
    try {
      await realTimeWorkoutService.markShareAsRead(shareId);
      dispatch({ type: 'MARK_SHARE_READ', payload: shareId });
    } catch (error) {
      console.error('Error marking share as read:', error);
    }
  }, []);

  const subscribeToLiveSessions = useCallback((userIds: string[]) => {
    realTimeWorkoutService.subscribeToLiveSessions(userIds);
  }, []);

  const subscribeToShares = useCallback(() => {
    if (user?.id) {
      realTimeWorkoutService.subscribeToWorkoutShares(user.id);
    }
  }, [user?.id]);

  const refreshSharedWorkouts = useCallback(async () => {
    await loadSharedWorkouts();
  }, [loadSharedWorkouts]);

  const cleanup = useCallback(() => {
    realTimeWorkoutService.cleanup();
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    dispatch({ type: 'SET_USER_SESSION', payload: null });
    dispatch({ type: 'SET_LIVE_SESSIONS', payload: [] });
  }, []);

  const contextValue: RealTimeContextType = {
    ...state,
    startLiveSession,
    updateCurrentExercise,
    completeLiveSession,
    shareWorkout,
    markShareAsRead,
    subscribeToLiveSessions,
    subscribeToShares,
    refreshSharedWorkouts,
    cleanup
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
}

// Hook to use the context
export function useRealTime(): RealTimeContextType {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}