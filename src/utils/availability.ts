import type { Availability } from '../types';

export const AVAILABILITY_OPTIONS: { value: Availability; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible', color: '#10B981' },
  { value: 'BUSY', label: 'Ocupado', color: '#EF4444' },
  { value: 'AWAY', label: 'Ausente', color: '#F59E0B' },
  { value: 'INVISIBLE', label: 'Invisible', color: '#94A3B8' },
];

export const availabilityColor = (availability?: Availability | null, online = true) =>
  !online ? '#CBD5E1' : (AVAILABILITY_OPTIONS.find((option) => option.value === availability)?.color ?? '#10B981');

export const availabilityLabel = (availability?: Availability | null) =>
  AVAILABILITY_OPTIONS.find((option) => option.value === availability)?.label ?? 'Disponible';

export const STATUS_EMOJIS = ['📚', '💻', '🧠', '☕', '🎧', '🏃', '😴', '🎉'];
