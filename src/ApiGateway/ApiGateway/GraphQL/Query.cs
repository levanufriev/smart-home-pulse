using ApiGateway.Data;
using ApiGateway.GraphQL.Types;
using Microsoft.EntityFrameworkCore;
using Shared.Domain.Entities;
using Shared.Domain.Enums;
using Shared.Domain.Projections;

namespace ApiGateway.GraphQL;

public class Query
{
    [UsePaging(MaxPageSize = 100)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Room> GetRooms(GatewayDbContext dbContext)
    {
        return dbContext.Rooms;
    }

    public Task<Room?> GetRoomByIdAsync(
        Guid id,
        GatewayDbContext dbContext,
        CancellationToken cancellationToken)
    {
        return dbContext.Rooms.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    [UsePaging(MaxPageSize = 50)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<TelemetryRecord> GetTelemetryRecords(
        Guid roomId,
        GatewayDbContext dbContext)
    {
        return dbContext.TelemetryRecords.Where(t => t.RoomId == roomId);
    }

    [UsePaging(MaxPageSize = 250)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<HourlyAggregate> GetHourlyAggregates(GatewayDbContext dbContext)
    {
        return dbContext.HourlyAggregates;
    }

    public async Task<DailyRoomSummary?> GetDailySummaryAsync(
        Guid roomId,
        DateOnly date,
        GatewayDbContext dbContext,
        CancellationToken ct)
    {
        var startOfDay = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var endOfDay = startOfDay.AddDays(1);

        var raw = await dbContext.HourlyAggregates
            .Where(a => a.RoomId == roomId && a.HourBucket >= startOfDay && a.HourBucket < endOfDay)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                EnergyTotal = g.Where(a => a.Type == SensorType.Energy).Sum(a => a.TotalEnergy ?? 0),
                EnergyPeak = g.Where(a => a.Type == SensorType.Energy).Max(a => a.TotalEnergy),
                EnergyAvg = g.Where(a => a.Type == SensorType.Energy).Average(a => a.TotalEnergy),

                AvgCo2 = g.Where(a => a.Type == SensorType.AirQuality).Average(a => a.AvgCo2),
                MinCo2 = g.Where(a => a.Type == SensorType.AirQuality).Min(a => a.AvgCo2),
                MaxCo2 = g.Where(a => a.Type == SensorType.AirQuality).Max(a => a.AvgCo2),
                AvgPm25 = g.Where(a => a.Type == SensorType.AirQuality).Average(a => a.AvgPm25),
                MinPm25 = g.Where(a => a.Type == SensorType.AirQuality).Min(a => a.AvgPm25),
                MaxPm25 = g.Where(a => a.Type == SensorType.AirQuality).Max(a => a.AvgPm25),
                AvgHumidity = g.Where(a => a.Type == SensorType.AirQuality).Average(a => a.AvgHumidity),
                MinHumidity = g.Where(a => a.Type == SensorType.AirQuality).Min(a => a.AvgHumidity),
                MaxHumidity = g.Where(a => a.Type == SensorType.AirQuality).Max(a => a.AvgHumidity),

                MotionTotal = g.Where(a => a.Type == SensorType.Motion).Sum(a => a.MotionCount),
                MotionActiveHours = g.Count(a => a.Type == SensorType.Motion && a.MotionCount > 0),
            })
            .FirstOrDefaultAsync(ct);

        if (raw is null) return null;

        return new DailyRoomSummary(
            RoomId: roomId,
            Date: date,
            Energy: new EnergyDailySummary(
                TotalKwh: raw.EnergyTotal,
                PeakHourlyKwh: raw.EnergyPeak,
                AverageHourlyKwh: raw.EnergyAvg),
            AirQuality: new AirQualityDailySummary(
                AverageCo2: raw.AvgCo2,
                MinCo2: raw.MinCo2,
                MaxCo2: raw.MaxCo2,
                AveragePm25: raw.AvgPm25,
                MinPm25: raw.MinPm25,
                MaxPm25: raw.MaxPm25,
                AverageHumidity: raw.AvgHumidity,
                MinHumidity: raw.MinHumidity,
                MaxHumidity: raw.MaxHumidity),
            Motion: new MotionDailySummary(
                TotalEvents: raw.MotionTotal,
                ActiveHours: raw.MotionActiveHours));
    }
}
