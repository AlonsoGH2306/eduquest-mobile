import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWeather } from '../hooks/useWeather';
import { describeWeather } from '../utils/weatherCodes';
import { FONTS, spacing, useAppTheme } from '../theme';

export function WeatherStrip() {
  const theme = useAppTheme();
  const { weather, loading, error, permission, reload } = useWeather();

  if (loading) {
    return (
      <View style={[styles.strip, { backgroundColor: theme.colors.surfaceVariant }]}>
        <ActivityIndicator size="small" />
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          Buscando el clima de tu zona…
        </Text>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <Pressable
        onPress={reload}
        accessibilityRole="button"
        style={[styles.strip, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <MaterialCommunityIcons name="cloud-off-outline" size={22} color={theme.colors.muted} />
        <Text variant="bodyMedium" style={[styles.flex, { color: theme.colors.muted }]}>
          No pudimos cargar el clima. Toca para reintentar.
        </Text>
      </Pressable>
    );
  }

  const description = describeWeather(weather.weatherCode, weather.isDay, weather.temperature);

  return (
    <View style={[styles.strip, { backgroundColor: theme.colors.surfaceVariant }]}>
      <MaterialCommunityIcons
        name={description.icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={34}
        color={theme.colors.primary}
      />
      <View style={styles.flex}>
        <View style={styles.headline}>
          <Text style={[styles.temperature, { color: theme.colors.ink }]}>{weather.temperature}°</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {description.label} en {weather.placeName}
          </Text>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
          {description.studyTip}
        </Text>
        {weather.isApproximate ? (
          <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: 4 }}>
            {permission === 'denied'
              ? 'Sin permiso de ubicación: usamos Lima como referencia.'
              : 'No pudimos ubicarte (GPS apagado o sin señal): usamos Lima como referencia.'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
  },
  flex: {
    flex: 1,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  temperature: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 26,
    lineHeight: 30,
  },
});
