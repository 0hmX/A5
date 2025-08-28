import { useTheme } from '@/hooks/useTheme';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function AnimatedSplashScreen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);

  opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </View>
  );
}
