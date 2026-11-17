import { AppState } from 'react-native';
import { API_ORIGIN } from './api';
import { tokenStorage } from './tokenStorage';

export type RealtimeEvent =
  | {
      type: 'group.message';
      action: 'created' | 'updated' | 'deleted';
      groupId: number;
      channelId: number | null;
      message: unknown;
    }
  | { type: 'group.channels'; groupId: number }
  | { type: 'group.voice'; groupId: number; participants: unknown }
  | { type: 'group.studyroom'; groupId: number; room: unknown }
  | { type: 'room.message'; action: 'created' | 'updated' | 'deleted'; roomId: number; message: unknown }
  | { type: 'room.updated'; roomId: number }
  | { type: 'direct.message'; action: 'created' | 'updated' | 'deleted'; senderId: number; recipientId: number; message: unknown }
  | { type: 'typing'; userId: number; username: string; groupId?: number }
  | { type: 'forum'; questionId: number | null }
  | { type: 'pong' };

type Listener = (event: RealtimeEvent) => void;

const PING_INTERVAL_MS = 25000;
const MAX_BACKOFF_MS = 30000;
const SOCKET_URL = `${API_ORIGIN.replace(/^http/, 'ws')}/ws`;

class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(connected: boolean) => void>();
  private retries = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private active = false;

  constructor() {
    AppState.addEventListener('change', (state) => {
      if (state === 'active' && this.active && !this.socket) {
        this.retries = 0;
        this.clearTimers();
        void this.open();
      }
    });
  }

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
    };
  }

  onStatus(listener: (connected: boolean) => void) {
    this.statusListeners.add(listener);
    listener(this.connected);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  send(payload: Record<string, unknown>) {
    if (this.connected) this.socket?.send(JSON.stringify(payload));
  }

  start() {
    if (this.active) return;
    this.active = true;
    void this.open();
  }

  stop() {
    this.active = false;
    this.clearTimers();
    this.socket?.close();
    this.socket = null;
    this.retries = 0;
  }

  private async open() {
    const token = await tokenStorage.getAccessToken();
    if (!this.active || this.socket) return;
    if (!token) {
      this.scheduleReconnect();
      return;
    }
    const socket = new WebSocket(`${SOCKET_URL}?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onopen = () => {
      this.retries = 0;
      this.emitStatus(true);
      this.pingTimer = setInterval(() => this.send({ type: 'ping' }), PING_INTERVAL_MS);
    };
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as RealtimeEvent;
        this.listeners.forEach((listener) => listener(event));
      } catch {
        return;
      }
    };
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      this.clearTimers();
      this.emitStatus(false);
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (!this.active || this.reconnectTimer !== null) return;
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.retries);
    this.retries += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.open();
    }, delay);
  }

  private clearTimers() {
    if (this.pingTimer !== null) clearInterval(this.pingTimer);
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    this.pingTimer = null;
    this.reconnectTimer = null;
  }

  private emitStatus(connected: boolean) {
    this.statusListeners.forEach((listener) => listener(connected));
  }
}

export const realtime = new RealtimeClient();
