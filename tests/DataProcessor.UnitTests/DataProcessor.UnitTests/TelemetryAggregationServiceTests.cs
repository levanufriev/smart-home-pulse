using DataProcessor.Worker.Data;
using DataProcessor.Worker.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Shared.Domain.Entities;
using Shared.Domain.Enums;
using Shared.Domain.Projections;

namespace DataProcessor.UnitTests;

public class TelemetryAggregationServiceTests
{
    private static AppDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static TelemetryAggregationService CreateSut(AppDbContext db) =>
        new(db, NullLogger<TelemetryAggregationService>.Instance);

    private static Room SeedRoom(AppDbContext db, Guid? id = null)
    {
        var room = new Room { Id = id ?? Guid.NewGuid(), Name = $"room-{Guid.NewGuid():N}"[..12] };
        db.Rooms.Add(room);
        db.SaveChanges();
        return room;
    }

    private static DateTime UtcHour(DateTime dt) =>
        new(dt.Year, dt.Month, dt.Day, dt.Hour, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task ProcessAggregatesAsync_EmptyInput_DoesNothing()
    {
        await using var db = NewContext();
        var sut = CreateSut(db);

        await sut.ProcessAggregatesAsync([], CancellationToken.None);

        Assert.Empty(db.HourlyAggregates);
    }

    [Fact]
    public async Task ProcessAggregatesAsync_Energy_CreatesAggregateWithAveragesAndTotal()
    {
        await using var db = NewContext();
        var room = SeedRoom(db);
        var hour = new DateTime(2026, 5, 1, 14, 22, 0, DateTimeKind.Utc);
        var sut = CreateSut(db);

        var records = new List<TelemetryRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Energy,
                RoomId = room.Id,
                Energy = 10,
            },
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Energy,
                RoomId = room.Id,
                Energy = 20,
            },
        };

        await sut.ProcessAggregatesAsync(records, CancellationToken.None);

        var agg = Assert.Single(db.HourlyAggregates.Local);
        Assert.Equal(room.Id, agg.RoomId);
        Assert.Equal(SensorType.Energy, agg.Type);
        Assert.Equal(UtcHour(hour), agg.HourBucket);
        Assert.Equal(2, agg.RecordCount);
        Assert.Equal(15, agg.AvgEnergy);
        Assert.Equal(30, agg.TotalEnergy);
    }

    [Fact]
    public async Task ProcessAggregatesAsync_Energy_MergesIntoExistingAggregate()
    {
        await using var db = NewContext();
        var room = SeedRoom(db);
        var hour = new DateTime(2026, 5, 2, 9, 0, 0, DateTimeKind.Utc);
        var bucket = UtcHour(hour);

        db.HourlyAggregates.Add(new HourlyAggregate
        {
            Id = Guid.NewGuid(),
            RoomId = room.Id,
            Type = SensorType.Energy,
            HourBucket = bucket,
            RecordCount = 2,
            AvgEnergy = 15,
            TotalEnergy = 30,
        });
        await db.SaveChangesAsync();

        var sut = CreateSut(db);
        var records = new List<TelemetryRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Energy,
                RoomId = room.Id,
                Energy = 12,
            },
        };

        await sut.ProcessAggregatesAsync(records, CancellationToken.None);

        var agg = Assert.Single(db.HourlyAggregates.Local);
        Assert.Equal(3, agg.RecordCount);
        Assert.Equal(14, agg.AvgEnergy);
        Assert.Equal(42, agg.TotalEnergy);
    }

    [Fact]
    public async Task ProcessAggregatesAsync_AirQuality_AveragesSensorFields()
    {
        await using var db = NewContext();
        var room = SeedRoom(db);
        var hour = new DateTime(2026, 5, 3, 11, 0, 0, DateTimeKind.Utc);
        var sut = CreateSut(db);

        var records = new List<TelemetryRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.AirQuality,
                RoomId = room.Id,
                Co2 = 400,
                Pm25 = 10,
                Humidity = 40,
            },
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.AirQuality,
                RoomId = room.Id,
                Co2 = 500,
                Pm25 = 20,
                Humidity = 50,
            },
        };

        await sut.ProcessAggregatesAsync(records, CancellationToken.None);

        var agg = Assert.Single(db.HourlyAggregates.Local);
        Assert.Equal(450, agg.AvgCo2);
        Assert.Equal(15, agg.AvgPm25);
        Assert.Equal(45, agg.AvgHumidity);
        Assert.Equal(2, agg.RecordCount);
    }

    [Fact]
    public async Task ProcessAggregatesAsync_Motion_OnlyCountsTrueDetections()
    {
        await using var db = NewContext();
        var room = SeedRoom(db);
        var hour = new DateTime(2026, 5, 4, 16, 30, 0, DateTimeKind.Utc);
        var sut = CreateSut(db);

        var records = new List<TelemetryRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Motion,
                RoomId = room.Id,
                MotionDetected = true,
            },
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Motion,
                RoomId = room.Id,
                MotionDetected = false,
            },
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Motion,
                RoomId = room.Id,
                MotionDetected = true,
            },
        };

        await sut.ProcessAggregatesAsync(records, CancellationToken.None);

        var agg = Assert.Single(db.HourlyAggregates.Local);
        Assert.Equal(3, agg.RecordCount);
        Assert.Equal(2, agg.MotionCount);
    }

    [Fact]
    public async Task ProcessAggregatesAsync_SplitsByRoomAndSensorType()
    {
        await using var db = NewContext();
        var roomA = SeedRoom(db);
        var roomB = SeedRoom(db);
        var hour = new DateTime(2026, 5, 5, 12, 0, 0, DateTimeKind.Utc);
        var sut = CreateSut(db);

        var records = new List<TelemetryRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Energy,
                RoomId = roomA.Id,
                Energy = 5,
            },
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Motion,
                RoomId = roomA.Id,
                MotionDetected = true,
            },
            new()
            {
                Id = Guid.NewGuid(),
                BatchEventId = Guid.NewGuid(),
                CapturedAt = hour,
                Type = SensorType.Energy,
                RoomId = roomB.Id,
                Energy = 7,
            },
        };

        await sut.ProcessAggregatesAsync(records, CancellationToken.None);

        Assert.Equal(3, db.HourlyAggregates.Local.Count);
        Assert.Contains(db.HourlyAggregates.Local, a =>
            a.RoomId == roomA.Id && a.Type == SensorType.Energy && a.RecordCount == 1);
        Assert.Contains(db.HourlyAggregates.Local, a =>
            a.RoomId == roomA.Id && a.Type == SensorType.Motion && a.MotionCount == 1);
        Assert.Contains(db.HourlyAggregates.Local, a =>
            a.RoomId == roomB.Id && a.Type == SensorType.Energy && a.AvgEnergy == 7);
    }
}
