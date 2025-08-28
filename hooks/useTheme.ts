/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { THEME } from '@/constants/theme';
import { useColorScheme } from '@/lib/useColorScheme';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  return THEME[colorScheme];
}