using Shared.Contracts.Enums;

namespace Shared.Contracts.Events;

public record TelemetryPoint(
    SensorType Type,
    string RoomName,
    double? Energy = null,
    bool? MotionDetected = null,
    int? Co2 = null,
    int? Pm25 = null,
    int? Humidity = null);

public record TelemetryBatchProduced(
    Guid EventId,
    DateTime Timestamp,
    List<TelemetryPoint> Points);
