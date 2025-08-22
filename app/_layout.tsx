import { Stack } from 'expo-router';
import 'react-native-get-random-values';
import { ThemedView } from '../components/ThemedView';
import { useEffect } from 'react';
import { initDB } from '../db/database';
import useAppStore from '../store/appStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { setDbInitialized } = useAppStore();

  useEffect(() => {
    const initializeDatabase = async () => {
      console.log('RootLayout: Initializing database...');
      const [success, error] = await initDB();
      if (success) {
        console.log('RootLayout: Database initialized successfully.');
        setDbInitialized(true);
      } else {
        console.error('RootLayout: Failed to initialize database:', error);
        setDbInitialized(false);
      }
    };
    initializeDatabase();
  }, [setDbInitialized]);

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