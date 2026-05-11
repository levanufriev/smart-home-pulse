export interface Room {
  id: string;
  name: string;
}

export interface EnergyDailySummary {
  totalKwh: number;
  peakHourlyKwh: number | null;
  averageHourlyKwh: number | null;
}

export interface AirQualityDailySummary {
  averageCo2: number | null;
  minCo2: number | null;
  maxCo2: number | null;
  averagePm25: number | null;
  minPm25: number | null;
  maxPm25: number | null;
  averageHumidity: number | null;
  minHumidity: number | null;
  maxHumidity: number | null;
}

export interface MotionDailySummary {
  totalEvents: number;
  activeHours: number;
}

export interface DailyRoomSummary {
  roomId: string;
  date: string;
  energy: EnergyDailySummary;
  airQuality: AirQualityDailySummary;
  motion: MotionDailySummary;
}

export interface TelemetryRecord {
  id: string;
  capturedAt: string;
  type: SensorType;
  energy?: number | null;
  co2?: number | null;
  pm25?: number | null;
  humidity?: number | null;
  motionDetected?: boolean | null;
}

export interface HourlyAggregate {
  id: string;
  hourBucket: string;
  type: SensorType;
  totalEnergy?: number | null;
  avgCo2?: number | null;
  avgPm25?: number | null;
  avgHumidity?: number | null;
  motionCount?: number | null;
}

export const SensorType = {
  ENERGY: 'ENERGY',
  AIR_QUALITY: 'AIR_QUALITY',
  MOTION: 'MOTION'
} as const;

export type SensorType = typeof SensorType[keyof typeof SensorType];

export type TimeFrame = 'LAST_HOUR' | 'LAST_DAY' | 'LAST_WEEK' | 'LAST_MONTH';

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AirQualityDataPoint {
  timestamp: string;
  co2: number | null;
  pm25: number | null;
  humidity: number | null;
}


export interface GetRoomsResponse {
  rooms: Pick<Room, 'id' | 'name'>[];
}

export interface GetDailySummaryResponse {
  dailySummary: DailyRoomSummary | null;
}

export interface DailyAggregate {
  dayBucket: string;
  type: SensorType;
  totalEnergy?: number | null;
  avgCo2?: number | null;
  avgPm25?: number | null;
  avgHumidity?: number | null;
  motionCount?: number | null;
}

export type EnergyTelemetryRecord = Pick<TelemetryRecord, 'id' | 'capturedAt' | 'energy'>;
export type EnergyHourlyAggregate = Pick<HourlyAggregate, 'id' | 'hourBucket' | 'totalEnergy'>;
export type EnergyDailyAggregate = Pick<DailyAggregate, 'dayBucket' | 'totalEnergy'>;

export interface GetEnergyDataResponse {
  telemetryRecords?: EnergyTelemetryRecord[];
  hourlyAggregates?: EnergyHourlyAggregate[];
  dailyAggregates?: EnergyDailyAggregate[];
}

export interface GetEnergyDataVariables {
  roomId: string;
  startTime: string;
  endTime: string;
  useAggregated: boolean;
  useDailyAggregated: boolean;
}

export type AirQualityTelemetryRecord = Pick<TelemetryRecord, 'id' | 'capturedAt' | 'co2' | 'pm25' | 'humidity'>;
export type AirQualityHourlyAggregate = Pick<HourlyAggregate, 'id' | 'hourBucket' | 'avgCo2' | 'avgPm25' | 'avgHumidity'>;
export type AirQualityDailyAggregate = Pick<DailyAggregate, 'dayBucket' | 'avgCo2' | 'avgPm25' | 'avgHumidity'>;

export interface GetAirQualityDataResponse {
  telemetryRecords?: AirQualityTelemetryRecord[];
  hourlyAggregates?: AirQualityHourlyAggregate[];
  dailyAggregates?: AirQualityDailyAggregate[];
}

export interface GetAirQualityDataVariables {
  roomId: string;
  startTime: string;
  endTime: string;
  useAggregated: boolean;
  useDailyAggregated: boolean;
}

export type MotionTelemetryRecord = Pick<TelemetryRecord, 'id' | 'capturedAt' | 'motionDetected'>;
export type MotionHourlyAggregate = Pick<HourlyAggregate, 'id' | 'hourBucket' | 'motionCount'>;
export type MotionDailyAggregate = Pick<DailyAggregate, 'dayBucket' | 'motionCount'>;

export interface GetMotionDataResponse {
  telemetryRecords?: MotionTelemetryRecord[];
  hourlyAggregates?: MotionHourlyAggregate[];
  dailyAggregates?: MotionDailyAggregate[];
}

export interface GetMotionDataVariables {
  roomId: string;
  startTime: string;
  endTime: string;
  useAggregated: boolean;
  useDailyAggregated: boolean;
}

export interface GetDailySummaryVariables {
  roomId: string;
  date: string;
}