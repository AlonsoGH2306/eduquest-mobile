import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppTheme } from '../theme';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + 6, backgroundColor: theme.colors.inverseSurface }]}
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons name="wifi-off" size={16} color={theme.colors.inverseOnSurface} />
      <Text variant="labelMedium" style={{ color: theme.colors.inverseOnSurface }}>
        Sin conexión. Verás lo último que se cargó.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
});
