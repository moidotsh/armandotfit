// lib/supabase.ts - Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { Database } from '../types/auth';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with proper configuration for React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For web, let Supabase use default storage (localStorage)
    // For native, use AsyncStorage
    ...(Platform.OS !== 'web' && {
      storage: require('@react-native-async-storage/async-storage').default,
    }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Helper function to check if we're connected to Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

// Constants for database operations
export const TABLES = {
  PROFILES: 'profiles',
  WORKOUT_SESSIONS: 'workout_sessions', // We'll create this later
} as const;