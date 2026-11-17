import { api } from './api';
import type { ChatRoom, RoomMessage, SendMessagePayload } from '../types';

export const getRooms = (signal?: AbortSignal) => api.get<ChatRoom[]>('/rooms', { signal }).then((r) => r.data);

export const getRoom = (roomId: number, signal?: AbortSignal) =>
  api.get<ChatRoom>(`/rooms/${roomId}`, { signal }).then((r) => r.data);

export const createRoom = (name: string, memberIds: number[]) =>
  api.post<ChatRoom>('/rooms', { name, memberIds }).then((r) => r.data);

export const updateRoom = (roomId: number, payload: { name?: string; addMemberIds?: number[] }) =>
  api.patch<ChatRoom>(`/rooms/${roomId}`, payload).then((r) => r.data);

export const leaveRoom = (roomId: number) => api.post(`/rooms/${roomId}/leave`).then(() => undefined);

export const getRoomMessages = (roomId: number, cursor: { after?: number; before?: number } = {}, signal?: AbortSignal) =>
  api.get<RoomMessage[]>(`/rooms/${roomId}/messages`, { params: cursor, signal }).then((r) => r.data);

export const sendRoomMessage = (roomId: number, payload: SendMessagePayload) =>
  api.post<RoomMessage>(`/rooms/${roomId}/messages`, payload).then((r) => r.data);

export const editRoomMessage = (roomId: number, messageId: number, content: string) =>
  api.put<RoomMessage>(`/rooms/${roomId}/messages/${messageId}`, { content }).then((r) => r.data);

export const deleteRoomMessage = (roomId: number, messageId: number) =>
  api.delete<RoomMessage>(`/rooms/${roomId}/messages/${messageId}`).then((r) => r.data);

export const markRoomRead = (roomId: number) => api.post(`/rooms/${roomId}/read`).then(() => undefined);
