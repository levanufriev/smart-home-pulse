using Microsoft.EntityFrameworkCore;
using Shared.Contracts.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataProcessor.Worker.Data.Entities;

[Table("telemetry_records")]
[Index(nameof(RoomName), nameof(CapturedAt))]
[Index(nameof(Type), nameof(CapturedAt))]
public class TelemetryRecord
{
    [Key]
    public Guid Id { get; set; }

    public Guid BatchEventId { get; set; }

    public DateTime CapturedAt { get; set; }

    public SensorType Type { get; set; }

    public string RoomName { get; set; } = string.Empty;

    public double? Energy { get; set; }

    public bool? MotionDetected { get; set; }

    public int? Co2 { get; set; }

    public int? Pm25 { get; set; }

    public int? Humidity { get; set; }
}
