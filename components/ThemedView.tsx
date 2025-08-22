import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme'; // Import useTheme

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colors = useTheme(); // Use useTheme to get colors

  const backgroundColor = lightColor ?? darkColor ?? colors.background; // Use provided colors or default to background

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
