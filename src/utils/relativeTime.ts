import { formatDate } from './format';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const timeAgo = (value?: string | null): string => {
  if (!value) return 'sin actividad reciente';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return '';
  if (diff < MINUTE) return 'hace un momento';
  if (diff < HOUR) return `hace ${Math.round(diff / MINUTE)} min`;
  if (diff < DAY) return `hace ${Math.round(diff / HOUR)} h`;
  const days = Math.round(diff / DAY);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return `el ${formatDate(value)}`;
};
