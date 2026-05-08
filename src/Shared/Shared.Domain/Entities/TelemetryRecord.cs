using Shared.Domain.Enums;

namespace Shared.Domain.Entities;

public class TelemetryRecord
{
    public Guid Id { get; set; }
    public Guid BatchEventId { get; set; }
    public DateTime CapturedAt { get; set; }
    public SensorType Type { get; set; }

    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;

    public double? Energy { get; set; }
    public bool? MotionDetected { get; set; }
    public int? Co2 { get; set; }
    public int? Pm25 { get; set; }
    public int? Humidity { get; set; }
}