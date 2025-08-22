import { Stack } from 'expo-router';
import 'react-native-get-random-values';
import { ThemedView } from '../components/ThemedView';
import { useEffect } from 'react';
import { initDB } from '../db/database';
import useAppStore from '../store/appStore'; // Import useAppStore

export default function RootLayout() {
  const { setDbInitialized } = useAppStore(); // Get setDbInitialized from store

  useEffect(() => {
    const initializeDatabase = async () => {
      console.log('RootLayout: Initializing database...');
      const [success, error] = await initDB();
      if (success) {
        console.log('RootLayout: Database initialized successfully.');
        setDbInitialized(true); // Set db initialized to true
      } else {
        console.error('RootLayout: Failed to initialize database:', error);
        setDbInitialized(false); // Set db initialized to false on error
      }
    };
    initializeDatabase();
  }, [setDbInitialized]); // Add setDbInitialized to dependency array

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      </Stack>
    </ThemedView>
  );
}