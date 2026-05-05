using Shared.Contracts.Enums;

namespace Shared.Contracts.Events;

public record TelemetrySummary(
    Guid RecordId,
    SensorType Type,
    string RoomName,
    double? Energy = null,
    bool? MotionDetected = null,
    int? Co2 = null,
    int? Pm25 = null,
    int? Humidity = null);

public record TelemetryBatchPersisted(
    Guid BatchId,
    DateTime SavedAt,
    List<TelemetrySummary> SavedRecords);
