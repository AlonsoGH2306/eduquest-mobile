import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { HomeStackParamList, StudySession, TabParamList } from '../types';
import { getMySessions } from '../services/groupService';
import { Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { buildGoogleCalendarUrl } from '../utils/calendar';
import { useToast } from '../hooks/useContexts';
import { spacing, useAppTheme } from '../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Calendar'>,
  BottomTabScreenProps<TabParamList>
>;

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' });
const DAY_TITLE = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' });

const pad = (value: number) => String(value).padStart(2, '0');
const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const sameDay = (a: Date, b: Date) => isoDate(a) === isoDate(b);

const buildGrid = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from(
    { length: 42 },
    (_, index) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + index)
  );
};

export function CalendarScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => buildGrid(month), [month]);

  const load = useCallback(
    (signal?: AbortSignal) => {
      const last = days[41];
      setError(null);
      setSessions(null);
      getMySessions(isoDate(days[0]), isoDate(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)), signal)
        .then(setSessions)
        .catch((err) => {
          if (!isCanceled(err)) setError(getErrorMessage(err));
        });
    },
    [days]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    for (const session of sessions ?? []) {
      const key = isoDate(new Date(session.scheduledAt));
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return map;
  }, [sessions]);

  const daySessions = byDay.get(isoDate(selected)) ?? [];
  const changeMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <Screen>
      <View style={styles.monthBar}>
        <IconButton icon="chevron-left" onPress={() => changeMonth(-1)} accessibilityLabel="Mes anterior" />
        <Pressable
          onPress={() => {
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelected(today);
          }}
          accessibilityRole="button"
          accessibilityLabel="Ir a hoy"
        >
          <Text variant="titleMedium" style={[styles.monthLabel, { color: theme.colors.ink }]}>
            {MONTH.format(month)}
          </Text>
        </Pressable>
        <IconButton icon="chevron-right" onPress={() => changeMonth(1)} accessibilityLabel="Mes siguiente" />
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((day, index) => (
          <Text key={index} variant="labelSmall" style={[styles.weekday, { color: theme.colors.muted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const count = byDay.get(isoDate(day))?.length ?? 0;
          const isSelected = sameDay(day, selected);
          const isToday = sameDay(day, today);
          const inMonth = day.getMonth() === month.getMonth();
          return (
            <Pressable
              key={isoDate(day)}
              onPress={() => setSelected(day)}
              accessibilityRole="button"
              accessibilityLabel={`${DAY_TITLE.format(day)}, ${count} sesiones`}
              style={[styles.cell, { opacity: inMonth ? 1 : 0.35 }]}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: theme.colors.primary },
                  !isSelected && isToday && { borderWidth: 1.5, borderColor: theme.colors.primary },
                ]}
              >
                <Text style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.ink, fontWeight: isToday ? '700' : '400' }}>
                  {day.getDate()}
                </Text>
              </View>
              <View style={styles.dots}>
                {Array.from({ length: Math.min(count, 3) }, (_, index) => (
                  <View key={index} style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text variant="titleMedium" style={[styles.dayTitle, { color: theme.colors.ink }]}>
        {DAY_TITLE.format(selected)}
      </Text>

      {error ? (
        <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={() => load()} />
      ) : sessions === null ? (
        <ActivityIndicator style={{ marginTop: spacing.md }} />
      ) : daySessions.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          No hay asesorías este día.
        </Text>
      ) : (
        daySessions.map((session) => (
          <Pressable
            key={session.id}
            onPress={() =>
              session.groupId
                ? navigation.navigate('Groups', { screen: 'GroupDetail', params: { groupId: session.groupId } })
                : undefined
            }
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.session,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.timeBar, { backgroundColor: session.attending ? theme.colors.primary : theme.colors.outlineVariant }]} />
            <View style={styles.sessionBody}>
              <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
                {session.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                {TIME.format(new Date(session.scheduledAt))} – {TIME.format(new Date(session.endsAt))}
                {session.groupName ? ` · ${session.groupName}` : ''}
              </Text>
              {session.attending && !session.finished ? (
                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
                  Confirmaste tu asistencia
                </Text>
              ) : null}
            </View>
            <IconButton
              icon="google"
              size={20}
              accessibilityLabel={`Añadir ${session.title} a Google Calendar`}
              onPress={() =>
                Linking.openURL(buildGoogleCalendarUrl(session)).catch(() =>
                  showToast('No pudimos abrir Google Calendar.', 'error')
                )
              }
            />
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    textTransform: 'capitalize',
  },
  week: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dayTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  timeBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  sessionBody: {
    flex: 1,
  },
});
