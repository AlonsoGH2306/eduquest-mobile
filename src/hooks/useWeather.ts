import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getCurrentWeather } from '../services/weatherService';
import type { Weather } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';

const FALLBACK_COORDS = { latitude: -12.0464, longitude: -77.0428, name: 'Lima' };

const POSITION_TIMEOUT_MS = 8000;
const GEOCODE_TIMEOUT_MS = 4000;

type PermissionState = 'checking' | 'granted' | 'denied' | 'unavailable';

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

async function resolvePosition(): Promise<{
  latitude: number;
  longitude: number;
  placeName: string;
  isApproximate: boolean;
  permission: PermissionState;
}> {
  const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
  if (!servicesEnabled) {
    return { ...FALLBACK_COORDS, placeName: FALLBACK_COORDS.name, isApproximate: true, permission: 'unavailable' };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    return { ...FALLBACK_COORDS, placeName: FALLBACK_COORDS.name, isApproximate: true, permission: 'denied' };
  }

  const position =
    (await withTimeout(Location.getLastKnownPositionAsync(), GEOCODE_TIMEOUT_MS)) ??
    (await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      POSITION_TIMEOUT_MS
    ));
  if (!position) {
    return { ...FALLBACK_COORDS, placeName: FALLBACK_COORDS.name, isApproximate: true, permission: 'unavailable' };
  }
  const { latitude, longitude } = position.coords;

  const places = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), GEOCODE_TIMEOUT_MS);
  const place = places?.[0];
  const placeName = place?.city || place?.district || place?.region || 'Tu ubicación';

  return { latitude, longitude, placeName, isApproximate: false, permission: 'granted' };
}

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('checking');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const position = await resolvePosition();
        if (controller.signal.aborted) return;
        setPermission(position.permission);
        const current = await getCurrentWeather(position.latitude, position.longitude, controller.signal);
        setWeather({ ...current, placeName: position.placeName, isApproximate: position.isApproximate });
      } catch (err) {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { weather, loading, error, permission, reload };
}
