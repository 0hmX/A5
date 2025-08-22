import { Stack } from 'expo-router';
import 'react-native-get-random-values';
import { ThemedView } from '../components/ThemedView';

export default function RootLayout() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      </Stack>
    </ThemedView>
  );
}