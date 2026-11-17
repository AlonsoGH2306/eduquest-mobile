import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface RatingInputProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

const STARS = [1, 2, 3, 4, 5];

export function RatingInput({ value, onChange, size = 28 }: RatingInputProps) {
  const theme = useAppTheme();
  const starColor = theme.dark ? '#ffd25e' : '#e0a100';
  const colorFor = (star: number) => (star <= value ? starColor : theme.colors.outline);
  const iconFor = (star: number) => (star <= value ? 'star' : 'star-outline');

  if (!onChange) {
    return (
      <View style={styles.row} accessibilityLabel={`${value} de 5 estrellas`}>
        {STARS.map((star) => (
          <MaterialCommunityIcons key={star} name={iconFor(star)} size={size} color={colorFor(star)} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={`${value} de 5 estrellas`}>
      {STARS.map((star) => (
        <IconButton
          key={star}
          icon={iconFor(star)}
          iconColor={colorFor(star)}
          size={size}
          onPress={() => onChange(star)}
          accessibilityLabel={`${star} estrellas`}
          style={styles.star}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    margin: 0,
  },
});
