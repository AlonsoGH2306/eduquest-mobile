export type StickerAnimation = 'bounce' | 'wiggle' | 'pulse' | 'spin' | 'float' | 'shake';

export interface PackSticker {
  code: string;
  emoji: string;
  label: string;
  colors: [string, string];
  animation: StickerAnimation;
}

export const STICKER_PACK: PackSticker[] = [
  { code: 'bravo', emoji: '👏', label: '¡Bravo!', colors: ['#f59e0b', '#ef4444'], animation: 'shake' },
  { code: 'gracias', emoji: '🙏', label: '¡Gracias!', colors: ['#10b981', '#0ea5e9'], animation: 'pulse' },
  { code: 'genio', emoji: '🧠', label: '¡Genio!', colors: ['#8b5cf6', '#ec4899'], animation: 'pulse' },
  { code: 'aprobe', emoji: '✅', label: '¡Aprobé!', colors: ['#22c55e', '#15803d'], animation: 'bounce' },
  { code: 'estudiando', emoji: '📚', label: 'Estudiando', colors: ['#6366f1', '#0ea5e9'], animation: 'float' },
  { code: 'cafe', emoji: '☕', label: 'Modo café', colors: ['#a16207', '#78350f'], animation: 'float' },
  { code: 'ayuda', emoji: '🆘', label: '¡Ayuda!', colors: ['#ef4444', '#b91c1c'], animation: 'shake' },
  { code: 'fuego', emoji: '🔥', label: '¡Qué nivel!', colors: ['#f97316', '#dc2626'], animation: 'wiggle' },
  { code: 'pensando', emoji: '🤔', label: 'Pensando…', colors: ['#64748b', '#334155'], animation: 'wiggle' },
  { code: 'sueno', emoji: '😴', label: 'Me duermo', colors: ['#6366f1', '#312e81'], animation: 'float' },
  { code: 'fiesta', emoji: '🎉', label: '¡A celebrar!', colors: ['#ec4899', '#f59e0b'], animation: 'bounce' },
  { code: 'cien', emoji: '💯', label: '100/100', colors: ['#dc2626', '#9333ea'], animation: 'pulse' },
  { code: 'examen', emoji: '📝', label: 'Examen mañana', colors: ['#0ea5e9', '#1d4ed8'], animation: 'shake' },
  { code: 'deacuerdo', emoji: '👌', label: 'De acuerdo', colors: ['#14b8a6', '#0f766e'], animation: 'wiggle' },
  { code: 'jaja', emoji: '😂', label: 'Jajaja', colors: ['#facc15', '#f97316'], animation: 'bounce' },
  { code: 'equipo', emoji: '🤝', label: '¡Equipazo!', colors: ['#3b82f6', '#8b5cf6'], animation: 'spin' },
];

const PREFIX = 'pack:';

export const packCode = (code: string) => `${PREFIX}${code}`;

export const findPackSticker = (value: string) =>
  value.startsWith(PREFIX) ? STICKER_PACK.find((sticker) => sticker.code === value.slice(PREFIX.length)) ?? null : null;
