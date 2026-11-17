import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GROUP_COLORS, GROUP_COLOR_NAMES } from '../utils/groupAppearance';
import { BRAND, useAppTheme } from '../theme';

interface ColorSwatchesProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatches({ value, onChange }: ColorSwatchesProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {GROUP_COLORS.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={GROUP_COLOR_NAMES[color] ?? color}
            hitSlop={4}
            style={[
              styles.swatch,
              { backgroundColor: color, borderColor: selected ? theme.colors.ink : 'transparent' },
            ]}
          >
            {selected ? <MaterialCommunityIcons name="check" size={18} color={BRAND.noche} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
