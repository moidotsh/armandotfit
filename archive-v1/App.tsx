import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, YStack, Text } from 'tamagui';
import config from './tamagui.config';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from './components/ThemeProvider';
import { useEffect } from 'react';

export default function App() {
  const colorScheme = useColorScheme();
  
  // This helps ensure Tamagui styles are properly applied on web
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add(`${colorScheme === 'dark' ? 'dark' : 'light'}-theme`);
    }
  }, [colorScheme]);
  
  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
      <ThemeProvider>
        <YStack 
          flex={1} 
          backgroundColor="$background" 
          alignItems="center" 
          justifyContent="center"
        >
          <Text fontSize={30} fontWeight="bold" color="$color">
            Arman.fit
          </Text>
          <StatusBar style="auto" />
        </YStack>
      </ThemeProvider>
    </TamaguiProvider>
  );
}