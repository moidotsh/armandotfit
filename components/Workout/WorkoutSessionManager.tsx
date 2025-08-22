// components/Workout/WorkoutSessionManager.tsx - Main workout session management
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Card } from 'tamagui';
import { Plus, Play, Pause, Square, Save, Clock, Target } from '@tamagui/lucide-icons';
import { 
  WorkoutSession, 
  LoggedExercise, 
  ExerciseTemplate,
  RepRange,
  ExerciseCategory,
  ExerciseEquipment,
  REP_RANGES 
} from '../../types/workout';
import { ExerciseLogger } from './ExerciseLogger';
import { ExerciseSelector } from './ExerciseSelector';
import { useAppTheme } from '../ThemeProvider';

interface WorkoutSessionManagerProps {
  splitType: 'oneADay' | 'twoADay';
  day: number;
  sessionType?: 'AM' | 'PM';
  onSaveSession: (session: WorkoutSession) => Promise<void>;
  onCancel: () => void;
}

export function WorkoutSessionManager({
  splitType,
  day,
  sessionType,
  onSaveSession,
  onCancel
}: WorkoutSessionManagerProps) {
  const { colors, spacing } = useAppTheme();
  
  const [session, setSession] = useState<WorkoutSession>({
    id: `session_${Date.now()}`,
    date: new Date().toISOString(),
    splitType,
    day,
    sessionType,
    exercises: [],
    totalDuration: 0,
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [isActive, setIsActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');

  // Session timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        const startTime = new Date(session.startTime);
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setSessionTimer(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, session.startTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setIsActive(true);
    setSession(prev => ({
      ...prev,
      startTime: new Date().toISOString()
    }));
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const addExercise = (exerciseTemplate: ExerciseTemplate) => {
    const newExercise: LoggedExercise = {
      id: `exercise_${Date.now()}`,
      exerciseName: exerciseTemplate.name,
      equipment: exerciseTemplate.defaultEquipment,
      sets: [],
      totalSets: 0,
      targetRepRange: exerciseTemplate.defaultRepRange,
      startTime: new Date().toISOString()
    };

    setSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
      updatedAt: new Date().toISOString()
    }));

    setCurrentExerciseIndex(session.exercises.length);
    setShowExerciseSelector(false);
  };

  const updateExercise = (exerciseId: string, updatedExercise: LoggedExercise) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? updatedExercise : ex
      ),
      updatedAt: new Date().toISOString()
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId),
      updatedAt: new Date().toISOString()
    }));

    // Adjust current exercise index if needed
    if (currentExerciseIndex >= session.exercises.length - 1) {
      setCurrentExerciseIndex(Math.max(0, session.exercises.length - 2));
    }
  };

  const finishSession = async () => {
    const endTime = new Date().toISOString();
    const startTime = new Date(session.startTime);
    const duration = Math.floor((Date.now() - startTime.getTime()) / 60000); // in minutes

    const completedSession: WorkoutSession = {
      ...session,
      endTime,
      totalDuration: duration,
      notes: sessionNotes,
      updatedAt: endTime
    };

    try {
      await onSaveSession(completedSession);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const getSessionStats = () => {
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = session.exercises.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed).reduce((repSum, s) => repSum + s.reps, 0), 0
    );
    const totalVolume = session.exercises.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed && s.weight).reduce((volSum, s) => volSum + (s.weight! * s.reps), 0), 0
    );

    return { totalSets, totalReps, totalVolume };
  };

  const stats = getSessionStats();

  return (
    <YStack flex={1} backgroundColor={colors.background}>
      {/* Session Header */}
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium} marginBottom={spacing.medium}>
        <YStack space={spacing.medium}>
          {/* Title and Timer */}
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize={20} fontWeight="600" color={colors.text}>
                {splitType} - Day {day} {sessionType && `(${sessionType})`}
              </Text>
              <Text fontSize={14} color={colors.textMuted}>
                {new Date().toLocaleDateString()}
              </Text>
            </YStack>
            
            <XStack alignItems="center" space={spacing.small}>
              <Clock size={20} color={colors.primary} />
              <Text fontSize={18} fontWeight="600" color={colors.text}>
                {formatTime(sessionTimer)}
              </Text>
            </XStack>
          </XStack>

          {/* Session Controls */}
          <XStack space={spacing.small}>
            {!isActive && sessionTimer === 0 && (
              <Button flex={1} theme="blue" onPress={startSession} icon={<Play size={16} />}>
                Start Workout
              </Button>
            )}
            
            {!isActive && sessionTimer > 0 && (
              <Button flex={1} theme="blue" onPress={resumeSession} icon={<Play size={16} />}>
                Resume
              </Button>
            )}
            
            {isActive && (
              <Button flex={1} variant="outlined" onPress={pauseSession} icon={<Pause size={16} />}>
                Pause
              </Button>
            )}
            
            <Button 
              flex={1} 
              theme="green" 
              onPress={finishSession}
              disabled={session.exercises.length === 0}
              icon={<Save size={16} />}
            >
              Finish
            </Button>
            
            <Button variant="outlined" onPress={onCancel} icon={<Square size={16} />}>
              Cancel
            </Button>
          </XStack>

          {/* Session Stats */}
          <XStack space={spacing.large}>
            <YStack alignItems="center">
              <Text fontSize={12} color={colors.textMuted}>Exercises</Text>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {session.exercises.length}
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize={12} color={colors.textMuted}>Sets</Text>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {stats.totalSets}
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize={12} color={colors.textMuted}>Reps</Text>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {stats.totalReps}
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize={12} color={colors.textMuted}>Volume</Text>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {stats.totalVolume.toLocaleString()}
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>

      {/* Exercise List */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack paddingHorizontal={spacing.medium} space={spacing.medium}>
          {session.exercises.map((exercise, index) => (
            <ExerciseLogger
              key={exercise.id}
              exercise={exercise}
              onUpdateExercise={(updatedExercise) => updateExercise(exercise.id, updatedExercise)}
              onRemoveExercise={() => removeExercise(exercise.id)}
              isActive={index === currentExerciseIndex}
            />
          ))}

          {/* Add Exercise Button */}
          <Card backgroundColor={colors.cardAlt} padding={spacing.medium}>
            <Button
              theme="blue"
              onPress={() => setShowExerciseSelector(true)}
              icon={<Plus size={20} />}
            >
              Add Exercise
            </Button>
          </Card>

          {/* Session Notes */}
          <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack space={spacing.small}>
              <Text fontSize={16} fontWeight="500" color={colors.text}>
                Workout Notes
              </Text>
              <Input
                placeholder="How did the workout feel? Any observations..."
                value={sessionNotes}
                onChangeText={setSessionNotes}
                multiline
                height={80}
              />
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          onSelectExercise={addExercise}
          onCancel={() => setShowExerciseSelector(false)}
        />
      )}
    </YStack>
  );
}