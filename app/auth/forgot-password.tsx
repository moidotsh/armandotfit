// app/auth/forgot-password.tsx - Enhanced Password reset screen
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { validateEmail, authRateLimiter } from '../../utils/validation';
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H1,
  Card,
  Spinner,
} from 'tamagui';
import { router } from 'expo-router';
import { Mail, ArrowLeft } from '@tamagui/lucide-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useAppTheme } from '../../components/ThemeProvider';
import { PageContainer } from '../../components/Layout/PageContainer';
import { ResetPasswordData } from '../../types/auth';

export default function ForgotPasswordScreen() {
  const { resetPassword, isLoading } = useAuth();
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  
  const [formData, setFormData] = useState<ResetPasswordData>({
    email: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Enhanced validation with rate limiting
  const validateForm = (): boolean => {
    // Rate limiting check
    if (!authRateLimiter.isAllowed(formData.email)) {
      const remainingTime = authRateLimiter.getRemainingTime(formData.email);
      setError(`Too many attempts. Please wait ${Math.ceil(remainingTime / 60000)} minutes before trying again.`);
      return false;
    }
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return false;
    }
    setError('');
    return true;
  };

  // Handle form submission
  const handleResetPassword = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    authService.logAuthEvent('Password reset attempt', { email: formData.email });

    try {
      const result = await resetPassword(formData.email);
      
      if (result.success) {
        authService.logAuthEvent('Password reset email sent');
        setEmailSent(true);
      } else {
        const errorMessage = authService.formatAuthError(result.error || 'Password reset failed');
        setError(errorMessage);
        authService.logAuthEvent('Password reset failed', { error: result.error });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate back to login
  const navigateToLogin = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <PageContainer>
        <YStack flex={1} paddingHorizontal={spacing.large} paddingTop={spacing.xxxlarge}>
          {/* Header */}
          <YStack alignItems="center" marginBottom={spacing.xxxlarge}>
            <H1 color={colors.text} fontSize={fontSize.xxxlarge} fontWeight="bold">
              Check Your Email
            </H1>
            <Text color={colors.textMuted} fontSize={fontSize.medium} textAlign="center" marginTop={spacing.small}>
              We've sent password reset instructions to {formData.email}
            </Text>
          </YStack>

          {/* Success Card */}
          <Card
            backgroundColor={colors.card}
            padding={spacing.large}
            borderRadius={borderRadius.large}
            marginBottom={spacing.large}
          >
            <YStack space={spacing.medium} alignItems="center">
              <YStack
                backgroundColor={colors.success}
                borderRadius={borderRadius.circle}
                width={80}
                height={80}
                alignItems="center"
                justifyContent="center"
              >
                <Mail size={40} color="white" />
              </YStack>
              
              <Text color={colors.text} fontSize={fontSize.large} fontWeight="600" textAlign="center">
                Email Sent Successfully
              </Text>
              
              <Text color={colors.textMuted} fontSize={fontSize.medium} textAlign="center">
                Click the link in the email to reset your password. The link will expire in 24 hours.
              </Text>
              
              <Text color={colors.textMuted} fontSize={fontSize.small} textAlign="center">
                Didn't receive the email? Check your spam folder or try again.
              </Text>
            </YStack>
          </Card>

          {/* Action Buttons */}
          <YStack space={spacing.medium}>
            <Button
              backgroundColor={colors.buttonBackground}
              color="white"
              fontWeight="bold"
              fontSize={fontSize.large}
              height={56}
              borderRadius={borderRadius.medium}
              onPress={() => handleResetPassword()}
              disabled={isSubmitting}
            >
              <Text color="white" fontWeight="bold">Resend Email</Text>
            </Button>

            <Button
              backgroundColor="transparent"
              borderWidth={1}
              borderColor={colors.buttonBackground}
              color={colors.buttonBackground}
              fontWeight="bold"
              fontSize={fontSize.large}
              height={56}
              borderRadius={borderRadius.medium}
              onPress={navigateToLogin}
            >
              <XStack alignItems="center" space={spacing.small}>
                <ArrowLeft size={20} color={colors.buttonBackground} />
                <Text color={colors.buttonBackground} fontWeight="bold">Back to Login</Text>
              </XStack>
            </Button>
          </YStack>
        </YStack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <YStack flex={1} paddingHorizontal={spacing.large} paddingTop={spacing.xxxlarge}>
        {/* Header */}
        <YStack alignItems="center" marginBottom={spacing.xxxlarge}>
          <H1 color={colors.text} fontSize={fontSize.xxxlarge} fontWeight="bold">
            Reset Password
          </H1>
          <Text color={colors.textMuted} fontSize={fontSize.medium} textAlign="center" marginTop={spacing.small}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
        </YStack>

        {/* Reset Form */}
        <Card
          backgroundColor={colors.card}
          padding={spacing.large}
          borderRadius={borderRadius.large}
          marginBottom={spacing.large}
        >
          <YStack space={spacing.medium}>
            {/* Email Input */}
            <YStack space={spacing.xs}>
              <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                Email Address
              </Text>
              <XStack
                backgroundColor={colors.backgroundAlt}
                borderRadius={borderRadius.medium}
                borderWidth={1}
                borderColor={error ? colors.error : colors.border}
                alignItems="center"
                paddingHorizontal={spacing.medium}
              >
                <Mail size={20} color={colors.textMuted} />
                <Input
                  flex={1}
                  borderWidth={0}
                  backgroundColor="transparent"
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textMuted}
                  value={formData.email}
                  onChangeText={(email) => {
                    setFormData(prev => ({ ...prev, email }));
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </XStack>
              {error && (
                <Text color={colors.error} fontSize={fontSize.small}>
                  {error}
                </Text>
              )}
            </YStack>

            {/* Send Reset Email Button */}
            <Button
              backgroundColor={colors.buttonBackground}
              color="white"
              fontWeight="bold"
              fontSize={fontSize.large}
              height={56}
              borderRadius={borderRadius.medium}
              onPress={handleResetPassword}
              disabled={isSubmitting || isLoading}
              opacity={isSubmitting || isLoading ? 0.7 : 1}
              marginTop={spacing.medium}
            >
              {isSubmitting || isLoading ? (
                <XStack alignItems="center" space={spacing.small}>
                  <Spinner size="small" color="white" />
                  <Text color="white" fontWeight="bold">Sending...</Text>
                </XStack>
              ) : (
                <Text color="white" fontWeight="bold">Send Reset Instructions</Text>
              )}
            </Button>
          </YStack>
        </Card>

        {/* Back to Login Button */}
        <Button
          backgroundColor="transparent"
          borderWidth={1}
          borderColor={colors.buttonBackground}
          color={colors.buttonBackground}
          fontWeight="bold"
          fontSize={fontSize.large}
          height={56}
          borderRadius={borderRadius.medium}
          onPress={navigateToLogin}
          disabled={isSubmitting || isLoading}
        >
          <XStack alignItems="center" space={spacing.small}>
            <ArrowLeft size={20} color={colors.buttonBackground} />
            <Text color={colors.buttonBackground} fontWeight="bold">Back to Login</Text>
          </XStack>
        </Button>
      </YStack>
    </PageContainer>
  );
}