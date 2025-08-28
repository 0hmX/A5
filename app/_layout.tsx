import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import "@/global.css";
import useDbStore from '@/store/dbStore';
import useModelStore from '@/store/modelStore';
import { router, SplashScreen, Stack } from 'expo-router';
import { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useInitialAndroidBarSync } from '@/lib/useColorScheme';
import { ThemeProvider } from '@react-navigation/native';

export {
  ErrorBoundary
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const theme = useTheme()

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        const { init: initDb } = useDbStore.getState();
        const { initializeModels } = useModelStore.getState();
        await initDb();
        await initializeModels();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppInitialized(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isAppInitialized) {
    return (
      <AnimatedSplashScreen>
        <Image source={require('@/assets/images/splash-icon.png')} style={{ width: 200, height: 200 }} />
      </AnimatedSplashScreen>
    );
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <Suspense fallback={
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" />
            </View>
          }>
            <Stack>
              <Stack.Screen
                name="index"
                options={{
                  title: "Chat",
                  headerLeft: () => (
                    <Button variant="ghost" onPress={() => router.push('/sessionManager')}>
                      <Text>Sessions</Text>
                    </Button>
                  ),
                  headerRight: () => (
                    <Button variant="ghost" onPress={() => router.push('/models')}>
                      <Text>Models</Text>
                    </Button>
                  ),
                }}
              />
              <Stack.Screen name="models" options={{ title: "Models", presentation: "modal" }} />
              <Stack.Screen name="sessionManager" options={{ title: "Sessions", presentation: "modal" }} />
            </Stack>
          </Suspense>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

RootLayout.displayName = "RootLayout"