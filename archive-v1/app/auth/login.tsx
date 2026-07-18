// app/auth/login.tsx - Enhanced Login screen with modern UI
import React, { useState } from 'react';
import { Alert, Platform, Dimensions } from 'react-native';
import { validateEmail, authRateLimiter } from '../../utils/validation';
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  H1,
  Card,
  Separator,
  Spinner,
} from 'tamagui';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Dumbbell } from '@tamagui/lucide-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useAppTheme } from '../../components/ThemeProvider';
import { PageContainer } from '../../components/Layout/PageContainer';
import { AppButton } from '../../components/Button/AppButton';
import { SignInData } from '../../types/auth';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();
  const { width: screenWidth } = Dimensions.get('window');

  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignInData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Enhanced validation with rate limiting
  const validateForm = (): boolean => {
    const newErrors: Partial<SignInData> = {};
    
    // Rate limiting check
    if (!authRateLimiter.isAllowed(formData.email)) {
      const remainingTime = authRateLimiter.getRemainingTime(formData.email);
      Alert.alert('Too Many Attempts', `Please wait ${Math.ceil(remainingTime / 60000)} minutes before trying again.`);
      return false;
    }
    
    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Basic password validation for login (less strict than registration)
    if (!formData.password || formData.password.length < 1) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSignIn = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    authService.logAuthEvent('Sign in attempt', { email: formData.email });

    try {
      const result = await signIn(formData.email, formData.password);

      if (result.success) {
        authService.logAuthEvent('Sign in success');
        router.replace('/');
      } else {
        const errorMessage = authService.formatAuthError(result.error || 'Sign in failed');
        Alert.alert('Sign In Failed', errorMessage);
        authService.logAuthEvent('Sign in failed', { error: result.error });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input focus
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // Navigate to register
  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  // Navigate to forgot password
  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <PageContainer>
      <YStack flex={1} paddingHorizontal={spacing.large} paddingTop={spacing.xxxlarge}>
        {/* Enhanced Header */}
        <YStack alignItems="center" marginBottom={spacing.xxxlarge}>
          {/* Logo/Icon */}
          <YStack
            backgroundColor={colors.buttonBackground}
            borderRadius={borderRadius.xlarge}
            padding={spacing.large}
            marginBottom={spacing.large}
            style={getShadow('medium')}
          >
            <Dumbbell size={32} color={colors.textOnPrimary} />
          </YStack>

          <H1
            color={colors.text}
            fontSize={fontSize.xxxlarge}
            fontWeight="bold"
            textAlign="center"
          >
            Welcome Back
          </H1>
          <Text
            color={colors.textMuted}
            fontSize={fontSize.medium}
            textAlign="center"
            marginTop={spacing.small}
            maxWidth={screenWidth * 0.8}
          >
            Sign in to continue your fitness journey
          </Text>
        </YStack>

        {/* Enhanced Login Form Card */}
        <Card
          backgroundColor={colors.card}
          padding={spacing.xlarge}
          borderRadius={borderRadius.xlarge}
          marginBottom={spacing.large}
          style={getShadow('large')}
          borderWidth={1}
          borderColor={colors.borderLight}
        >
          <YStack space={spacing.large}>
            {/* Email Input */}
            <YStack space={spacing.xs}>
              <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                Email Address
              </Text>
              <XStack
                backgroundColor={focusedField === 'email' ? colors.background : colors.backgroundAlt}
                borderRadius={borderRadius.large}
                borderWidth={2}
                borderColor={
                  errors.email
                    ? colors.error
                    : focusedField === 'email'
                    ? colors.buttonBackground
                    : colors.border
                }
                alignItems="center"
                paddingHorizontal={spacing.medium}
                height={56}
                style={[
                  getShadow(focusedField === 'email' ? 'medium' : 'small'),
                  {
                    transition: 'all 0.2s ease-in-out',
                  }
                ]}
              >
                <Mail
                  size={20}
                  color={focusedField === 'email' ? colors.buttonBackground : colors.textMuted}
                />
                <Input
                  flex={1}
                  borderWidth={0}
                  backgroundColor="transparent"
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  value={formData.email}
                  onChangeText={(email) => {
                    setFormData(prev => ({ ...prev, email }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  onFocus={() => handleFocus('email')}
                  onBlur={handleBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  fontSize={fontSize.medium}
                  color={colors.text}
                />
              </XStack>
              {errors.email && (
                <XStack space={spacing.xs} alignItems="center">
                  <Text color={colors.error} fontSize={fontSize.small}>
                    {errors.email}
                  </Text>
                </XStack>
              )}
            </YStack>

            {/* Password Input */}
            <YStack space={spacing.xs}>
              <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                Password
              </Text>
              <XStack
                backgroundColor={focusedField === 'password' ? colors.background : colors.backgroundAlt}
                borderRadius={borderRadius.large}
                borderWidth={2}
                borderColor={
                  errors.password
                    ? colors.error
                    : focusedField === 'password'
                    ? colors.buttonBackground
                    : colors.border
                }
                alignItems="center"
                paddingHorizontal={spacing.medium}
                height={56}
                style={[
                  getShadow(focusedField === 'password' ? 'medium' : 'small'),
                  {
                    transition: 'all 0.2s ease-in-out',
                  }
                ]}
              >
                <Lock
                  size={20}
                  color={focusedField === 'password' ? colors.buttonBackground : colors.textMuted}
                />
                <Input
                  flex={1}
                  borderWidth={0}
                  backgroundColor="transparent"
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={formData.password}
                  onChangeText={(password) => {
                    setFormData(prev => ({ ...prev, password }));
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  onFocus={() => handleFocus('password')}
                  onBlur={handleBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  fontSize={fontSize.medium}
                  color={colors.text}
                />
                <Button
                  size="$2"
                  backgroundColor="transparent"
                  onPress={() => setShowPassword(!showPassword)}
                  padding={spacing.xs}
                  pressStyle={{ opacity: 0.7 }}
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      color={focusedField === 'password' ? colors.buttonBackground : colors.textMuted}
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={focusedField === 'password' ? colors.buttonBackground : colors.textMuted}
                    />
                  )}
                </Button>
              </XStack>
              {errors.password && (
                <XStack space={spacing.xs} alignItems="center">
                  <Text color={colors.error} fontSize={fontSize.small}>
                    {errors.password}
                  </Text>
                </XStack>
              )}
            </YStack>

            {/* Forgot Password Link */}
            <XStack justifyContent="flex-end">
              <Button
                backgroundColor="transparent"
                onPress={navigateToForgotPassword}
                padding={spacing.small}
                pressStyle={{ opacity: 0.7 }}
              >
                <Text
                  color={colors.buttonBackground}
                  fontSize={fontSize.small}
                  fontWeight="600"
                >
                  Forgot Password?
                </Text>
              </Button>
            </XStack>

            {/* Enhanced Sign In Button */}
            <AppButton
              label={isSubmitting || isLoading ? "Signing In..." : "Sign In"}
              variant="primary"
              size="large"
              onPress={handleSignIn}
              disabled={isSubmitting || isLoading}
              loading={isSubmitting || isLoading}
              fullWidth
              marginTop={spacing.medium}
            />
          </YStack>
        </Card>

        {/* Enhanced Divider */}
        <XStack alignItems="center" marginVertical={spacing.large}>
          <Separator flex={1} borderColor={colors.border} />
          <Text
            color={colors.textMuted}
            paddingHorizontal={spacing.medium}
            fontSize={fontSize.small}
            backgroundColor={colors.background}
          >
            Don't have an account?
          </Text>
          <Separator flex={1} borderColor={colors.border} />
        </XStack>

        {/* Enhanced Register Button */}
        <AppButton
          label="Create Account"
          variant="secondary"
          size="large"
          onPress={navigateToRegister}
          disabled={isSubmitting || isLoading}
          fullWidth
        />
      </YStack>
    </PageContainer>
  );
}