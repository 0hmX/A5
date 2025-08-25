import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface LoadingGateProps {
  onInitialized: () => void;
  children: React.ReactNode;
}

export default function LoadingGate({ onInitialized, children }: LoadingGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const theme = useTheme();
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withTiming(1, { duration: 500 });
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsLoading(false);
            onInitialized();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 justify-center items-center px-8" style={{ backgroundColor: theme.colors.background }}>
      <Animated.View style={animatedStyle} className="items-center">
        <Animated.View 
          style={[pulseStyle, { backgroundColor: theme.colors.primary }]}
          className="w-20 h-20 rounded-full justify-center items-center mb-8"
        >
          <View 
            className="w-16 h-16 rounded-full justify-center items-center"
            style={{ backgroundColor: theme.colors.background }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Animated.View>

        <Text className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
          a5 chat
        </Text>
        
        <Text 
          className="text-base mb-8 text-center opacity-70"
          style={{ color: theme.colors.text }}
        >
          Initializing your AI experience
        </Text>

        <View className="w-64 h-2 rounded-full mb-4" style={{ backgroundColor: theme.colors.border }}>
          <View 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: theme.colors.primary,
              width: `${Math.min(loadingProgress, 100)}%`
            }}
          />
        </View>

        <Text 
          className="text-sm opacity-60"
          style={{ color: theme.colors.text }}
        >
          {loadingProgress < 30 && "Loading models..."}
          {loadingProgress >= 30 && loadingProgress < 70 && "Setting up database..."}
          {loadingProgress >= 70 && loadingProgress < 100 && "Almost ready..."}
          {loadingProgress >= 100 && "Ready!"}
        </Text>

        <View className="absolute -inset-4">
          <View className="flex-row justify-around items-center h-full">
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  pulseStyle,
                  { 
                    backgroundColor: theme.colors.primary,
                    animationDelay: `${i * 200}ms`
                  }
                ]}
                className="w-2 h-2 rounded-full opacity-50"
              />
            ))}
          </View>
        </View>
      </Animated.View>

      <View className="absolute bottom-16 left-8 right-8">
        <View className="flex-row justify-center gap-2 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="w-16 h-1 rounded-full"
              style={{ 
                backgroundColor: i <= (loadingProgress / 25) ? theme.colors.primary : theme.colors.border 
              }}
            />
          ))}
        </View>
        
        <Text 
          className="text-xs text-center opacity-50"
          style={{ color: theme.colors.text }}
        >
          Please wait while we prepare everything for you
        </Text>
      </View>
    </View>
  );
}