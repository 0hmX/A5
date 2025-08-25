import { Stack } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import useDbStore from '../store/dbStore';
import useModelStore from '../store/modelStore';

export default function RootLayout() {
  useEffect(() => {
    const initializeStores = async () => {
      const { init: initDb } = useDbStore.getState();
      const { initializeModels } = useModelStore.getState();
      await initDb();
      await initializeModels();
    };
    initializeStores();
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