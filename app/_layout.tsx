import LoadingGate from '@/components/LoadingGate';
import "@/global.css";
import useDbStore from '@/store/dbStore';
import useModelStore from '@/store/modelStore';
import { Stack } from 'expo-router';
import { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';


import { NAV_THEME } from '@/constants/theme';
import { useColorScheme, useInitialAndroidBarSync } from '@/lib/useColorScheme';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export {
  ErrorBoundary
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();


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
      <KeyboardProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <NavThemeProvider value={NAV_THEME[colorScheme]}>
              <Suspense fallback={<View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>}>
                <LoadingGate onInitialized={() => setIsAppInitialized(true)}>
                  {isAppInitialized && (
                    <Stack>
                      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                    </Stack>
                  )}
                </LoadingGate>
              </Suspense>
            </NavThemeProvider>
          </BottomSheetModalProvider>
        </ GestureHandlerRootView>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}