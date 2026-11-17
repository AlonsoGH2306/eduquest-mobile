import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { Screen } from '../components/Screen';
import { FocusRing } from '../components/FocusRing';
import { usePhoneOrientation } from '../hooks/usePhoneOrientation';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useToast } from '../hooks/useContexts';
import { formatTimer } from '../utils/format';
import { spacing, useAppTheme } from '../theme';

const DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '25', label: '25 min' },
  { value: '50', label: '50 min' },
];

export function FocusModeScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { availability, orientation, isFaceDown } = usePhoneOrientation();
  const { status, remaining, completed, progress, duration, start, pause, reset, setMinutes } = useFocusTimer(25);
  const [autoMode, setAutoMode] = useState(true);
  const wasFaceDown = useRef(false);
  const lastCompleted = useRef(0);

  const sensorReady = availability === 'available';

  useEffect(() => {
    if (completed > lastCompleted.current) {
      lastCompleted.current = completed;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      showToast('Bloque completado. Toma 5 minutos de descanso.', 'success');
    }
  }, [completed, showToast]);

  useEffect(() => {
    if (!sensorReady || !autoMode) return;
    if (isFaceDown && !wasFaceDown.current && (status === 'idle' || status === 'paused')) {
      start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    if (!isFaceDown && wasFaceDown.current && status === 'running') {
      pause();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    wasFaceDown.current = isFaceDown;
  }, [isFaceDown, sensorReady, autoMode, status, start, pause]);

  const caption =
    status === 'running'
      ? 'Concentración activa'
      : status === 'paused'
        ? 'En pausa'
        : status === 'done'
          ? 'Bloque completado'
          : sensorReady && autoMode
            ? 'Pon el celular boca abajo'
            : 'Listo para empezar';

  const sensorMessage =
    availability === 'checking'
      ? 'Revisando el acelerómetro…'
      : availability === 'unavailable'
        ? 'Tu dispositivo no tiene acelerómetro. Usa los botones para controlar el temporizador.'
        : `Sensor activo. Posición actual: ${orientation.toLowerCase()}.`;

  return (
    <Screen>
      <SegmentedButtons
        value={String(duration / 60)}
        onValueChange={(value) => setMinutes(Number(value))}
        buttons={DURATIONS.map((option) => ({ ...option, disabled: status !== 'idle' }))}
        style={styles.segment}
      />

      <View style={styles.ring}>
        <FocusRing progress={progress} label={formatTimer(remaining)} caption={caption} />
      </View>

      <Text variant="bodyMedium" style={[styles.sensor, { color: theme.colors.muted }]}>
        {sensorMessage}
      </Text>

      <View style={styles.actions}>
        {status === 'running' ? (
          <Button mode="contained-tonal" icon="pause" onPress={pause}>
            Pausar
          </Button>
        ) : status === 'done' ? (
          <Button mode="contained" icon="restart" onPress={reset}>
            Otro bloque
          </Button>
        ) : (
          <Button mode="contained" icon="play" onPress={start}>
            {status === 'paused' ? 'Continuar' : 'Empezar'}
          </Button>
        )}
        {status === 'running' || status === 'paused' ? (
          <Button mode="outlined" icon="stop" onPress={reset}>
            Reiniciar
          </Button>
        ) : null}
      </View>

      {sensorReady ? (
        <Button
          mode="text"
          icon={autoMode ? 'cellphone-arrow-down' : 'gesture-tap'}
          onPress={() => setAutoMode((value) => !value)}
          style={styles.toggle}
        >
          {autoMode ? 'Control con el sensor activado' : 'Control manual activado'}
        </Button>
      ) : null}

      <View style={[styles.counter, { borderColor: theme.colors.outlineVariant }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.ink }}>
          Bloques completados hoy: {completed}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: 2 }}>
          Cada bloque es un pomodoro. Después de cuatro, descansa 20 minutos.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    marginBottom: spacing.lg,
  },
  ring: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  sensor: {
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  toggle: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  counter: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
