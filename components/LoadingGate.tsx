import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Text } from '@/components/nativewindui/Text';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
  }, [onInitialized]);

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
    <View className="flex-1 justify-center items-center bg-background px-8">
      <Animated.View style={animatedStyle} className="items-center">
        <Animated.View 
          style={pulseStyle}
          className="w-20 h-20 rounded-full justify-center items-center mb-8 bg-primary/20"
        >
          <View 
            className="w-16 h-16 rounded-full justify-center items-center bg-background"
          >
            <ProgressIndicator 
              variant="circular" 
              size="lg" 
              progress={loadingProgress}
              showPercentage
            />
          </View>
        </Animated.View>

        <Text variant="display" className="mb-2">
          a5 chat
        </Text>
        
        <Text 
          variant="body"
          className="mb-8 text-center text-muted-foreground"
        >
          Initializing your AI experience
        </Text>

        <View className="w-64 mb-4">
          <ProgressIndicator 
            variant="linear" 
            size="md" 
            progress={loadingProgress}
            className="mb-2"
          />
        </View>

        <Text 
          variant="caption"
          className="mb-8 text-muted-foreground"
        >
          {loadingProgress < 30 && "Loading models..."}
          {loadingProgress >= 30 && loadingProgress < 70 && "Setting up database..."}
          {loadingProgress >= 70 && loadingProgress < 100 && "Almost ready..."}
          {loadingProgress >= 100 && "Ready!"}
        </Text>

        <ProgressIndicator 
          variant="dots" 
          size="md" 
          indeterminate
          className="mb-4"
        />
      </Animated.View>

      <View className="absolute bottom-16 left-8 right-8">
        <View className="flex-row justify-center gap-2 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-1 h-1"
            >
              <ProgressIndicator 
                variant="linear" 
                size="sm" 
                progress={i < (loadingProgress / 25) ? 100 : 0}
              />
            </View>
          ))}
        </View>
        
        <Text 
          variant="caption"
          className="text-center text-muted-foreground/50"
        >
          Please wait while we prepare everything for you
        </Text>
      </View>
    </View>
  );
}