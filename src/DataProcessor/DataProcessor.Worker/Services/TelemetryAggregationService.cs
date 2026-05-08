using DataProcessor.Worker.Data;
using Microsoft.EntityFrameworkCore;
using Shared.Domain.Entities;
using Shared.Domain.Enums;
using Shared.Domain.Projections;

namespace DataProcessor.Worker.Services;

public class TelemetryAggregationService(
    AppDbContext dbContext,
    ILogger<TelemetryAggregationService> logger) : ITelemetryAggregationService
{
    public async Task ProcessAggregatesAsync(List<TelemetryRecord> newRecords, CancellationToken cancellationToken)
    {
        if (newRecords.Count == 0) return;

        logger.LogInformation("Calculating aggregates for {Count} records...", newRecords.Count);

        var timestamp = newRecords[0].CapturedAt;
        var hourBucket = new DateTime(timestamp.Year, timestamp.Month, timestamp.Day, timestamp.Hour, 0, 0, DateTimeKind.Utc);

        foreach (var group in newRecords.GroupBy(r => new { r.RoomId, r.Type }))
        {
            var agg = await dbContext.HourlyAggregates
                .FirstOrDefaultAsync(a => a.RoomId == group.Key.RoomId
                                       && a.Type == group.Key.Type
                                       && a.HourBucket == hourBucket, cancellationToken);

            if (agg == null)
            {
                agg = new HourlyAggregate
                {
                    Id = Guid.NewGuid(),
                    RoomId = group.Key.RoomId,
                    Type = group.Key.Type,
                    HourBucket = hourBucket
                };
                dbContext.HourlyAggregates.Add(agg);
            }

            int newCount = group.Count();

            if (group.Key.Type == SensorType.Energy)
            {
                agg.AvgEnergy = ((agg.AvgEnergy ?? 0) * agg.RecordCount + group.Sum(x => x.Energy)) / (agg.RecordCount + newCount);
                agg.TotalEnergy = (agg.TotalEnergy ?? 0) + group.Sum(x => x.Energy ?? 0);
            }
            else if (group.Key.Type == SensorType.AirQuality)
            {
                agg.AvgCo2 = ((agg.AvgCo2 ?? 0) * agg.RecordCount + group.Sum(x => x.Co2)) / (agg.RecordCount + newCount);
                agg.AvgPm25 = ((agg.AvgPm25 ?? 0) * agg.RecordCount + group.Sum(x => x.Pm25)) / (agg.RecordCount + newCount);
                agg.AvgHumidity = ((agg.AvgHumidity ?? 0) * agg.RecordCount + group.Sum(x => x.Humidity)) / (agg.RecordCount + newCount);
            }
            else if (group.Key.Type == SensorType.Motion)
            {
                agg.MotionCount += group.Count(x => x.MotionDetected == true);
            }

            agg.RecordCount += newCount;
        }

        logger.LogInformation("Successfully processed aggregates for hour bucket {HourBucket}.", hourBucket);
    }
}
