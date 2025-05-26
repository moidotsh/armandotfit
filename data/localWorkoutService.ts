import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutAppData, WorkoutSession, UserPreferences } from '../context/WorkoutDataContext';

const STORAGE_KEY = 'armandotfit_workout_data';

export const localWorkoutService = {
  async initialize(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        await this.saveInitialData();
      }
    } catch (error) {
      console.error('Failed to initialize workout data:', error);
    }
  },

  async getData(): Promise<WorkoutAppData> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : await this.saveInitialData();
    } catch (error) {
      console.error('Failed to get workout data:', error);
      return this.getDefaultData();
    }
  },

  async saveSession(sessionData: Omit<WorkoutSession, 'id' | 'createdAt'>): Promise<void> {
    const data = await this.getData();
    const newSession: WorkoutSession = {
      ...sessionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    data.sessions.unshift(newSession);
    data.totalWorkouts = data.sessions.length;
    data.lastUpdated = new Date().toISOString();
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async updateUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
    const data = await this.getData();
    data.userPreferences = { ...data.userPreferences, ...prefs };
    data.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async saveInitialData(): Promise<WorkoutAppData> {
    const initialData = this.getDefaultData();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
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