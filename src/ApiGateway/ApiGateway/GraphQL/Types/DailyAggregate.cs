using Shared.Domain.Enums;

namespace ApiGateway.GraphQL.Types;

public class DailyAggregate
{
    public Guid RoomId { get; set; }
    public SensorType Type { get; set; }
    public DateTime DayBucket { get; set; }
    public double? TotalEnergy { get; set; }
    public double? AvgCo2 { get; set; }
    public double? AvgPm25 { get; set; }
    public double? AvgHumidity { get; set; }
    public int MotionCount { get; set; }
}
