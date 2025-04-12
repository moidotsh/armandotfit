import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, YStack, Text } from 'tamagui';
import config from './tamagui.config';
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();
  
  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
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
    </TamaguiProvider>
  );
}