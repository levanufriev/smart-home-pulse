using Shared.Domain.Enums;

namespace NotificationService.Contracts;

public record LiveTelemetryRecord(
    SensorType Type,
    double? Energy,
    bool? MotionDetected,
    int? Co2,
    int? Pm25,
    int? Humidity);

public record LiveTelemetryUpdate(
    Guid RoomId,
    DateTime CapturedAt,
    IReadOnlyList<LiveTelemetryRecord> Records);

public record DailySummaryChangedNotification(
    Guid RoomId,
    DateOnly Date);
