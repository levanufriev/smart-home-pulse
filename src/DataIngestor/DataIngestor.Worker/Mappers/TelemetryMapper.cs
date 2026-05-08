using DataIngestor.Worker.Models;
using Shared.Contracts.Events;
using Shared.Domain.Enums;

namespace DataIngestor.Worker.Mappers;

public static class TelemetryMapper
{
    public static TelemetryPoint? ToTelemetryPoint(this Metric metric)
    {
        if (metric.Payload == null) return null;

        var sensorType = metric.Type switch
        {
            var t when t.Equals("energy", StringComparison.OrdinalIgnoreCase) => SensorType.Energy,
            var t when t.Equals("motion", StringComparison.OrdinalIgnoreCase) => SensorType.Motion,
            var t when t.Equals("air_quality", StringComparison.OrdinalIgnoreCase) => SensorType.AirQuality,
            _ => SensorType.Unknown
        };

        if (sensorType == SensorType.Unknown) return null;

        return sensorType switch
        {
            SensorType.Energy => new TelemetryPoint(
                Type: SensorType.Energy,
                RoomName: metric.Name,
                Energy: metric.Payload.Energy),

            SensorType.Motion => new TelemetryPoint(
                Type: SensorType.Motion,
                RoomName: metric.Name,
                MotionDetected: metric.Payload.MotionDetected),

            SensorType.AirQuality => new TelemetryPoint(
                Type: SensorType.AirQuality,
                RoomName: metric.Name,
                Co2: metric.Payload.Co2,
                Pm25: metric.Payload.Pm25,
                Humidity: metric.Payload.Humidity),

            _ => null
        };
    }
}
