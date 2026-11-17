import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, useAppTheme } from '../theme';
import { Lumi } from './Lumi';

interface StateViewProps {
  kind: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function StateView({ kind, title, message, icon, actionLabel, onAction, compact }: StateViewProps) {
  const theme = useAppTheme();

  if (kind === 'loading') {
    return (
      <View style={[styles.container, compact && styles.compact]} accessibilityLabel={message ?? 'Cargando'}>
        <ActivityIndicator size="large" />
        {message ? (
          <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.muted }]}>
            {message}
          </Text>
        ) : null}
      </View>
    );
  }

  const isError = kind === 'error';
  const iconName = icon ?? (isError ? 'wifi-alert' : 'notebook-outline');

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {compact ? (
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isError ? theme.colors.errorContainer : theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={26}
            color={isError ? theme.colors.error : theme.colors.primary}
          />
        </View>
      ) : (
        <View style={styles.lumi}>
          <Lumi mood={isError ? 'off' : 'sleepy'} size={96} />
        </View>
      )}
      {title ? (
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.ink }]}>
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.muted }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button mode={isError ? 'contained-tonal' : 'contained'} onPress={onAction} style={styles.action} icon={isError ? 'refresh' : undefined}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.lg,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  lumi: {
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.md,
  },
});
