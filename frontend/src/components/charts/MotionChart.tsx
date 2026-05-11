import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GET_MOTION_DATA } from "../../graphql/queries";
import { useRoomStore } from "../../store/roomStore";
import type {
  TimeFrame,
  ChartDataPoint,
  GetMotionDataResponse,
  GetMotionDataVariables,
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

export const MotionChart: React.FC = () => {
  const { selectedRoomId } = useRoomStore();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("LAST_HOUR");
  const [liveAppends, setLiveAppends] = useState<ChartDataPoint[]>([]);

  // Fires every 30s in LAST_HOUR mode — used only to advance the visual cutoff, not to retrigger queries
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (selectedTimeFrame !== "LAST_HOUR") return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [selectedTimeFrame]);

  // Clear live appends when switching timeframes
  useEffect(() => {
    setLiveAppends([]);
  }, [selectedTimeFrame]);

  // Frozen at load / timeframe switch — intentionally no tick so Apollo fires exactly once
  const { startTime: baseStartTime, endTime: baseEndTime } = useMemo(
    () => getTimeRangeFromTimeFrame(selectedTimeFrame),
    [selectedTimeFrame]
  );
  const useAggregated = shouldUseAggregatedData(selectedTimeFrame);
  const useDailyAggregated = shouldUseDailyAggregatedData(selectedTimeFrame);

  const { data, previousData, loading, error, refetch } = useQuery<
    GetMotionDataResponse,
    GetMotionDataVariables
  >(GET_MOTION_DATA, {
    variables: {
      roomId: selectedRoomId!,
      startTime: baseStartTime.toISOString(),
      endTime: baseEndTime.toISOString(),
      useAggregated,
      useDailyAggregated,
    },
    skip: !selectedRoomId,
  });

  // Advances every tick — drives a pure JS filter, no network request
  const visualStartTime = useMemo(() => {
    if (selectedTimeFrame !== "LAST_HOUR") return 0;
    return Date.now() - 60 * 60 * 1000;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeFrame, tick]);

  const handleTelemetryUpdate = useCallback(
    (update: LiveTelemetryUpdate) => {
      if (selectedTimeFrame !== "LAST_HOUR") return;
      const motionRecords = update.records.filter(
        (r) => r.type === SensorType.MOTION
      );
      if (motionRecords.length === 0) return;
      const newPoints: ChartDataPoint[] = motionRecords.map((r) => ({
        timestamp: update.capturedAt,
        value: r.motionDetected ? 1 : 0,
      }));
      setLiveAppends((prev) => [...prev, ...newPoints]);
    },
    [selectedTimeFrame]
  );

  const handleReconnected = useCallback(() => {
    setLiveAppends([]);
    const { startTime, endTime } = getTimeRangeFromTimeFrame(selectedTimeFrame);
    refetch({
      roomId: selectedRoomId!,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      useAggregated: shouldUseAggregatedData(selectedTimeFrame),
      useDailyAggregated: shouldUseDailyAggregatedData(selectedTimeFrame),
    });
  }, [refetch, selectedRoomId, selectedTimeFrame]);

  useLiveTelemetry({
    onTelemetryUpdate: handleTelemetryUpdate,
    onReconnected: handleReconnected,
  });

  if (!selectedRoomId) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Motion Sensors</h2>
        <p className="text-gray-500 text-center py-8">
          Please select a room to view motion data
        </p>
      </div>
    );
  }

  // Only show skeleton on initial load — use previousData during refetch to avoid bleep
  if (loading && !data && !previousData) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Motion Sensors</h2>
        <ChartSkeleton />
      </div>
    );
  }

  if (error && !data && !previousData) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Motion Sensors</h2>
        <ErrorState
          title="Failed to load motion data"
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
        value: item.motionCount || 0,
      }))
    : useAggregated
      ? (activeData?.hourlyAggregates || []).map((item) => ({
          timestamp: item.hourBucket,
          value: item.motionCount || 0,
        }))
      : (activeData?.telemetryRecords || []).map((item) => ({
          timestamp: item.capturedAt,
          value: item.motionDetected ? 1 : 0,
        }));

  // Exclude live points already covered by the snapshot to avoid duplicates after reconnect
  const latestBaseTime =
    baseData.length > 0
      ? Math.max(...baseData.map((d) => new Date(d.timestamp).getTime()))
      : 0;

  const chartData =
    selectedTimeFrame === "LAST_HOUR"
      ? [
          ...baseData,
          ...liveAppends.filter(
            (p) => new Date(p.timestamp).getTime() > latestBaseTime
          ),
        ].filter((p) => new Date(p.timestamp).getTime() >= visualStartTime)
      : baseData;

  const timeFrameButtons: { value: TimeFrame; label: string }[] = [
    { value: "LAST_HOUR", label: "Last Hour" },
    { value: "LAST_DAY", label: "Last Day" },
    { value: "LAST_WEEK", label: "Last Week" },
    { value: "LAST_MONTH", label: "Last Month" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900 mb-2">
            {formatTimestamp(label, selectedTimeFrame)}
          </p>
          <p style={{ color: payload[0].color }} className="text-sm">
            {useAggregated
              ? `Motion Events: ${value}`
              : `Motion: ${value === 1 ? "Detected" : "No Detection"}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="widget-container">
      <h2 className="text-xl font-semibold mb-4">Motion Sensors</h2>

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
        <LineChart data={chartData}>
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
            label={{
              value: useAggregated ? "Motion Events" : "Motion Detection",
              angle: -90,
              position: "insideLeft",
            }}
            domain={useAggregated ? [0, "dataMax"] : [0, 1]}
            tickFormatter={(value) =>
              useAggregated ? value.toString() : value === 1 ? "Yes" : "No"
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#8b5cf6" }}
            connectNulls={false}
            strokeDasharray={useAggregated ? "0" : "5 5"}
          />
        </LineChart>
      </ResponsiveContainer>

      {chartData.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No motion data available for the selected time period
        </p>
      )}
    </div>
  );
};
