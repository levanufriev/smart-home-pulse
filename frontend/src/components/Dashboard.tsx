import React from "react";
import { RoomSelector } from "./RoomSelector";
import { DailySummary } from "./DailySummary";
import { EnergyChart } from "./charts/EnergyChart";
import { AirQualityChart } from "./charts/AirQualityChart";
import { MotionChart } from "./charts/MotionChart";

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Home Pulse
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <RoomSelector />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="w-full">
            <DailySummary />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <EnergyChart />
            </div>

            <div className="lg:col-span-1">
              <AirQualityChart />
            </div>

            <div className="lg:col-span-1 xl:col-span-1 lg:col-start-1 xl:col-start-3">
              <MotionChart />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Smart Home Pulse Dashboard - Real-time telemetry monitoring
          </p>
        </div>
      </footer>
    </div>
  );
};
