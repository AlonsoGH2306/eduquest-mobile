import { StyleSheet, View } from 'react-native';
import { Badge, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface HeaderIconBadgeProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  count: number;
  label: string;
  onPress: () => void;
}

export function HeaderIconBadge({ icon, count, label, onPress }: HeaderIconBadgeProps) {
  const theme = useAppTheme();
  return (
    <View>
      <IconButton
        icon={icon}
        size={24}
        mode="contained-tonal"
        onPress={onPress}
        accessibilityLabel={count > 0 ? `${label}, ${count} sin leer` : label}
        style={styles.button}
      />
      {count > 0 ? (
        <Badge size={18} style={[styles.badge, { backgroundColor: theme.colors.error, color: theme.colors.onError }]}>
          {count > 99 ? '99+' : count}
        </Badge>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});
