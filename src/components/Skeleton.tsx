import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { spacing, useAppTheme } from '../theme';

interface SkeletonBlockProps {
  width: DimensionValue;
  height: number;
  radius?: number;
  opacity: Animated.Value;
}

function SkeletonBlock({ width, height, radius = 8, opacity }: SkeletonBlockProps) {
  const theme = useAppTheme();
  return (
    <Animated.View
      style={{ width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceVariant, opacity }}
    />
  );
}

interface ListSkeletonProps {
  count?: number;
  avatar?: 'square' | 'circle' | 'date' | 'none';
  label?: string;
}

export function ListSkeleton({ count = 4, avatar = 'square', label = 'Cargando' }: ListSkeletonProps) {
  const theme = useAppTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View accessible accessibilityLabel={label} accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
        >
          {avatar === 'square' ? <SkeletonBlock width={48} height={48} radius={16} opacity={opacity} /> : null}
          {avatar === 'circle' ? <SkeletonBlock width={44} height={44} radius={22} opacity={opacity} /> : null}
          {avatar === 'date' ? <SkeletonBlock width={56} height={60} radius={14} opacity={opacity} /> : null}
          <View style={styles.lines}>
            <SkeletonBlock width={index % 2 === 0 ? '70%' : '55%'} height={14} opacity={opacity} />
            <SkeletonBlock width="90%" height={10} opacity={opacity} />
            <SkeletonBlock width="40%" height={10} opacity={opacity} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
});
