import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GET_ENERGY_DATA } from "../../graphql/queries";
import { useRoomStore } from "../../store/roomStore";
import type {
  TimeFrame,
  ChartDataPoint,
  GetEnergyDataResponse,
  GetEnergyDataVariables,
} from "../../types";
import {
  getTimeRangeFromTimeFrame,
  shouldUseAggregatedData,
  shouldUseDailyAggregatedData,
  formatTimestamp,
} from "../../utils/dateUtils";
import { ChartSkeleton } from "../ui/Skeleton";
import { ErrorState } from "../ui/ErrorState";
import { useLiveTelemetry } from "../../hooks/useLiveTelemetry";
import type { LiveTelemetryUpdate } from "../../types/signalr";
import { SensorType } from "../../types";

export const EnergyChart: React.FC = () => {
  // TODO: ref only to props which you use inside component (ex. in DailySummary)
  const { selectedRoomId } = useRoomStore();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("LAST_HOUR");
  const [liveAppends, setLiveAppends] = useState<ChartDataPoint[]>([]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (selectedTimeFrame !== "LAST_HOUR") return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [selectedTimeFrame]);

  // TODO: merge those useEffects
  useEffect(() => {
    setLiveAppends([]);
  }, [selectedTimeFrame]);

  const { startTime: baseStartTime, endTime: baseEndTime } = useMemo(
    () => getTimeRangeFromTimeFrame(selectedTimeFrame),
    [selectedTimeFrame],
  );
  const useAggregated = shouldUseAggregatedData(selectedTimeFrame);
  const useDailyAggregated = shouldUseDailyAggregatedData(selectedTimeFrame);

  const { data, previousData, loading, error, refetch } = useQuery<
    GetEnergyDataResponse,
    GetEnergyDataVariables
  >(GET_ENERGY_DATA, {
    variables: {
      roomId: selectedRoomId!,
      startTime: baseStartTime.toISOString(),
      endTime: baseEndTime.toISOString(),
      useAggregated,
      useDailyAggregated,
    },
    skip: !selectedRoomId,
  });

  const visualStartTime = useMemo(() => {
    if (selectedTimeFrame !== "LAST_HOUR") return 0;
    return Date.now() - 60 * 60 * 1000;
  }, [selectedTimeFrame, tick]);

  const handleTelemetryUpdate = useCallback(
    (update: LiveTelemetryUpdate) => {
      if (selectedTimeFrame !== "LAST_HOUR") return;
      const energyRecords = update.records.filter(
        (r) => r.type === SensorType.ENERGY,
      );
      if (energyRecords.length === 0) return;
      const newPoints: ChartDataPoint[] = energyRecords.map((r) => ({
        timestamp: update.capturedAt,
        value: r.energy ?? 0,
      }));
      setLiveAppends((prev) => [...prev, ...newPoints]);
    },
    [selectedTimeFrame],
  );

  const handleReconnected = useCallback(() => {
    setLiveAppends([]);
    const { startTime, endTime } = getTimeRangeFromTimeFrame(selectedTimeFrame);
    refetch({
      roomId: selectedRoomId!,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      useAggregated: useAggregated,
      useDailyAggregated: useDailyAggregated,
    });
  }, [
    refetch,
    selectedRoomId,
    selectedTimeFrame,
    useAggregated,
    useDailyAggregated,
  ]);

  useLiveTelemetry({
    onTelemetryUpdate: handleTelemetryUpdate,
    onReconnected: handleReconnected,
  });

  if (!selectedRoomId) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>
        <p className="text-gray-500 text-center py-8">
          Please select a room to view energy data
        </p>
      </div>
    );
  }

  if (loading && !data && !previousData) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>
        <ChartSkeleton />
      </div>
    );
  }

  if (error && !data && !previousData) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>
        <ErrorState
          title="Failed to load energy data"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const activeData = data ?? previousData;

  const baseData: ChartDataPoint[] = useDailyAggregated
    ? (activeData?.dailyAggregates || []).map((item) => ({
        timestamp: item.dayBucket,
        value: item.totalEnergy || 0,
      }))
    : useAggregated
      ? (activeData?.hourlyAggregates || []).map((item) => ({
          timestamp: item.hourBucket,
          value: item.totalEnergy || 0,
        }))
      : (activeData?.telemetryRecords || []).map((item) => ({
          timestamp: item.capturedAt,
          value: item.energy || 0,
        }));

  const latestBaseTime =
    baseData.length > 0
      ? Math.max(...baseData.map((d) => new Date(d.timestamp).getTime()))
      : 0;

  const chartData =
    selectedTimeFrame === "LAST_HOUR"
      ? [
          ...baseData,
          ...liveAppends.filter(
            (p) => new Date(p.timestamp).getTime() > latestBaseTime,
          ),
        ].filter((p) => new Date(p.timestamp).getTime() >= visualStartTime)
      : baseData;

  const timeFrameButtons: { value: TimeFrame; label: string }[] = [
    { value: "LAST_HOUR", label: "Last Hour" },
    { value: "LAST_DAY", label: "Last Day" },
    { value: "LAST_WEEK", label: "Last Week" },
    { value: "LAST_MONTH", label: "Last Month" },
  ];

  return (
    <div className="widget-container">
      <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>

      <div className="chart-controls">
        <div className="timeframe-buttons">
          {timeFrameButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedTimeFrame(value)}
              className={`timeframe-button ${
                selectedTimeFrame === value
                  ? "timeframe-button-active"
                  : "timeframe-button-inactive"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            minTickGap={40}
            tickFormatter={(value: string) =>
              formatTimestamp(value, selectedTimeFrame)
            }
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: "kWh", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(value: any) => [`${value?.toFixed(2)} kWh`, "Energy"]}
            labelFormatter={(value: any) =>
              formatTimestamp(value, selectedTimeFrame)
            }
            labelStyle={{ color: "#374151" }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {chartData.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No energy data available for the selected time period
        </p>
      )}
    </div>
  );
};
