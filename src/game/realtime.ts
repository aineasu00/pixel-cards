import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type { GameEvent, NetworkStatus } from './types';

type Listener = (event: GameEvent) => void;
type StatusListener = (status: NetworkStatus) => void;

export interface RealtimeRoom {
  send(event: GameEvent): void;
  onEvent(listener: Listener): () => void;
  onStatus(listener: StatusListener): () => void;
  close(): void;
  status: NetworkStatus;
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function connectRoom(roomCode: string): RealtimeRoom {
  if (url && anonKey) return connectSupabase(roomCode, url, anonKey);
  return connectLocal(roomCode);
}

function connectSupabase(roomCode: string, supabaseUrl: string, key: string): RealtimeRoom {
  const client: SupabaseClient = createClient(supabaseUrl, key);
  const listeners = new Set<Listener>();
  const statusListeners = new Set<StatusListener>();
  let status: NetworkStatus = 'reconnecting';
  const channel: RealtimeChannel = client.channel(`room:${roomCode}`, {
    config: { broadcast: { self: true }, presence: { key: getPresenceKey() } },
  });

  const setStatus = (next: NetworkStatus) => {
    status = next;
    statusListeners.forEach((listener) => listener(status));
  };

  channel
    .on('broadcast', { event: 'game' }, (payload) => {
      const event = payload.payload as GameEvent;
      if (event.roomCode === roomCode) listeners.forEach((listener) => listener(event));
    })
    .subscribe((state) => {
      if (state === 'SUBSCRIBED') {
        channel.track({ online_at: new Date().toISOString() });
        setStatus('connected');
      } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
        setStatus('reconnecting');
      } else if (state === 'CLOSED') {
        setStatus('disconnected');
      }
    });

  return {
    get status() {
      return status;
    },
    send(event) {
      channel.send({ type: 'broadcast', event: 'game', payload: event });
    },
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onStatus(listener) {
      statusListeners.add(listener);
      listener(status);
      return () => statusListeners.delete(listener);
    },
    close() {
      channel.unsubscribe();
      client.removeChannel(channel);
      setStatus('disconnected');
    },
  };
}

function connectLocal(roomCode: string): RealtimeRoom {
  const listeners = new Set<Listener>();
  const statusListeners = new Set<StatusListener>();
  const channel = new BroadcastChannel(`pixel-cards:${roomCode}`);
  let status: NetworkStatus = 'local';
  channel.onmessage = (message: MessageEvent<GameEvent>) => {
    if (message.data.roomCode === roomCode) listeners.forEach((listener) => listener(message.data));
  };
  return {
    get status() {
      return status;
    },
    send(event) {
      channel.postMessage(event);
      window.setTimeout(() => listeners.forEach((listener) => listener(event)), 0);
    },
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onStatus(listener) {
      statusListeners.add(listener);
      listener(status);
      return () => statusListeners.delete(listener);
    },
    close() {
      channel.close();
      status = 'disconnected';
      statusListeners.forEach((listener) => listener(status));
    },
  };
}

function getPresenceKey(): string {
  const key = 'pixel-cards-presence-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}
