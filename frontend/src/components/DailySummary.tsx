import React from "react";
import { useQuery } from "@apollo/client/react";
import { GET_DAILY_SUMMARY } from "../graphql/queries";
import { useRoomStore } from "../store/roomStore";
import type {
  GetDailySummaryResponse,
  GetDailySummaryVariables,
} from "../types";
import { getTodayDateString } from "../utils/dateUtils";
import { DailySummarySkeleton } from "./ui/Skeleton";
import { ErrorState } from "./ui/ErrorState";

export const DailySummary: React.FC = () => {
  const { selectedRoomId } = useRoomStore();

  const { data, loading, error, refetch } = useQuery<
    GetDailySummaryResponse,
    GetDailySummaryVariables
  >(GET_DAILY_SUMMARY, {
    variables: {
      roomId: selectedRoomId!,
      date: getTodayDateString(),
    },
    skip: !selectedRoomId,
  });

  if (!selectedRoomId) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
        <p className="text-gray-500 text-center py-8">
          Please select a room to view the daily summary
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
        <DailySummarySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
        <ErrorState
          title="Failed to load daily summary"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const summary = data?.dailySummary;

  if (!summary) {
    return (
      <div className="widget-container">
        <h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
        <p className="text-gray-500 text-center py-8">
          No data available for today
        </p>
      </div>
    );
  }

  return (
    <div className="widget-container">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Daily Summary</h2>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Energy Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Energy</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-blue-600">Total Consumption</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.energy.totalKwh.toFixed(2)} kWh
              </p>
            </div>
            {!!summary.energy.peakHourlyKwh && (
              <div>
                <p className="text-sm text-blue-600">Peak Hour</p>
                <p className="text-lg font-semibold text-blue-800">
                  {summary.energy.peakHourlyKwh.toFixed(2)} kWh
                </p>
              </div>
            )}
            {!!summary.energy.averageHourlyKwh && (
              <div>
                <p className="text-sm text-blue-600">Average/Hour</p>
                <p className="text-lg font-semibold text-blue-800">
                  {summary.energy.averageHourlyKwh.toFixed(2)} kWh
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-800 mb-3">
            Air Quality
          </h3>
          <div className="space-y-2">
            {!!summary.airQuality.averageCo2 && (
              <div>
                <p className="text-sm text-green-600">Average CO2</p>
                <p className="text-lg font-semibold text-green-800">
                  {summary.airQuality.averageCo2.toFixed(0)} ppm
                </p>
              </div>
            )}
            {!!summary.airQuality.averagePm25 && (
              <div>
                <p className="text-sm text-green-600">Average PM2.5</p>
                <p className="text-lg font-semibold text-green-800">
                  {summary.airQuality.averagePm25.toFixed(1)} µg/m³
                </p>
              </div>
            )}
            {!!summary.airQuality.averageHumidity && (
              <div>
                <p className="text-sm text-green-600">Average Humidity</p>
                <p className="text-lg font-semibold text-green-800">
                  {summary.airQuality.averageHumidity.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-800 mb-3">Motion</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-purple-600">Total Events</p>
              <p className="text-2xl font-bold text-purple-900">
                {summary.motion.totalEvents}
              </p>
            </div>
            <div>
              <p className="text-sm text-purple-600">Active Hours</p>
              <p className="text-lg font-semibold text-purple-800">
                {summary.motion.activeHours} hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
