import { useEffect, useRef } from 'react';
import { useRoomStore } from '../store/roomStore';
import {
  startSignalR,
  joinRoom,
  leaveRoom,
  onTelemetryUpdate,
  onDailySummaryChanged,
  onConnectionStateChange,
} from '../lib/signalr';
import type { LiveTelemetryUpdate, DailySummaryChangedNotification } from '../types/signalr';

interface UseLiveTelemetryOptions {
  onTelemetryUpdate?: (update: LiveTelemetryUpdate) => void;
  onSummaryChanged?: (notification: DailySummaryChangedNotification) => void;
  onReconnected?: () => void;
}

export function useLiveTelemetry({
  onTelemetryUpdate: handleTelemetryUpdate,
  onSummaryChanged: handleSummaryChanged,
  onReconnected: handleReconnected,
}: UseLiveTelemetryOptions = {}) {
  const { selectedRoomId } = useRoomStore();

  const telemetryRef = useRef(handleTelemetryUpdate);
  const summaryRef = useRef(handleSummaryChanged);
  const reconnectedRef = useRef(handleReconnected);

  useEffect(() => { telemetryRef.current = handleTelemetryUpdate; }, [handleTelemetryUpdate]);
  useEffect(() => { summaryRef.current = handleSummaryChanged; }, [handleSummaryChanged]);
  useEffect(() => { reconnectedRef.current = handleReconnected; }, [handleReconnected]);

  useEffect(() => {
    startSignalR();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;

    joinRoom(selectedRoomId);

    return () => {
      leaveRoom(selectedRoomId);
    };
  }, [selectedRoomId]);

  useEffect(() => {
    return onTelemetryUpdate((update) => {
      if (update.roomId === selectedRoomId) {
        console.log(
          `[LiveTelemetry] TelemetryUpdate room=${update.roomId} capturedAt=${update.capturedAt} records=${update.records.length}`,
          update.records,
        );
        telemetryRef.current?.(update);
      }
    });
  }, [selectedRoomId]);

  useEffect(() => {
    return onDailySummaryChanged((notification) => {
      if (notification.roomId === selectedRoomId) {
        console.log(
          `[LiveTelemetry] DailySummaryChanged room=${notification.roomId} date=${notification.date}`,
        );
        summaryRef.current?.(notification);
      }
    });
  }, [selectedRoomId]);

  useEffect(() => {
    return onConnectionStateChange((state) => {
      if (state === 'reconnected') {
        console.info('[LiveTelemetry] Reconnected — triggering catch-up refetch');
        reconnectedRef.current?.();
      }
    });
  }, []);

  // Optional: visibility change catch-up — fires onReconnected when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconnectedRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
