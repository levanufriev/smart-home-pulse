import React, { useMemo, useState } from "react";
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

export const MotionChart: React.FC = () => {
  const { selectedRoomId } = useRoomStore();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("LAST_HOUR");

  const { startTime, endTime } = useMemo(() => {
    return getTimeRangeFromTimeFrame(selectedTimeFrame);
  }, [selectedTimeFrame]);
  const useAggregated = shouldUseAggregatedData(selectedTimeFrame);
  const useDailyAggregated = shouldUseDailyAggregatedData(selectedTimeFrame);

  const { data, loading, error, refetch } = useQuery<
    GetMotionDataResponse,
    GetMotionDataVariables
  >(GET_MOTION_DATA, {
    variables: {
      roomId: selectedRoomId!,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      useAggregated,
      useDailyAggregated,
    },
    skip: !selectedRoomId,
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

  if (loading) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Motion Sensors</h2>
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
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

  const chartData: ChartDataPoint[] = useDailyAggregated
    ? (data?.dailyAggregates || []).map((item) => ({
        timestamp: item.dayBucket,
        value: item.motionCount || 0,
      }))
    : useAggregated
      ? (data?.hourlyAggregates || []).map((item) => ({
          timestamp: item.hourBucket,
          value: item.motionCount || 0,
        }))
      : (data?.telemetryRecords || []).map((item) => ({
          timestamp: item.capturedAt,
          value: item.motionDetected ? 1 : 0,
        }));

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
