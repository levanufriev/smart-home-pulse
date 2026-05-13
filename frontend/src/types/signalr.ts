import type { SensorType } from './index';

export interface LiveTelemetryRecord {
  type: SensorType;
  energy?: number | null;
  motionDetected?: boolean | null;
  co2?: number | null;
  pm25?: number | null;
  humidity?: number | null;
}

export interface LiveTelemetryUpdate {
  roomId: string;
  capturedAt: string;
  records: LiveTelemetryRecord[];
}

export interface DailySummaryChangedNotification {
  roomId: string;
  date: string;
}
