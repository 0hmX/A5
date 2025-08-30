import { useColorScheme } from '@/lib/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ViewProps } from 'react-native';

// Enable NativeWind classes for LinearGradient
cssInterop(LinearGradient, {
  className: 'style',
});

const darkColors = ['rgb(0, 0, 0)', 'rgba(24, 24, 28, 1)'] as const;
const lightColors = ['rgb(242, 242, 247)', 'rgb(255, 255, 255)'] as const;

interface GradientBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export function GradientBackground({ children, ...props }: GradientBackgroundProps) {
  const { colorScheme } = useColorScheme();

  return (
    <LinearGradient
      colors={colorScheme === 'dark' ? darkColors : lightColors}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}
