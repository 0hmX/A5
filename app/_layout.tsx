import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { SessionSidebar } from '@/components/SessionSidebar';
import "@/global.css";
import useDbStore from '@/store/dbStore';
import useModelStore from '@/store/modelStore';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SplashScreen } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useInitialAndroidBarSync } from '@/lib/useColorScheme';
import { ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
          <GestureHandlerRootView>
          <BottomSheetModalProvider>
            <Drawer drawerContent={(props) => <SessionSidebar {...props} />}>
              <Drawer.Screen
                name="index"
                options={{
                  title: "Chat",
                }}
              />
            </Drawer>
          </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

RootLayout.displayName = "RootLayout"