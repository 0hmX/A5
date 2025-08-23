/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const theme = useColorScheme() ?? 'light';
  return Colors[theme];
}
