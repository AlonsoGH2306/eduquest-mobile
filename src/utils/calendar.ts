const pad = (value: number) => String(value).padStart(2, '0');

const toCalendarStamp = (date: Date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
  `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;

interface CalendarSession {
  title: string;
  description: string | null;
  scheduledAt: string;
  endsAt?: string | null;
  meetingUrl: string | null;
  groupName: string | null;
}

export const buildGoogleCalendarUrl = (session: CalendarSession, durationMinutes = 60) => {
  const start = new Date(session.scheduledAt);
  const end = session.endsAt ? new Date(session.endsAt) : new Date(start.getTime() + durationMinutes * 60_000);
  const details = [
    session.description,
    session.groupName ? `Grupo de estudio: ${session.groupName}` : null,
    session.meetingUrl ? `Enlace de la llamada: ${session.meetingUrl}` : null,
    'Agendado desde EduQuest.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
    details,
  });
  if (session.meetingUrl) params.set('location', session.meetingUrl);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
