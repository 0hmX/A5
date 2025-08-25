/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { NAV_THEME } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const theme = useColorScheme() ?? 'light';
  return NAV_THEME[theme];
}
