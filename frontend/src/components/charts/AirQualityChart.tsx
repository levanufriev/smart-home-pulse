import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GET_AIR_QUALITY_DATA } from "../../graphql/queries";
import { useRoomStore } from "../../store/roomStore";
import type {
  TimeFrame,
  AirQualityDataPoint,
  GetAirQualityDataResponse,
  GetAirQualityDataVariables,
} from "../../types";
import {
  getTimeRangeFromTimeFrame,
  shouldUseAggregatedData,
  shouldUseDailyAggregatedData,
  formatTimestamp,
} from "../../utils/dateUtils";
import { ChartSkeleton } from "../ui/Skeleton";
import { ErrorState } from "../ui/ErrorState";

export const AirQualityChart: React.FC = () => {
  const { selectedRoomId } = useRoomStore();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("LAST_HOUR");

  const { startTime, endTime } = useMemo(() => {
    return getTimeRangeFromTimeFrame(selectedTimeFrame);
  }, [selectedTimeFrame]);
  const useAggregated = shouldUseAggregatedData(selectedTimeFrame);
  const useDailyAggregated = shouldUseDailyAggregatedData(selectedTimeFrame);

  const { data, loading, error, refetch } = useQuery<
    GetAirQualityDataResponse,
    GetAirQualityDataVariables
  >(GET_AIR_QUALITY_DATA, {
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
        <h2 className="text-xl font-semibold mb-4">Air Quality</h2>
        <p className="text-gray-500 text-center py-8">
          Please select a room to view air quality data
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Air Quality</h2>
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Air Quality</h2>
        <ErrorState
          title="Failed to load air quality data"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const chartData: AirQualityDataPoint[] = useDailyAggregated
    ? (data?.dailyAggregates || []).map((item) => ({
        timestamp: item.dayBucket,
        co2: item.avgCo2 ?? null,
        pm25: item.avgPm25 ?? null,
        humidity: item.avgHumidity ?? null,
      }))
    : useAggregated
      ? (data?.hourlyAggregates || []).map((item) => ({
          timestamp: item.hourBucket,
          co2: item.avgCo2 ?? null,
          pm25: item.avgPm25 ?? null,
          humidity: item.avgHumidity ?? null,
        }))
      : (data?.telemetryRecords || []).map((item) => ({
          timestamp: item.capturedAt,
          co2: item.co2 ?? null,
          pm25: item.pm25 ?? null,
          humidity: item.humidity ?? null,
        }));

  const timeFrameButtons: { value: TimeFrame; label: string }[] = [
    { value: "LAST_HOUR", label: "Last Hour" },
    { value: "LAST_DAY", label: "Last Day" },
    { value: "LAST_WEEK", label: "Last Week" },
    { value: "LAST_MONTH", label: "Last Month" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900 mb-2">
            {formatTimestamp(label, selectedTimeFrame)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value !== null ? entry.value.toFixed(1) : "N/A"} ${
                entry.dataKey === "co2"
                  ? "ppm"
                  : entry.dataKey === "pm25"
                    ? "µg/m³"
                    : "%"
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="widget-container">
      <h2 className="text-xl font-semibold mb-4">Air Quality</h2>

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
            yAxisId="left"
            tick={{ fontSize: 12 }}
            label={{
              value: "CO2 (ppm) / PM2.5 (µg/m³)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{
              value: "Humidity (%)",
              angle: 90,
              position: "insideRight",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="co2"
            stroke="#ef4444"
            strokeWidth={2}
            name="CO2"
            dot={{ r: 2 }}
            connectNulls={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="pm25"
            stroke="#f97316"
            strokeWidth={2}
            name="PM2.5"
            dot={{ r: 2 }}
            connectNulls={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            stroke="#06b6d4"
            strokeWidth={2}
            name="Humidity"
            dot={{ r: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {chartData.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No air quality data available for the selected time period
        </p>
      )}
    </div>
  );
};
