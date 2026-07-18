// components/AuthGuard.tsx - Route protection component
import React, { useEffect } from 'react';
import { useSegments, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { AuthState } from '../types/auth';
import { LoadingScreen } from './LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authState, isAuthenticated } = useAuth();
  const segments = useSegments();

  console.log('AuthGuard - authState:', authState, 'isAuthenticated:', isAuthenticated, 'segments:', segments);

  useEffect(() => {
    // Don't navigate while auth is loading
    if (authState === AuthState.LOADING) {
      console.log('Auth still loading');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    console.log('inAuthGroup:', inAuthGroup, 'segments[0]:', segments[0]);

    // Use setTimeout to ensure router is ready
    const timer = setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        // User is not authenticated and trying to access protected route
        console.log('Redirecting to login - user not authenticated');
        router.replace('/auth/login');
      } else if (isAuthenticated && inAuthGroup) {
        // User is authenticated but on auth screen
        console.log('Redirecting to home - user already authenticated');
        router.replace('/');
      } else {
        console.log('No redirect needed');
      }
    }, 1);

    return () => clearTimeout(timer);
  }, [authState, isAuthenticated, segments]);

  // Show loading screen only while auth state is being determined
  if (authState === AuthState.LOADING) {
    console.log('Showing loading screen - auth loading');
    return <LoadingScreen />;
  }

  console.log('Rendering children');
  return <>{children}</>;
}