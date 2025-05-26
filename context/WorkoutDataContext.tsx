// context/WorkoutDataContext.tsx - Adapted from QEP pattern
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { localWorkoutService } from '../data/localWorkoutService';

// Workout session data
export interface WorkoutSession {
  id: string;
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
}

// Context interface
interface WorkoutDataContextType extends WorkoutDataState {
  refresh: () => Promise<void>;
  saveWorkoutSession: (session: Omit<WorkoutSession, 'id' | 'createdAt'>) => Promise<boolean>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  getRecentSessions: (limit?: number) => WorkoutSession[];
  forceUpdate: () => void;
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
  updateCount: 0
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

  const forceUpdate = useCallback(() => {
    dispatch({ type: 'FORCE_UPDATE' });
  }, []);

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const data = await localWorkoutService.getData();
      dispatch({ type: 'SET_DATA', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load workout data' });
    }
  }, []);

  const saveWorkoutSession = useCallback(async (sessionData: Omit<WorkoutSession, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await localWorkoutService.saveSession(sessionData);
      const freshData = await localWorkoutService.getData();
      dispatch({ type: 'SET_DATA', payload: freshData });
      
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save workout session' });
      return false;
    }
  }, []);

  const updateUserPreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    try {
      await localWorkoutService.updateUserPreferences(prefs);
      const freshData = await localWorkoutService.getData();
      dispatch({ type: 'SET_DATA', payload: freshData });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    }
  }, []);

  const getRecentSessions = useCallback((limit = 10) => {
    return state.sessions.slice(0, limit);
  }, [state.sessions]);

  useEffect(() => {
    localWorkoutService.initialize().then(() => {
      loadData();
    });

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadData]);

  const contextValue: WorkoutDataContextType = {
    ...state,
    refresh: loadData,
    saveWorkoutSession,
    updateUserPreferences,
    getRecentSessions,
    forceUpdate
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