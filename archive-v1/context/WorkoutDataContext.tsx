// context/WorkoutDataContext.tsx - Cloud-first workout data with offline sync
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { localWorkoutService } from '../data/localWorkoutService';
import { cloudWorkoutService } from '../services/cloudWorkoutService';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from './AuthContext';

// Workout session data
export interface WorkoutSession {
  id: string;
  userId?: string; // Optional for backward compatibility
  date: string;
  splitType: 'oneADay' | 'twoADay';
  day: number;
  exercises: string[];
  duration: number; // in minutes
  createdAt: string;
}

// User preferences
export interface UserPreferences {
  preferredSplit: 'oneADay' | 'twoADay';
  defaultDay: number;
  reminderTime?: string;
  weeklyGoal: number; // workouts per week
}

// App data structure
export interface WorkoutAppData {
  sessions: WorkoutSession[];
  userPreferences: UserPreferences;
  totalWorkouts: number;
  currentStreak: number;
  lastUpdated: string;
}

// Action types for reducer
type WorkoutDataAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: WorkoutAppData }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: { isOnline: boolean; pendingSync: number } }
  | { type: 'FORCE_UPDATE' };

// State interface
interface WorkoutDataState {
  sessions: WorkoutSession[];
  userPreferences: UserPreferences;
  totalWorkouts: number;
  currentStreak: number;
  loading: boolean;
  error: string | null;
  updateCount: number;
  isOnline: boolean;
  pendingSyncCount: number;
}

// Context interface
interface WorkoutDataContextType extends WorkoutDataState {
  refresh: () => Promise<void>;
  saveWorkoutSession: (session: Omit<WorkoutSession, 'id' | 'createdAt'>) => Promise<boolean>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  getRecentSessions: (limit?: number) => WorkoutSession[];
  forceUpdate: () => void;
  syncToCloud: () => Promise<void>;
  deleteWorkoutSession: (sessionId: string) => Promise<boolean>;
}

// Initial state
const initialState: WorkoutDataState = {
  sessions: [],
  userPreferences: {
    preferredSplit: 'oneADay',
    defaultDay: 1,
    weeklyGoal: 4
  },
  totalWorkouts: 0,
  currentStreak: 0,
  loading: true,
  error: null,
  updateCount: 0,
  isOnline: true,
  pendingSyncCount: 0
};

// Reducer
function workoutDataReducer(state: WorkoutDataState, action: WorkoutDataAction): WorkoutDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_DATA':
      return {
        ...state,
        sessions: action.payload.sessions,
        userPreferences: action.payload.userPreferences,
        totalWorkouts: action.payload.totalWorkouts,
        currentStreak: action.payload.currentStreak,
        loading: false,
        error: null,
        updateCount: state.updateCount + 1
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SYNC_STATUS':
      return { 
        ...state, 
        isOnline: action.payload.isOnline,
        pendingSyncCount: action.payload.pendingSync
      };
    
    case 'FORCE_UPDATE':
      return { ...state, updateCount: state.updateCount + 1 };
    
    default:
      return state;
  }
}

// Create context
const WorkoutDataContext = createContext<WorkoutDataContextType | undefined>(undefined);

// Provider component
export function WorkoutDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workoutDataReducer, initialState);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const forceUpdate = useCallback(() => {
    dispatch({ type: 'FORCE_UPDATE' });
  }, []);

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const userId = isAuthenticated ? user?.id : undefined;
      
      if (isAuthenticated && userId) {
        // Use cloud service for authenticated users
        const { sessions } = await cloudWorkoutService.getWorkoutSessions(userId);
        
        // Get user preferences from local storage for now (will be moved to cloud later)
        const localData = await localWorkoutService.getData(userId);
        
        // Update sync status
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { 
            isOnline: cloudWorkoutService.isDeviceOnline(),
            pendingSync: cloudWorkoutService.getPendingSyncCount()
          }
        });
        
        dispatch({ 
          type: 'SET_DATA', 
          payload: {
            sessions,
            userPreferences: localData.userPreferences,
            totalWorkouts: sessions.length,
            currentStreak: localData.currentStreak, // TODO: get from cloud analytics
            lastUpdated: new Date().toISOString()
          }
        });
      } else {
        // Use local service for unauthenticated users
        const data = await localWorkoutService.getData(userId);
        dispatch({ type: 'SET_DATA', payload: data });
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load workout data' });
    }
  }, [user?.id, isAuthenticated]);

  const saveWorkoutSession = useCallback(async (sessionData: Omit<WorkoutSession, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const userId = isAuthenticated ? user?.id : undefined;
      
      if (isAuthenticated && userId) {
        // Use cloud service for authenticated users
        const result = await cloudWorkoutService.saveWorkoutSession(sessionData, userId);
        
        if (result.success && result.session) {
          // Update analytics after successful save
          await analyticsService.updateAnalyticsAfterWorkout(userId, result.session);
          
          // Refresh data from cloud
          await loadData();
          return true;
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to save workout session' });
          return false;
        }
      } else {
        // Use local service for unauthenticated users
        await localWorkoutService.saveSession(sessionData, userId);
        const freshData = await localWorkoutService.getData(userId);
        dispatch({ type: 'SET_DATA', payload: freshData });
        return true;
      }
    } catch (error) {
      console.error('Error saving workout session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save workout session' });
      return false;
    }
  }, [user?.id, isAuthenticated, loadData]);

  const updateUserPreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    try {
      const userId = isAuthenticated ? user?.id : undefined;
      await localWorkoutService.updateUserPreferences(prefs, userId);
      const freshData = await localWorkoutService.getData(userId);
      dispatch({ type: 'SET_DATA', payload: freshData });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    }
  }, [user?.id, isAuthenticated]);

  const getRecentSessions = useCallback((limit = 10) => {
    return state.sessions.slice(0, limit);
  }, [state.sessions]);

  const syncToCloud = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('Cannot sync: user not authenticated');
      return;
    }

    try {
      console.log('Syncing pending changes to cloud...');
      const result = await cloudWorkoutService.syncToCloud(user.id);
      
      if (result.success) {
        console.log(`Synced ${result.syncedCount} operations successfully`);
        // Refresh data after successful sync
        await loadData();
      } else {
        console.error('Sync failed:', result.error);
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Sync failed' });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Sync failed' });
    }
  }, [isAuthenticated, user?.id, loadData]);

  const deleteWorkoutSession = useCallback(async (sessionId: string) => {
    if (!isAuthenticated || !user?.id) {
      console.log('Cannot delete: user not authenticated');
      return false;
    }

    try {
      const result = await cloudWorkoutService.deleteWorkoutSession(sessionId, user.id);
      
      if (result.success) {
        // Refresh data after successful deletion
        await loadData();
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete workout session' });
        return false;
      }
    } catch (error) {
      console.error('Error deleting workout session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete workout session' });
      return false;
    }
  }, [isAuthenticated, user?.id, loadData]);

  // Handle user authentication changes and data migration
  useEffect(() => {
    // Don't initialize until auth is resolved
    if (authLoading) {
      return;
    }

    const initializeForUser = async () => {
      const userId = isAuthenticated ? user?.id : undefined;
      
      // Initialize storage for the current user context
      await localWorkoutService.initialize(userId);
      
      // If user just authenticated, migrate any global data to their account
      if (isAuthenticated && user?.id) {
        await localWorkoutService.migrateToUserStorage(user.id);
      }
      
      // Load data for the current context
      await loadData();
    };

    initializeForUser();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id, isAuthenticated, authLoading, loadData]);

  const contextValue: WorkoutDataContextType = {
    ...state,
    refresh: loadData,
    saveWorkoutSession,
    updateUserPreferences,
    getRecentSessions,
    forceUpdate,
    syncToCloud,
    deleteWorkoutSession
  };

  return (
    <WorkoutDataContext.Provider value={contextValue}>
      {children}
    </WorkoutDataContext.Provider>
  );
}

// Hook to use the context
export function useWorkoutData(): WorkoutDataContextType {
  const context = useContext(WorkoutDataContext);
  if (context === undefined) {
    throw new Error('useWorkoutData must be used within a WorkoutDataProvider');
  }
  return context;
}