// app/auth/register.tsx - Enhanced Registration screen with workout preferences
import React, { useState } from 'react';
import { Alert, ScrollView, Dimensions } from 'react-native';
import { validateEmail, validatePassword, validateDisplayName, authRateLimiter } from '../../utils/validation';
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
  Switch,
} from 'tamagui';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User, Target, Dumbbell } from '@tamagui/lucide-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useAppTheme } from '../../components/ThemeProvider';
import { PageContainer } from '../../components/Layout/PageContainer';
import { AppButton } from '../../components/Button/AppButton';
import { SignUpData } from '../../types/auth';

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth();
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();
  const { width: screenWidth } = Dimensions.get('window');

  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    preferredSplit: 'oneADay',
    weeklyGoal: 4,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignUpData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Handle input focus
  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // Enhanced validation with sanitization
  const validateForm = (): boolean => {
    const newErrors: Partial<SignUpData> = {};
    
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

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    const firstNameValidation = validateDisplayName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error;
    }

    // Last name validation
    const lastNameValidation = validateDisplayName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSignUp = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    authService.logAuthEvent('Sign up attempt', { email: formData.email });

    try {
      const result = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferredSplit: formData.preferredSplit,
        weeklyGoal: formData.weeklyGoal,
        defaultDay: 1,
        isOnboardingComplete: false,
      });
      
      if (result.success) {
        authService.logAuthEvent('Sign up success');
        
        // Check if message indicates email confirmation needed
        const needsConfirmation = result.message?.includes('check your email');
        
        if (needsConfirmation) {
          Alert.alert(
            'Check Your Email!', 
            result.message || 'Please check your email to confirm your account.',
            [{ 
              text: 'OK', 
              onPress: () => router.push('/auth/login')
            }]
          );
        } else {
          // User is already confirmed and logged in
          Alert.alert(
            'Welcome!', 
            result.message || 'Account created successfully!',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        }
      } else {
        const errorMessage = authService.formatAuthError(result.error || 'Registration failed');
        Alert.alert('Registration Failed', errorMessage);
        authService.logAuthEvent('Sign up failed', { error: result.error });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to login
  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <PageContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack flex={1} paddingHorizontal={spacing.large} paddingTop={spacing.xxxlarge} paddingBottom={spacing.xxxlarge}>
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
              Create Account
            </H1>
            <Text
              color={colors.textMuted}
              fontSize={fontSize.medium}
              textAlign="center"
              marginTop={spacing.small}
              maxWidth={screenWidth * 0.8}
            >
              Join Armandotfit and start your fitness journey
            </Text>
          </YStack>

          {/* Enhanced Registration Form */}
          <YStack space={spacing.large}>
            {/* Personal Information Section */}
            <Card
              backgroundColor={colors.card}
              padding={spacing.xlarge}
              borderRadius={borderRadius.xlarge}
              style={getShadow('large')}
              borderWidth={1}
              borderColor={colors.borderLight}
            >
              <YStack space={spacing.large}>
                <YStack alignItems="center" marginBottom={spacing.medium}>
                  <User size={24} color={colors.buttonBackground} />
                  <Text
                    color={colors.text}
                    fontSize={fontSize.xlarge}
                    fontWeight="600"
                    marginTop={spacing.small}
                  >
                    Personal Information
                  </Text>
                </YStack>

                {/* First Name */}
                <YStack space={spacing.xs}>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                    First Name
                  </Text>
                  <XStack
                    backgroundColor={focusedField === 'firstName' ? colors.background : colors.backgroundAlt}
                    borderRadius={borderRadius.large}
                    borderWidth={2}
                    borderColor={
                      errors.firstName
                        ? colors.error
                        : focusedField === 'firstName'
                        ? colors.buttonBackground
                        : colors.border
                    }
                    alignItems="center"
                    paddingHorizontal={spacing.medium}
                    height={56}
                    style={[
                      getShadow(focusedField === 'firstName' ? 'medium' : 'small'),
                      {
                        transition: 'all 0.2s ease-in-out',
                      }
                    ]}
                  >
                    <User
                      size={20}
                      color={focusedField === 'firstName' ? colors.buttonBackground : colors.textMuted}
                    />
                    <Input
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      placeholder="Enter your first name"
                      placeholderTextColor={colors.textMuted}
                      value={formData.firstName}
                      onChangeText={(firstName) => {
                        setFormData(prev => ({ ...prev, firstName }));
                        if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
                      }}
                      onFocus={() => handleFocus('firstName')}
                      onBlur={handleBlur}
                      autoCapitalize="words"
                      fontSize={fontSize.medium}
                      color={colors.text}
                    />
                  </XStack>
                  {errors.firstName && (
                    <XStack space={spacing.xs} alignItems="center">
                      <Text color={colors.error} fontSize={fontSize.small}>
                        {errors.firstName}
                      </Text>
                    </XStack>
                  )}
                </YStack>

                {/* Last Name */}
                <YStack space={spacing.xs}>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                    Last Name
                  </Text>
                  <XStack
                    backgroundColor={focusedField === 'lastName' ? colors.background : colors.backgroundAlt}
                    borderRadius={borderRadius.large}
                    borderWidth={2}
                    borderColor={
                      errors.lastName
                        ? colors.error
                        : focusedField === 'lastName'
                        ? colors.buttonBackground
                        : colors.border
                    }
                    alignItems="center"
                    paddingHorizontal={spacing.medium}
                    height={56}
                    style={[
                      getShadow(focusedField === 'lastName' ? 'medium' : 'small'),
                      {
                        transition: 'all 0.2s ease-in-out',
                      }
                    ]}
                  >
                    <User
                      size={20}
                      color={focusedField === 'lastName' ? colors.buttonBackground : colors.textMuted}
                    />
                    <Input
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      placeholder="Enter your last name"
                      placeholderTextColor={colors.textMuted}
                      value={formData.lastName}
                      onChangeText={(lastName) => {
                        setFormData(prev => ({ ...prev, lastName }));
                        if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
                      }}
                      onFocus={() => handleFocus('lastName')}
                      onBlur={handleBlur}
                      autoCapitalize="words"
                      fontSize={fontSize.medium}
                      color={colors.text}
                    />
                  </XStack>
                  {errors.lastName && (
                    <XStack space={spacing.xs} alignItems="center">
                      <Text color={colors.error} fontSize={fontSize.small}>
                        {errors.lastName}
                      </Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </Card>

            {/* Account Security Section */}
            <Card
              backgroundColor={colors.card}
              padding={spacing.xlarge}
              borderRadius={borderRadius.xlarge}
              style={getShadow('large')}
              borderWidth={1}
              borderColor={colors.borderLight}
            >
              <YStack space={spacing.large}>
                <YStack alignItems="center" marginBottom={spacing.medium}>
                  <Mail size={24} color={colors.buttonBackground} />
                  <Text
                    color={colors.text}
                    fontSize={fontSize.xlarge}
                    fontWeight="600"
                    marginTop={spacing.small}
                  >
                    Account Security
                  </Text>
                </YStack>

                {/* Email */}
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

                {/* Password */}
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
                      placeholder="Create a password"
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

                {/* Confirm Password */}
                <YStack space={spacing.xs}>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                    Confirm Password
                  </Text>
                  <XStack
                    backgroundColor={focusedField === 'confirmPassword' ? colors.background : colors.backgroundAlt}
                    borderRadius={borderRadius.large}
                    borderWidth={2}
                    borderColor={
                      errors.confirmPassword
                        ? colors.error
                        : focusedField === 'confirmPassword'
                        ? colors.buttonBackground
                        : colors.border
                    }
                    alignItems="center"
                    paddingHorizontal={spacing.medium}
                    height={56}
                    style={[
                      getShadow(focusedField === 'confirmPassword' ? 'medium' : 'small'),
                      {
                        transition: 'all 0.2s ease-in-out',
                      }
                    ]}
                  >
                    <Lock
                      size={20}
                      color={focusedField === 'confirmPassword' ? colors.buttonBackground : colors.textMuted}
                    />
                    <Input
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.textMuted}
                      value={formData.confirmPassword}
                      onChangeText={(confirmPassword) => {
                        setFormData(prev => ({ ...prev, confirmPassword }));
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={handleBlur}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      fontSize={fontSize.medium}
                      color={colors.text}
                    />
                    <Button
                      size="$2"
                      backgroundColor="transparent"
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      padding={spacing.xs}
                      pressStyle={{ opacity: 0.7 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          size={20}
                          color={focusedField === 'confirmPassword' ? colors.buttonBackground : colors.textMuted}
                        />
                      ) : (
                        <Eye
                          size={20}
                          color={focusedField === 'confirmPassword' ? colors.buttonBackground : colors.textMuted}
                        />
                      )}
                    </Button>
                  </XStack>
                  {errors.confirmPassword && (
                    <XStack space={spacing.xs} alignItems="center">
                      <Text color={colors.error} fontSize={fontSize.small}>
                        {errors.confirmPassword}
                      </Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </Card>

            {/* Workout Preferences Section */}
            <Card
              backgroundColor={colors.card}
              padding={spacing.xlarge}
              borderRadius={borderRadius.xlarge}
              style={getShadow('large')}
              borderWidth={1}
              borderColor={colors.borderLight}
            >
              <YStack space={spacing.large}>
                <YStack alignItems="center" marginBottom={spacing.medium}>
                  <Target size={24} color={colors.buttonBackground} />
                  <Text
                    color={colors.text}
                    fontSize={fontSize.xlarge}
                    fontWeight="600"
                    marginTop={spacing.small}
                  >
                    Workout Preferences
                  </Text>
                  <Text
                    color={colors.textMuted}
                    fontSize={fontSize.small}
                    textAlign="center"
                    marginTop={spacing.xs}
                  >
                    Customize your fitness journey
                  </Text>
                </YStack>

                {/* Preferred Split */}
                <YStack space={spacing.xs}>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                    Preferred Workout Split
                  </Text>
                  <Card
                    backgroundColor={colors.backgroundAlt}
                    padding={spacing.medium}
                    borderRadius={borderRadius.large}
                    style={getShadow('small')}
                  >
                    <YStack space={spacing.medium}>
                      {/* Single Session Option */}
                      <XStack
                        alignItems="center"
                        justifyContent="space-between"
                        paddingVertical={spacing.small}
                        paddingHorizontal={spacing.small}
                        borderRadius={borderRadius.medium}
                        backgroundColor={formData.preferredSplit === 'oneADay' ? colors.highlight : 'transparent'}
                        style={formData.preferredSplit === 'oneADay' ? getShadow('small') : undefined}
                      >
                        <YStack flex={1} marginRight={spacing.medium}>
                          <Text
                            color={colors.text}
                            fontSize={fontSize.medium}
                            fontWeight="600"
                            numberOfLines={1}
                          >
                            Single Session
                          </Text>
                          <Text
                            color={colors.textMuted}
                            fontSize={fontSize.small}
                            numberOfLines={2}
                          >
                            Complete workout in one session
                          </Text>
                        </YStack>
                        <Switch
                          checked={formData.preferredSplit === 'oneADay'}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({
                              ...prev,
                              preferredSplit: checked ? 'oneADay' : 'twoADay'
                            }))
                          }
                          backgroundColor={formData.preferredSplit === 'oneADay' ? colors.buttonBackground : colors.border}
                        />
                      </XStack>

                      {/* AM/PM Split Option */}
                      <XStack
                        alignItems="center"
                        justifyContent="space-between"
                        paddingVertical={spacing.small}
                        paddingHorizontal={spacing.small}
                        borderRadius={borderRadius.medium}
                        backgroundColor={formData.preferredSplit === 'twoADay' ? colors.highlight : 'transparent'}
                        style={formData.preferredSplit === 'twoADay' ? getShadow('small') : undefined}
                      >
                        <YStack flex={1} marginRight={spacing.medium}>
                          <Text
                            color={colors.text}
                            fontSize={fontSize.medium}
                            fontWeight="600"
                            numberOfLines={1}
                          >
                            AM/PM Split
                          </Text>
                          <Text
                            color={colors.textMuted}
                            fontSize={fontSize.small}
                            numberOfLines={2}
                          >
                            Two sessions per day
                          </Text>
                        </YStack>
                        <Switch
                          checked={formData.preferredSplit === 'twoADay'}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({
                              ...prev,
                              preferredSplit: checked ? 'twoADay' : 'oneADay'
                            }))
                          }
                          backgroundColor={formData.preferredSplit === 'twoADay' ? colors.buttonBackground : colors.border}
                        />
                      </XStack>
                    </YStack>
                  </Card>
                </YStack>

                {/* Weekly Goal */}
                <YStack space={spacing.xs}>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                    Weekly Goal (Workouts per week)
                  </Text>
                  <XStack
                    backgroundColor={focusedField === 'weeklyGoal' ? colors.background : colors.backgroundAlt}
                    borderRadius={borderRadius.large}
                    borderWidth={2}
                    borderColor={
                      focusedField === 'weeklyGoal'
                        ? colors.buttonBackground
                        : colors.border
                    }
                    alignItems="center"
                    paddingHorizontal={spacing.medium}
                    height={56}
                    style={[
                      getShadow(focusedField === 'weeklyGoal' ? 'medium' : 'small'),
                      {
                        transition: 'all 0.2s ease-in-out',
                      }
                    ]}
                  >
                    <Target
                      size={20}
                      color={focusedField === 'weeklyGoal' ? colors.buttonBackground : colors.textMuted}
                    />
                    <Input
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      placeholder="4"
                      placeholderTextColor={colors.textMuted}
                      value={formData.weeklyGoal.toString()}
                      onChangeText={(value) => {
                        const numValue = parseInt(value) || 1;
                        setFormData(prev => ({ ...prev, weeklyGoal: Math.max(1, Math.min(7, numValue)) }));
                      }}
                      onFocus={() => handleFocus('weeklyGoal')}
                      onBlur={handleBlur}
                      keyboardType="numeric"
                      fontSize={fontSize.medium}
                      color={colors.text}
                    />
                  </XStack>
                  <Text color={colors.textMuted} fontSize={fontSize.small} marginTop={spacing.xs}>
                    Recommended: 3-5 workouts per week
                  </Text>
                </YStack>
              </YStack>
            </Card>

            {/* Enhanced Sign Up Button */}
            <AppButton
              label={isSubmitting || isLoading ? "Creating Account..." : "Create Account"}
              variant="primary"
              size="large"
              onPress={handleSignUp}
              disabled={isSubmitting || isLoading}
              loading={isSubmitting || isLoading}
              fullWidth
              marginTop={spacing.medium}
            />
          </YStack>

          {/* Enhanced Divider */}
          <XStack alignItems="center" marginVertical={spacing.xlarge}>
            <Separator flex={1} borderColor={colors.border} />
            <Text
              color={colors.textMuted}
              paddingHorizontal={spacing.medium}
              fontSize={fontSize.small}
              backgroundColor={colors.background}
            >
              Already have an account?
            </Text>
            <Separator flex={1} borderColor={colors.border} />
          </XStack>

          {/* Enhanced Login Button */}
          <AppButton
            label="Sign In Instead"
            variant="secondary"
            size="large"
            onPress={navigateToLogin}
            disabled={isSubmitting || isLoading}
            fullWidth
            marginBottom={spacing.large}
          />
        </YStack>
      </ScrollView>
    </PageContainer>
  );
}