import { api } from './api';
import type { Sticker } from '../types';

export const getMyStickers = (signal?: AbortSignal) =>
  api.get<Sticker[]>('/users/me/stickers', { signal }).then((r) => r.data);

export const addSticker = (imageUrl: string) =>
  api.post<Sticker>('/users/me/stickers', { imageUrl }).then((r) => r.data);

export const removeSticker = (stickerId: number) =>
  api.delete(`/users/me/stickers/${stickerId}`).then(() => undefined);
