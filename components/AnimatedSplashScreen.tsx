import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function AnimatedSplashScreen({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);

  opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </View>
  );
}
