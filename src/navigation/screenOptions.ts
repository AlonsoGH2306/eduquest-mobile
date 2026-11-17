import { useMemo } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { FONTS, useAppTheme } from '../theme';

export function useStackScreenOptions(): NativeStackNavigationOptions {
  const theme = useAppTheme();
  return useMemo(
    () => ({
      headerShadowVisible: false,
      headerStyle: { backgroundColor: theme.colors.background },
      headerTintColor: theme.colors.ink,
      headerTitleStyle: { fontFamily: FONTS.display, fontSize: 16 },
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor: theme.colors.background },
    }),
    [theme]
  );
}
