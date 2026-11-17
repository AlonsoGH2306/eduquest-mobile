import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { useAppTheme } from '../theme';

interface PlanProgressProps {
  completed: number;
  total: number;
  compact?: boolean;
  inverted?: boolean;
}

export function PlanProgress({ completed, total, compact = false, inverted = false }: PlanProgressProps) {
  const theme = useAppTheme();
  if (total === 0) return null;
  const ratio = completed / total;
  const color = ratio === 1 ? theme.colors.success : inverted ? theme.colors.onPrimary : theme.colors.primary;

  return (
    <View style={compact ? styles.compact : styles.full}>
      {!compact && (
        <View style={styles.labels}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {completed} de {total} pasos
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {Math.round(ratio * 100)}%
          </Text>
        </View>
      )}
      <ProgressBar
        progress={ratio}
        color={color}
        style={[styles.bar, inverted && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
        accessibilityLabel={`Progreso del plan: ${Math.round(ratio * 100)} por ciento`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    marginTop: 12,
  },
  compact: {
    marginTop: 8,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
});
