using Shared.Domain.Entities;
using Shared.Domain.Enums;

namespace Shared.Domain.Projections;

public class HourlyAggregate
{
    public Guid Id { get; set; }
    public SensorType Type { get; set; }
    public DateTime HourBucket { get; set; }

    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;

    public int RecordCount { get; set; }

    public double? AvgEnergy { get; set; }
    public double? TotalEnergy { get; set; }

    public double? AvgCo2 { get; set; }
    public double? AvgPm25 { get; set; }
    public double? AvgHumidity { get; set; }

    public int MotionCount { get; set; }
}
