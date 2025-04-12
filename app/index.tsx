import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  useColorScheme
} from 'react-native';
import { 
  ChestPressIcon, 
  LegPressIcon, 
  RowIcon, 
  LateralRaiseIcon, 
  BicepCurlIcon, 
  CalfRaiseIcon 
} from '../components/ExerciseIcons';

// Today's workout data - in a real app this would come from a data source
const todaysWorkout = {
  title: "Full Body Day 1",
  exercises: [
    { 
      name: "Incline Barbell Press", 
      icon: (color: string) => <ChestPressIcon color={color} size={26} />,
      type: "chest"
    },
    { 
      name: "Leg Press", 
      icon: (color: string) => <LegPressIcon color={color} size={26} />,
      type: "legs"
    },
    { 
      name: "Barbell Row", 
      icon: (color: string) => <RowIcon color={color} size={26} />,
      type: "back" 
    },
    { 
      name: "Lateral Raises", 
      icon: (color: string) => <LateralRaiseIcon color={color} size={26} />,
      type: "shoulders"
    },
    { 
      name: "EZ-Bar Curl", 
      icon: (color: string) => <BicepCurlIcon color={color} size={26} />,
      type: "arms"
    },
    { 
      name: "Seated Calf Raise", 
      icon: (color: string) => <CalfRaiseIcon color={color} size={26} />,
      type: "legs"
    }
  ]
};

export default function TodaysWorkoutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  
  // Background colors
  const backgroundColor = isDark ? '#121212' : '#F5F5F5';
  const cardColor = isDark ? '#222222' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtitleColor = isDark ? '#FF9500' : '#FF9500';
  const arrowColor = isDark ? '#555555' : '#CCCCCC';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.todaysText, { color: subtitleColor }]}>TODAY'S</Text>
          <Text style={[styles.titleText, { color: textColor }]}>{todaysWorkout.title}</Text>
        </View>
      
        <View style={styles.exerciseList}>
          {todaysWorkout.exercises.map((exercise, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.exerciseCard, { backgroundColor: cardColor }]}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseContent}>
                {exercise.icon(textColor)}
                <Text style={[styles.exerciseName, { color: textColor }]}>
                  {exercise.name}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: arrowColor }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  todaysText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 40,
    fontWeight: '700',
  },
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  exerciseName: {
    fontSize: 22,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
  }
});