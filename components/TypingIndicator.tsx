import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

const Dot = ({ delay }: { delay: number }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(sequence).start();
  }, [animation, delay]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Animated.View
      className="w-2 h-2 rounded-full bg-foreground"
      style={[{ transform: [{ translateY }] }]}
    />
  );
};

export const TypingIndicator = () => {
  return (
    <View className="p-3 rounded-lg mb-2 max-w-[25%] self-start bg-card">
      <View className="flex-row gap-1.5 items-center px-2 py-1">
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </View>
    </View>
  );
};
