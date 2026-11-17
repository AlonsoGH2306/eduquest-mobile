import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { FONTS, spacing, useAppTheme } from '../theme';

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenTitle({ title, subtitle, right }: ScreenTitleProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: theme.colors.ink }]} accessibilityRole="header">
          {title.toLocaleUpperCase('es')}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.muted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.xs,
    maxWidth: 340,
  },
});
