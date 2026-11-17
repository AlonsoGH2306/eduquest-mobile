import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS, useAppTheme } from '../theme';

interface ActionTileProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  loading?: boolean;
  badge?: number;
}

export function ActionTile({ icon, label, onPress, active = false, loading = false, badge = 0 }: ActionTileProps) {
  const theme = useAppTheme();
  const tint = active ? theme.colors.mintInk : theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={badge > 0 ? `${label}, ${badge}` : label}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: active ? theme.colors.mintSoft : theme.colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View>
        {loading ? <ActivityIndicator size="small" color={tint} /> : <MaterialCommunityIcons name={icon} size={24} color={tint} />}
        {badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={[styles.label, { color: theme.colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 20,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
  },
});
