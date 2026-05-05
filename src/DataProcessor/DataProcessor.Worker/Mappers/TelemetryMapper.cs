using DataProcessor.Worker.Data.Entities;
using Shared.Contracts.Events;

namespace DataProcessor.Worker.Mappers;

public static class TelemetryMapper
{
    public static TelemetryRecord ToEntity(this TelemetryPoint point, Guid batchId, DateTime capturedAt)
    {
        return new TelemetryRecord
        {
            Id = Guid.NewGuid(),
            BatchEventId = batchId,
            CapturedAt = capturedAt,
            Type = point.Type,
            RoomName = point.RoomName,
            Energy = point.Energy,
            MotionDetected = point.MotionDetected,
            Co2 = point.Co2,
            Pm25 = point.Pm25,
            Humidity = point.Humidity
        };
    }

    public static TelemetrySummary ToSummary(this TelemetryRecord record)
    {
        return new TelemetrySummary(
            RecordId: record.Id,
            Type: record.Type,
            RoomName: record.RoomName,
            Energy: record.Energy,
            MotionDetected: record.MotionDetected,
            Co2: record.Co2,
            Pm25: record.Pm25,
            Humidity: record.Humidity
        );
    }
}
