import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutAppData, WorkoutSession, UserPreferences } from '../context/WorkoutDataContext';

// Base storage key
const BASE_STORAGE_KEY = 'armandotfit_workout_data';
const GLOBAL_STORAGE_KEY = 'armandotfit_global_data'; // For pre-auth data

// Helper to get user-specific storage key
const getUserStorageKey = (userId: string): string => {
  return `${BASE_STORAGE_KEY}_user_${userId}`;
};

export const localWorkoutService = {
  // Initialize for a specific user
  async initialize(userId?: string): Promise<void> {
    try {
      const storageKey = userId ? getUserStorageKey(userId) : GLOBAL_STORAGE_KEY;
      const data = await AsyncStorage.getItem(storageKey);
      if (!data) {
        await this.saveInitialData(userId);
      }
    } catch (error) {
      console.error('Failed to initialize workout data:', error);
    }
  },

  // Migrate global data to user-specific storage
  async migrateToUserStorage(userId: string): Promise<void> {
    try {
      console.log('Migrating data to user storage for user:', userId);
      
      // Check if global data exists
      const globalData = await AsyncStorage.getItem(GLOBAL_STORAGE_KEY);
      const oldGlobalData = await AsyncStorage.getItem(BASE_STORAGE_KEY); // Legacy key
      
      const dataToMigrate = globalData || oldGlobalData;
      
      if (dataToMigrate) {
        const userStorageKey = getUserStorageKey(userId);
        const existingUserData = await AsyncStorage.getItem(userStorageKey);
        
        // Only migrate if user doesn't already have data
        if (!existingUserData) {
          console.log('Migrating existing data to user storage');
          await AsyncStorage.setItem(userStorageKey, dataToMigrate);
        }
        
        // Clean up old global data
        if (globalData) await AsyncStorage.removeItem(GLOBAL_STORAGE_KEY);
        if (oldGlobalData) await AsyncStorage.removeItem(BASE_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to migrate data to user storage:', error);
    }
  },

  // Get data for a specific user
  async getData(userId?: string): Promise<WorkoutAppData> {
    try {
      const storageKey = userId ? getUserStorageKey(userId) : GLOBAL_STORAGE_KEY;
      const data = await AsyncStorage.getItem(storageKey);
      return data ? JSON.parse(data) : await this.saveInitialData(userId);
    } catch (error) {
      console.error('Failed to get workout data:', error);
      return this.getDefaultData();
    }
  },

  // Save workout session for a specific user
  async saveSession(sessionData: Omit<WorkoutSession, 'id' | 'createdAt'>, userId?: string): Promise<void> {
    const data = await this.getData(userId);
    const newSession: WorkoutSession = {
      ...sessionData,
      id: Date.now().toString(),
      userId: userId, // Store the user ID with the session
      createdAt: new Date().toISOString()
    };
    
    data.sessions.unshift(newSession);
    data.totalWorkouts = data.sessions.length;
    data.lastUpdated = new Date().toISOString();
    
    const storageKey = userId ? getUserStorageKey(userId) : GLOBAL_STORAGE_KEY;
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  },

  // Update user preferences for a specific user
  async updateUserPreferences(prefs: Partial<UserPreferences>, userId?: string): Promise<void> {
    const data = await this.getData(userId);
    data.userPreferences = { ...data.userPreferences, ...prefs };
    data.lastUpdated = new Date().toISOString();
    
    const storageKey = userId ? getUserStorageKey(userId) : GLOBAL_STORAGE_KEY;
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  },

  // Save initial data for a specific user
  async saveInitialData(userId?: string): Promise<WorkoutAppData> {
    const initialData = this.getDefaultData();
    const storageKey = userId ? getUserStorageKey(userId) : GLOBAL_STORAGE_KEY;
    await AsyncStorage.setItem(storageKey, JSON.stringify(initialData));
    return initialData;
  },

  // Clear all data for a specific user
  async clearUserData(userId: string): Promise<void> {
    try {
      const storageKey = getUserStorageKey(userId);
      await AsyncStorage.removeItem(storageKey);
      console.log('Cleared data for user:', userId);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  },

  // Get all user storage keys (for debugging)
  async getAllUserKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(`${BASE_STORAGE_KEY}_user_`));
    } catch (error) {
      console.error('Failed to get user keys:', error);
      return [];
    }
  },

  getDefaultData(): WorkoutAppData {
    return {
      sessions: [],
      userPreferences: {
        preferredSplit: 'oneADay',
        defaultDay: 1,
        weeklyGoal: 4
      },
      totalWorkouts: 0,
      currentStreak: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}; 