// types/auth.ts - Authentication type definitions
import { User } from '@supabase/supabase-js';

// Auth state enum
export enum AuthState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
}

// User profile extending Supabase User
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Workout-specific preferences
  preferredSplit: 'oneADay' | 'twoADay';
  defaultDay: number;
  weeklyGoal: number;
  reminderTime?: string;
  isOnboardingComplete: boolean;
}

// Auth context interface
export interface AuthContextType {
  // Auth state
  authState: AuthState;
  user: User | null;
  profile: UserProfile | null;
  
  // Auth methods
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>;
  
  // Helper methods
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth operation result
export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

// Sign up form data
export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  preferredSplit: 'oneADay' | 'twoADay';
  weeklyGoal: number;
}

// Sign in form data
export interface SignInData {
  email: string;
  password: string;
}

// Password reset form data
export interface ResetPasswordData {
  email: string;
}

// Profile update data
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  preferredSplit?: 'oneADay' | 'twoADay';
  defaultDay?: number;
  weeklyGoal?: number;
  reminderTime?: string;
}

// Database table types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          display_name: string;
          avatar_url: string | null;
          preferred_split: 'oneADay' | 'twoADay';
          default_day: number;
          weekly_goal: number;
          reminder_time: string | null;
          is_onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          display_name?: string;
          avatar_url?: string | null;
          preferred_split?: 'oneADay' | 'twoADay';
          default_day?: number;
          weekly_goal?: number;
          reminder_time?: string | null;
          is_onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          display_name?: string;
          avatar_url?: string | null;
          preferred_split?: 'oneADay' | 'twoADay';
          default_day?: number;
          weekly_goal?: number;
          reminder_time?: string | null;
          is_onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          split_type: 'oneADay' | 'twoADay';
          day: number;
          exercises: any[];
          duration: number;
          notes: string | null;
          is_shared: boolean;
          shared_with: string[];
          created_at: string;
          updated_at: string;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          split_type: 'oneADay' | 'twoADay';
          day: number;
          exercises: any[];
          duration: number;
          notes?: string | null;
          is_shared?: boolean;
          shared_with?: string[];
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          split_type?: 'oneADay' | 'twoADay';
          day?: number;
          exercises?: any[];
          duration?: number;
          notes?: string | null;
          is_shared?: boolean;
          shared_with?: string[];
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
        };
      };
      user_analytics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_workouts: number;
          total_duration: number;
          current_streak: number;
          best_streak: number;
          weekly_goal_progress: {
            completed: number;
            target: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_workouts?: number;
          total_duration?: number;
          current_streak?: number;
          best_streak?: number;
          weekly_goal_progress?: {
            completed: number;
            target: number;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_workouts?: number;
          total_duration?: number;
          current_streak?: number;
          best_streak?: number;
          weekly_goal_progress?: {
            completed: number;
            target: number;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_shares: {
        Row: {
          id: string;
          workout_id: string;
          shared_by: string;
          shared_with: string;
          message: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          shared_by: string;
          shared_with: string;
          message?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          shared_by?: string;
          shared_with?: string;
          message?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      sync_metadata: {
        Row: {
          id: string;
          user_id: string;
          table_name: string;
          record_id: string;
          last_synced: string;
          checksum: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          table_name: string;
          record_id: string;
          last_synced?: string;
          checksum?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          table_name?: string;
          record_id?: string;
          last_synced?: string;
          checksum?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      calculate_user_streaks: {
        Args: {
          target_user_id: string;
        };
        Returns: Array<{
          current_streak: number;
          best_streak: number;
        }>;
      };
    };
  };
}