import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { FONTS, useAppTheme } from '../theme';

interface FocusRingProps {
  progress: number;
  label: string;
  caption: string;
  size?: number;
}

export function FocusRing({ progress, label, caption, size = 260 }: FocusRingProps) {
  const theme = useAppTheme();
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{ width: size, height: size }} accessibilityRole="timer" accessibilityLabel={`${label}, ${caption}`}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.label, { color: theme.colors.ink }]}>{label}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
  },
});
