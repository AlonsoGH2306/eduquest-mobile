import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { StudyRoom } from '../types';
import { clockOffset, formatCountdown, phaseOf } from '../utils/studyRoom';
import { spacing, useAppTheme } from '../theme';

interface StudyRoomCardProps {
  room: StudyRoom | null;
  myId?: number;
  canStop: boolean;
  busy: boolean;
  onStart: (focusMinutes: number, breakMinutes: number) => void;
  onAction: (action: 'join' | 'leave' | 'stop') => void;
}

const PRESETS = [
  { focus: 25, pause: 5 },
  { focus: 50, pause: 10 },
];

export function StudyRoomCard({ room, myId, canStop, busy, onStart, onAction }: StudyRoomCardProps) {
  const theme = useAppTheme();
  const [now, setNow] = useState(Date.now());
  const offset = useMemo(() => (room ? clockOffset(room) : 0), [room]);
  const phase = room ? phaseOf(room, offset, now) : null;
  const joined = Boolean(room?.participants.some((participant) => participant.id === myId));

  useEffect(() => {
    if (!room?.active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [room?.active]);

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="timer-sand" size={20} color={theme.colors.primary} />
        <Text variant="titleSmall" style={styles.flex}>
          Sala de estudio compartida
        </Text>
        {phase ? (
          <Chip compact icon={phase.phase === 'FOCUS' ? 'brain' : 'coffee'}>
            {phase.phase === 'FOCUS' ? 'Enfoque' : 'Descanso'} · ronda {phase.round}
          </Chip>
        ) : null}
      </View>
      {room?.active && phase ? (
        <>
          <Text
            variant="displaySmall"
            style={[styles.clock, { color: phase.phase === 'FOCUS' ? theme.colors.primary : theme.colors.success }]}
            accessibilityLabel={`Quedan ${Math.ceil(phase.secondsLeft / 60)} minutos`}
          >
            {formatCountdown(phase.secondsLeft)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            {room.focusMinutes} min de enfoque · {room.breakMinutes} min de descanso ·{' '}
            {room.participants.length === 0
              ? 'nadie estudiando'
              : room.participants.map((participant) => `@${participant.username}`).join(', ')}
          </Text>
          <View style={styles.actions}>
            <Button mode={joined ? 'outlined' : 'contained'} compact disabled={busy} onPress={() => onAction(joined ? 'leave' : 'join')}>
              {joined ? 'Salir' : 'Unirme'}
            </Button>
            {canStop ? (
              <Button compact textColor={theme.colors.error} disabled={busy} onPress={() => onAction('stop')}>
                Terminar sala
              </Button>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            Estudien al mismo ritmo: todos ven el mismo temporizador Pomodoro.
          </Text>
          <View style={styles.actions}>
            {PRESETS.map((preset) => (
              <Button
                key={preset.focus}
                mode="contained-tonal"
                compact
                disabled={busy}
                onPress={() => onStart(preset.focus, preset.pause)}
              >
                {preset.focus}/{preset.pause} min
              </Button>
            ))}
          </View>
        </>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  clock: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
