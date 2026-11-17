import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { StudySession } from '../types';

const CHANNEL_ID = 'session-reminders';
const MINUTES_BEFORE = 30;

const identifierFor = (sessionId: number) => `session-${sessionId}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de asesorías',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleSessionReminder(session: StudySession, groupName?: string): Promise<boolean> {
  const remindAt = new Date(new Date(session.scheduledAt).getTime() - MINUTES_BEFORE * 60_000);
  if (remindAt.getTime() <= Date.now() + 10_000) return false;
  if (!(await ensurePermission())) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: identifierFor(session.id),
    content: {
      title: `En ${MINUTES_BEFORE} minutos: ${session.title}`,
      body: groupName ? `Asesoría de ${groupName}. Ten listo el enlace de la llamada.` : 'Ten listo el enlace de la llamada.',
      data: { sessionId: session.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: remindAt,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

export async function cancelSessionReminder(sessionId: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifierFor(sessionId));
}

export async function syncSessionReminders(sessions: StudySession[], groupName?: string): Promise<void> {
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted) return;
  await Promise.all(
    sessions.map((session) =>
      session.attending && !session.finished
        ? scheduleSessionReminder(session, groupName)
        : cancelSessionReminder(session.id)
    )
  );
}
