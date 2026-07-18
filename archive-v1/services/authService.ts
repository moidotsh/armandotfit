// services/authService.ts - Additional auth service utilities
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/auth';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation
const PASSWORD_MIN_LENGTH = 8;

export const authService = {
  // Validation helpers
  validateEmail: (email: string): { isValid: boolean; error?: string } => {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!EMAIL_REGEX.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  validatePassword: (password: string): { isValid: boolean; error?: string } => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return { isValid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
    }
    return { isValid: true };
  },

  validatePasswordConfirmation: (password: string, confirmPassword: string): { isValid: boolean; error?: string } => {
    if (password !== confirmPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true };
  },

  validateName: (name: string, fieldName: string): { isValid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    if (name.trim().length < 2) {
      return { isValid: false, error: `${fieldName} must be at least 2 characters` };
    }
    return { isValid: true };
  },

  // Check if email is already registered
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error) {
        console.error('Error checking email:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  },

  // Check if user has completed onboarding
  checkOnboardingStatus: async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_onboarding_complete')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      return data?.is_onboarding_complete || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as complete
  completeOnboarding: async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_onboarding_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error completing onboarding:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  },

  // Get user's display name for UI
  getDisplayName: (profile: UserProfile | null): string => {
    if (!profile) return 'User';
    
    if (profile.displayName) return profile.displayName;
    if (profile.firstName && profile.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (profile.firstName) return profile.firstName;
    return profile.email.split('@')[0]; // fallback to email username
  },

  // Format error messages for better UX
  formatAuthError: (error: string): string => {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Incorrect email or password. Please try again.',
      'Email not confirmed': 'Please check your email and click the confirmation link.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'User already registered': 'An account with this email already exists. Try signing in instead.',
      'Signup is disabled': 'New registrations are currently disabled. Please try again later.',
      'Email rate limit exceeded': 'Too many emails sent. Please wait before requesting another.',
      'SMS rate limit exceeded': 'Too many SMS sent. Please wait before requesting another.',
    };

    return errorMap[error] || error;
  },

  // Generate avatar URL (placeholder for future implementation)
  generateAvatarUrl: (profile: UserProfile): string => {
    // For now, return a placeholder. Later we can integrate with services like:
    // - Gravatar
    // - UI Avatars
    // - User uploaded images
    const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=FF9500&color=fff&size=200`;
  },

  // Log authentication events for debugging
  logAuthEvent: (event: string, data?: any) => {
    if (__DEV__) {
      console.log(`[AUTH] ${event}`, data);
    }
  },
};