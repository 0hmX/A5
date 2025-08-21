import { Stack } from 'expo-router';
import { ThemedView } from '../components/ThemedView';

export default function RootLayout() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="modal/downloader" options={{ presentation: 'modal', title: 'Downloading' }} />
      </Stack>
    </ThemedView>
  );
}