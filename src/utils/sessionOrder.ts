import { StudySession } from '../types';

const startOf = (session: StudySession) => new Date(session.scheduledAt).getTime();

const phaseOf = (session: StudySession, now: number) => {
  if (session.finished || new Date(session.endsAt).getTime() <= now) return 2;
  return startOf(session) <= now ? 0 : 1;
};

export const orderSessions = (sessions: StudySession[], now = Date.now()) =>
  [...sessions].sort((a, b) => {
    const phaseA = phaseOf(a, now);
    const phaseB = phaseOf(b, now);
    if (phaseA !== phaseB) return phaseA - phaseB;
    return phaseA === 2 ? startOf(b) - startOf(a) : startOf(a) - startOf(b);
  });
