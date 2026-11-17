import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

export type PhoneOrientation =
  | 'Boca arriba'
  | 'Boca abajo'
  | 'Vertical'
  | 'Horizontal'
  | 'En movimiento';

export const getOrientation = (x: number, y: number, z: number): PhoneOrientation => {
  if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && z > 0.8) return 'Boca arriba';
  if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && z < -0.8) return 'Boca abajo';
  if (Math.abs(y) > 0.8 && Math.abs(x) < 0.3) return 'Vertical';
  if (Math.abs(x) > 0.8 && Math.abs(y) < 0.3) return 'Horizontal';
  return 'En movimiento';
};

type Availability = 'checking' | 'available' | 'unavailable';

export function usePhoneOrientation(enabled = true) {
  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
  const [availability, setAvailability] = useState<Availability>('checking');

  useEffect(() => {
    if (!enabled) return;
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
    let cancelled = false;

    Accelerometer.isAvailableAsync()
      .then((isAvailable) => {
        if (cancelled) return;
        setAvailability(isAvailable ? 'available' : 'unavailable');
        if (!isAvailable) return;
        Accelerometer.setUpdateInterval(400);
        subscription = Accelerometer.addListener(setData);
      })
      .catch(() => {
        if (!cancelled) setAvailability('unavailable');
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  const orientation = getOrientation(x, y, z);

  return {
    availability,
    orientation,
    isFaceDown: availability === 'available' && orientation === 'Boca abajo',
  };
}
