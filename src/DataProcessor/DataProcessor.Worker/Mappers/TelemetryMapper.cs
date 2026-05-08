using Shared.Contracts.Events;
using Shared.Domain.Entities;

namespace DataProcessor.Worker.Mappers;

public static class TelemetryMapper
{
    public static TelemetryRecord ToEntity(this TelemetryPoint point, Guid batchId, Guid roomId, DateTime capturedAt)
    {
        return new TelemetryRecord
        {
            Id = Guid.NewGuid(),
            BatchEventId = batchId,
            RoomId = roomId,
            CapturedAt = capturedAt,
            Type = point.Type,
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
            RoomId: record.RoomId,
            Energy: record.Energy,
            MotionDetected: record.MotionDetected,
            Co2: record.Co2,
            Pm25: record.Pm25,
            Humidity: record.Humidity
        );
    }
}
