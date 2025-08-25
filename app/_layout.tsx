import { Stack } from 'expo-router';
import { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingGate from '../components/LoadingGate';
import { ThemedView } from '../components/ThemedView';
import "../global.css";
import useDbStore from '../store/dbStore';
import useModelStore from '../store/modelStore';

export default function RootLayout() {
  const [isAppInitialized, setIsAppInitialized] = useState(false);

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
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>}>
          <LoadingGate onInitialized={() => setIsAppInitialized(true)}>
            {isAppInitialized && (
              <Stack>
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              </Stack>
            )}
          </LoadingGate>
        </Suspense>
      </ThemedView>
    </SafeAreaProvider>
  );
}