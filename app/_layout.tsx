// File location: ./App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Text, YStack, Button } from 'tamagui';
import config from 'tamagui.config';

export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <TamaguiProvider config={config}>
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="#fff">
        <Text fontSize={24} fontWeight="bold">Hello World!</Text>
        <Text marginTop={10} marginBottom={20}>Welcome to your Expo + Tamagui + Bun app</Text>
        
        <Text fontSize={18} marginBottom={10}>Count: {count}</Text>
        <Button 
          size="$4" 
          theme="blue"
          onPress={() => setCount(count + 1)}>
          Increment
        </Button>
        
        <StatusBar style="auto" />
      </YStack>
    </TamaguiProvider>
  );
}