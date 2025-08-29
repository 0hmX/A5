import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

export function InfiniteProgressBar() {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '300%'],
  });

  return (
    <View className="w-full h-2 bg-border rounded-full overflow-hidden">
      <Animated.View
        className="h-full w-1/3 bg-primary rounded-full"
        style={{
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}