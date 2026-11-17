import type { StudyRoom } from '../types';

export interface StudyRoomPhase {
  phase: 'FOCUS' | 'BREAK';
  secondsLeft: number;
  round: number;
}

export const clockOffset = (room: StudyRoom) => new Date(room.serverTime).getTime() - Date.now();

export function phaseOf(room: StudyRoom, offset: number, now = Date.now()): StudyRoomPhase | null {
  if (!room.active || !room.startedAt) return null;
  const focus = room.focusMinutes * 60;
  const pause = room.breakMinutes * 60;
  const elapsed = Math.max(0, Math.floor((now + offset - new Date(room.startedAt).getTime()) / 1000));
  const cycle = focus + pause;
  const inCycle = elapsed % cycle;
  const round = Math.floor(elapsed / cycle) + 1;
  return inCycle < focus
    ? { phase: 'FOCUS', secondsLeft: focus - inCycle, round }
    : { phase: 'BREAK', secondsLeft: cycle - inCycle, round };
}

export const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
