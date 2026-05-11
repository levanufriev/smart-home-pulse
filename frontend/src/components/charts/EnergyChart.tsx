import React, { useMemo, useState } from "react";
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

export const EnergyChart: React.FC = () => {
  const { selectedRoomId } = useRoomStore();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("LAST_HOUR");

  const { startTime, endTime } = useMemo(() => {
    return getTimeRangeFromTimeFrame(selectedTimeFrame);
  }, [selectedTimeFrame]);
  const useAggregated = shouldUseAggregatedData(selectedTimeFrame);
  const useDailyAggregated = shouldUseDailyAggregatedData(selectedTimeFrame);

  const { data, loading, error, refetch } = useQuery<
    GetEnergyDataResponse,
    GetEnergyDataVariables
  >(GET_ENERGY_DATA, {
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
        <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>
        <p className="text-gray-500 text-center py-8">
          Please select a room to view energy data
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
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

  const chartData: ChartDataPoint[] = useDailyAggregated
    ? (data?.dailyAggregates || []).map((item) => ({
        timestamp: item.dayBucket,
        value: item.totalEnergy || 0,
      }))
    : useAggregated
      ? (data?.hourlyAggregates || []).map((item) => ({
          timestamp: item.hourBucket,
          value: item.totalEnergy || 0,
        }))
      : (data?.telemetryRecords || []).map((item) => ({
          timestamp: item.capturedAt,
          value: item.energy || 0,
        }));

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
            labelFormatter={(value: string) =>
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
