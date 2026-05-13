import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import type { LiveTelemetryUpdate, DailySummaryChangedNotification } from '../types/signalr';

const SIGNALR_ENDPOINT =
  import.meta.env.VITE_SIGNALR_ENDPOINT || 'http://localhost:5001/hubs/telemetry';

const connection: HubConnection = new HubConnectionBuilder()
  .withUrl(SIGNALR_ENDPOINT)
  .withAutomaticReconnect({
    nextRetryDelayInMilliseconds: (retryContext) => {
      const schedule = [0, 2000, 5000, 10000, 30000];
      return schedule[retryContext.previousRetryCount] ?? 60000;
    }
  })
  .build();

let startPromise: Promise<void> | null = null;
let refCount = 0;
let currentRoomId: string | null = null;

type ConnectionStateHandler = (state: 'reconnecting' | 'reconnected' | 'closed') => void;
const stateHandlers = new Set<ConnectionStateHandler>();

connection.onreconnecting((err) => {
  console.warn('[SignalR] Reconnecting...', err);
  stateHandlers.forEach((h) => h('reconnecting'));
});

connection.onreconnected(async () => {
  console.info('[SignalR] Reconnected. Re-joining room:', currentRoomId);
  if (currentRoomId) {
    try {
      await connection.invoke('JoinRoom', currentRoomId);
    } catch {}
  }
  stateHandlers.forEach((h) => h('reconnected'));
});

connection.onclose((err) => {
  console.warn('[SignalR] Connection closed.', err);
  stateHandlers.forEach((h) => h('closed'));
});

export async function startSignalR(): Promise<void> {
  refCount++;

  if (connection.state === HubConnectionState.Connected) {
    return;
  }

  if (
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting
  ) {
    return startPromise ?? undefined;
  }
  if (!startPromise) {
    startPromise = connection
      .start()
      .then(() => console.info('[SignalR] Connected to', SIGNALR_ENDPOINT))
      .catch((err) => {
        startPromise = null;
        console.error('[SignalR] Failed to connect:', err);
      });
  }
  return startPromise;
}

export async function joinRoom(roomId: string): Promise<void> {
  currentRoomId = roomId;
  if (connection.state === HubConnectionState.Connected) {
    console.info('[SignalR] Joining room:', roomId);
    await connection.invoke('JoinRoom', roomId);
  }
}

export async function leaveRoom(roomId: string): Promise<void> {
  if (currentRoomId === roomId) currentRoomId = null;
  if (connection.state === HubConnectionState.Connected) {
    console.info('[SignalR] Leaving room:', roomId);
    await connection.invoke('LeaveRoom', roomId);
  }
}

export function onTelemetryUpdate(
  handler: (update: LiveTelemetryUpdate) => void,
): () => void {
  connection.on('TelemetryUpdate', handler);
  return () => connection.off('TelemetryUpdate', handler);
}

export function onDailySummaryChanged(
  handler: (notification: DailySummaryChangedNotification) => void,
): () => void {
  connection.on('DailySummaryChanged', handler);
  return () => connection.off('DailySummaryChanged', handler);
}

export function onConnectionStateChange(handler: ConnectionStateHandler): () => void {
  stateHandlers.add(handler);
  return () => stateHandlers.delete(handler);
}
