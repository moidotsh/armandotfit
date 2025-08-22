// context/AuthContext.tsx - Authentication context with Supabase integration
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { 
  AuthContextType, 
  AuthState, 
  UserProfile, 
  AuthResult, 
  SignUpData,
  ProfileUpdateData 
} from '../types/auth';

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Session timeout management
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  // Load user profile from database with timeout
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Loading profile for user:', userId);
      
      // Add timeout to prevent hanging
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      );
      
      const result = await Promise.race([profileQuery, timeoutPromise]);
      const { data, error } = result;

      if (error) {
        console.error('Error loading user profile:', error);
        
        // For now, create a minimal profile to avoid blocking
        console.log('Creating fallback profile for user');
        return {
          id: userId,
          email: '', // We'll get this from the user object
          firstName: 'User',
          lastName: '',
          displayName: 'User',
          preferredSplit: 'oneADay',
          defaultDay: 1,
          weeklyGoal: 4,
          isOnboardingComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (!data) {
        console.log('No profile data found, creating fallback');
        return {
          id: userId,
          email: '',
          firstName: 'User',
          lastName: '',
          displayName: 'User',
          preferredSplit: 'oneADay',
          defaultDay: 1,
          weeklyGoal: 4,
          isOnboardingComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Transform database format to app format
      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        avatarUrl: data.avatar_url || undefined,
        preferredSplit: data.preferred_split,
        defaultDay: data.default_day,
        weeklyGoal: data.weekly_goal,
        reminderTime: data.reminder_time || undefined,
        isOnboardingComplete: data.is_onboarding_complete,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log('Profile loaded successfully');
      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Return fallback profile to prevent blocking
      console.log('Using fallback profile due to error');
      return {
        id: userId,
        email: '',
        firstName: 'User',
        lastName: '',
        displayName: 'User',
        preferredSplit: 'oneADay',
        defaultDay: 1,
        weeklyGoal: 4,
        isOnboardingComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }, []);

  // Create user profile in database using the secure function
  const createUserProfile = useCallback(async (user: User, profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const displayName = profileData.displayName || `${profileData.firstName} ${profileData.lastName}`;

      // Use the secure function to create profile
      const { data, error } = await supabase.rpc('create_profile_for_user', {
        user_id: user.id,
        user_email: user.email!,
        first_name: profileData.firstName!,
        last_name: profileData.lastName!,
        display_name: displayName,
        preferred_split: profileData.preferredSplit || 'oneADay',
        weekly_goal: profileData.weeklyGoal || 4
      });

      if (error) {
        console.error('Error creating user profile:', error);
        
        // Fallback: try direct insert with retry
        const now = new Date().toISOString();
        const newProfile = {
          id: user.id,
          email: user.email!,
          first_name: profileData.firstName!,
          last_name: profileData.lastName!,
          display_name: displayName,
          avatar_url: profileData.avatarUrl || null,
          preferred_split: profileData.preferredSplit || 'oneADay',
          default_day: profileData.defaultDay || 1,
          weekly_goal: profileData.weeklyGoal || 4,
          reminder_time: profileData.reminderTime || null,
          is_onboarding_complete: profileData.isOnboardingComplete || false,
          created_at: now,
          updated_at: now,
        };

        // Wait a bit for the auth session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (fallbackError) {
          console.error('Fallback profile creation also failed:', fallbackError);
          return null;
        }

        // Transform fallback data
        return {
          id: fallbackData.id,
          email: fallbackData.email,
          firstName: fallbackData.first_name,
          lastName: fallbackData.last_name,
          displayName: fallbackData.display_name,
          avatarUrl: fallbackData.avatar_url || undefined,
          preferredSplit: fallbackData.preferred_split,
          defaultDay: fallbackData.default_day,
          weeklyGoal: fallbackData.weekly_goal,
          reminderTime: fallbackData.reminder_time || undefined,
          isOnboardingComplete: fallbackData.is_onboarding_complete,
          createdAt: fallbackData.created_at,
          updatedAt: fallbackData.updated_at,
        };
      }

      // Transform RPC function result to app format
      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        avatarUrl: data.avatar_url || undefined,
        preferredSplit: data.preferred_split,
        defaultDay: data.default_day,
        weeklyGoal: data.weekly_goal,
        reminderTime: data.reminder_time || undefined,
        isOnboardingComplete: data.is_onboarding_complete,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, profileData: Partial<UserProfile>): Promise<AuthResult> => {
    try {
      setAuthState(AuthState.LOADING);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthState(AuthState.UNAUTHENTICATED);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if email is confirmed
        const isEmailConfirmed = data.user.email_confirmed_at !== null;
        
        if (isEmailConfirmed) {
          // User is confirmed, create profile and sign them in
          const profile = await createUserProfile(data.user, profileData);
          if (!profile) {
            setAuthState(AuthState.UNAUTHENTICATED);
            return { success: false, error: 'Failed to create user profile' };
          }
          
          setUser(data.user);
          setProfile(profile);
          setAuthState(AuthState.AUTHENTICATED);
          return { success: true, message: 'Welcome to Armandotfit!' };
        } else {
          // Email not confirmed, create profile but don't sign them in
          await createUserProfile(data.user, profileData);
          setAuthState(AuthState.UNAUTHENTICATED);
          return { 
            success: true, 
            message: 'Account created! Please check your email and click the confirmation link to complete your registration.' 
          };
        }
      }

      setAuthState(AuthState.UNAUTHENTICATED);
      return { success: false, error: 'Failed to create account' };
    } catch (error) {
      setAuthState(AuthState.UNAUTHENTICATED);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [createUserProfile]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setAuthState(AuthState.LOADING);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(AuthState.UNAUTHENTICATED);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await loadUserProfile(data.user.id);
        setUser(data.user);
        setProfile(profile);
        setAuthState(AuthState.AUTHENTICATED);
      }

      return { success: true, message: 'Welcome back!' };
    } catch (error) {
      setAuthState(AuthState.UNAUTHENTICATED);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [loadUserProfile]);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Clear session timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      setAuthState(AuthState.LOADING);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setAuthState(AuthState.UNAUTHENTICATED);
    } catch (error) {
      console.error('Error signing out:', error);
      // Force sign out even if there's an error
      setUser(null);
      setProfile(null);
      setAuthState(AuthState.UNAUTHENTICATED);
    }
  }, []);

  // Reset session timeout
  const resetSessionTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    if (authState === AuthState.AUTHENTICATED) {
      sessionTimeoutRef.current = setTimeout(() => {
        console.log('Session timeout - automatically signing out');
        signOut();
      }, SESSION_TIMEOUT_MS);
    }
  }, [authState, signOut]);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password reset email sent. Please check your inbox.' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: ProfileUpdateData): Promise<AuthResult> => {
    if (!user || !profile) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const now = new Date().toISOString();
      const updateData: any = {
        updated_at: now,
      };

      // Map app format to database format
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
      if (updates.preferredSplit !== undefined) updateData.preferred_split = updates.preferredSplit;
      if (updates.defaultDay !== undefined) updateData.default_day = updates.defaultDay;
      if (updates.weeklyGoal !== undefined) updateData.weekly_goal = updates.weeklyGoal;
      if (updates.reminderTime !== undefined) updateData.reminder_time = updates.reminderTime;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local profile state
      const updatedProfile: UserProfile = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        avatarUrl: data.avatar_url || undefined,
        preferredSplit: data.preferred_split,
        defaultDay: data.default_day,
        weeklyGoal: data.weekly_goal,
        reminderTime: data.reminder_time || undefined,
        isOnboardingComplete: data.is_onboarding_complete,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProfile(updatedProfile);
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [user, profile]);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('AuthContext: Starting initialization...');
      
      try {
        console.log('AuthContext: Attempting to get session...');
        
        // Try to get session with a short timeout
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000))
        ]);
        
        console.log('AuthContext: Session result received');
        const { data: { session } } = sessionResult;
        
        if (!mounted) return;

        if (session?.user) {
          console.log('AuthContext: User found, loading profile');
          const profile = await loadUserProfile(session.user.id);
          setUser(session.user);
          setProfile(profile);
          setAuthState(AuthState.AUTHENTICATED);
        } else {
          console.log('AuthContext: No session, setting unauthenticated');
          setAuthState(AuthState.UNAUTHENTICATED);
        }
      } catch (error) {
        console.error('AuthContext: Error during initialization:', error);
        if (mounted) {
          console.log('AuthContext: Setting unauthenticated due to error');
          setAuthState(AuthState.UNAUTHENTICATED);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, !!session);

      try {
        if (session?.user) {
          console.log('AuthContext: Auth state change - user found, loading profile');
          const profile = await loadUserProfile(session.user.id);
          setUser(session.user);
          setProfile(profile);
          setAuthState(AuthState.AUTHENTICATED);
        } else {
          console.log('AuthContext: Auth state change - no user');
          setUser(null);
          setProfile(null);
          setAuthState(AuthState.UNAUTHENTICATED);
        }
      } catch (error) {
        console.error('AuthContext: Error in auth state change:', error);
        setUser(null);
        setProfile(null);
        setAuthState(AuthState.UNAUTHENTICATED);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [loadUserProfile]);

  // Handle session timeout activation
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED) {
      resetSessionTimeout();
    } else if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, [authState, resetSessionTimeout]);

  // Handle app state changes for session timeout
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && authState === AuthState.AUTHENTICATED) {
        // Check if session has expired while app was in background
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
          console.log('Session expired while app was in background');
          signOut();
        } else {
          resetSessionTimeout();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [authState, resetSessionTimeout, signOut]);

  // Context value
  const value: AuthContextType = {
    authState,
    user,
    profile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}