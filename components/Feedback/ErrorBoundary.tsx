// components/Feedback/ErrorBoundary.tsx - Enhanced error boundary
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { Text, YStack } from 'tamagui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component to catch and display errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <EmptyState
          message="Something went wrong. Please try again."
          actionText="Reload"
          onAction={() => {
            this.setState({ hasError: false, error: undefined });
            // In a real app, you might want to reload the page or navigate
          }}
          icon={
            <YStack
              width={60}
              height={60}
              borderRadius={30}
              backgroundColor="#FFE5E5"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={24}>⚠️</Text>
            </YStack>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;