import type { ChatReply } from '../types';

export const DELETED_LABEL = 'Mensaje eliminado';

interface ChatMessageLike {
  id: number;
  content: string;
  imageUrl?: string | null;
  fileName?: string | null;
  sticker?: string | null;
  deleted?: boolean;
  replyTo?: ChatReply | null;
}

export const mergeById = <T extends { id: number }>(current: T[], incoming: T[]) => {
  const known = new Set(current.map((message) => message.id));
  return [...current, ...incoming.filter((message) => !known.has(message.id))];
};

export const replaceMessage = <T extends ChatMessageLike>(current: T[], updated: T) =>
  current.map((message) => {
    if (message.id === updated.id) return updated;
    if (message.replyTo?.id === updated.id && updated.deleted) {
      return { ...message, replyTo: { ...message.replyTo, preview: DELETED_LABEL, deleted: true } };
    }
    return message;
  });

export const previewOf = (message: ChatMessageLike) => {
  if (message.deleted) return DELETED_LABEL;
  if (message.content) {
    const text = message.content.replace(/\|\|[^|\n]+\|\|/g, '[spoiler]');
    return text.length > 90 ? `${text.slice(0, 89)}…` : text;
  }
  if (message.sticker) return 'Sticker';
  if (message.fileName) return /\.(mp4|webm|mov)$/i.test(message.fileName) ? 'Video' : `Archivo: ${message.fileName}`;
  return message.imageUrl ? 'Imagen' : '';
};
