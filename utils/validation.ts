// utils/validation.ts - Input validation and sanitization utilities

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strong password requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter  
 * - At least one number
 * - At least one special character
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Basic sanitization - removes potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove potential event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize and validate display name
 */
export function validateDisplayName(name: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < 1) {
    return { isValid: false, error: 'Display name is required', sanitized };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Display name must be 50 characters or less', sanitized };
  }
  
  // Allow letters, numbers, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z0-9\s\-']+$/.test(sanitized)) {
    return { isValid: false, error: 'Display name contains invalid characters', sanitized };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeInput(email).toLowerCase();
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required', sanitized };
  }
  
  if (!EMAIL_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address', sanitized };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email address is too long', sanitized };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long', strength: 'weak' };
  }
  
  // Check for strong password
  if (STRONG_PASSWORD_REGEX.test(password)) {
    return { isValid: true, strength: 'strong' };
  }
  
  // Check for medium password (at least uppercase, lowercase, and number)
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (hasUpper && hasLower && hasNumber) {
    return { isValid: true, strength: 'medium' };
  }
  
  return { 
    isValid: false, 
    error: 'Password must contain uppercase, lowercase, and number characters', 
    strength: 'weak' 
  };
}

/**
 * Validate workout preferences
 */
export function validateWorkoutPreferences(data: {
  preferredSplit?: string;
  weeklyGoal?: number;
  defaultDay?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.preferredSplit && !['oneADay', 'twoADay'].includes(data.preferredSplit)) {
    errors.push('Invalid workout split preference');
  }
  
  if (data.weeklyGoal !== undefined) {
    if (typeof data.weeklyGoal !== 'number' || data.weeklyGoal < 1 || data.weeklyGoal > 7) {
      errors.push('Weekly goal must be between 1 and 7 workouts');
    }
  }
  
  if (data.defaultDay !== undefined) {
    if (typeof data.defaultDay !== 'number' || data.defaultDay < 1 || data.defaultDay > 7) {
      errors.push('Default day must be between 1 and 7');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Clean old attempts
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    if (attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const remainingMs = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, remainingMs);
  }
}

// Global rate limiters
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const profileUpdateRateLimiter = new RateLimiter(10, 60 * 1000); // 10 updates per minute