import { Stack } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import serviceLocator from '../lib/di/ServiceLocator';
import { DatabaseService } from '../services/DatabaseService';
import { LLMServiceManager } from '../services/llm/LLMServiceManager';

export default function RootLayout() {
  useEffect(() => {
    const initializeServices = async () => {
      serviceLocator.register('DatabaseService', () => new DatabaseService());
      serviceLocator.register('LLMServiceManager', () => new LLMServiceManager());
      await serviceLocator.init();
    };
    initializeServices();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemedView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        </Stack>
      </ThemedView>
    </SafeAreaProvider>
  );
}