using DataProcessor.IntegrationTests.Infrastructure;
using DataProcessor.Worker.Caching;
using DataProcessor.Worker.Consumers;
using DataProcessor.Worker.Data;
using DataProcessor.Worker.Services;
using MassTransit;
using MassTransit.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Shared.Contracts.Events;
using Shared.Domain.Entities;
using Shared.Domain.Enums;

namespace DataProcessor.IntegrationTests;

[Collection(DataProcessorPostgresCollection.Name)]
[Trait("Category", "Integration")]
public sealed class TelemetryBatchConsumerIntegrationTests
{
    private readonly PostgresFixture _postgres;

    public TelemetryBatchConsumerIntegrationTests(PostgresFixture postgres) => _postgres = postgres;

    private ServiceProvider BuildProvider()
    {
        var services = new ServiceCollection();
        services.AddSingleton<RoomCache>();
        services.AddSingleton<ILogger<TelemetryBatchConsumer>>(_ => NullLogger<TelemetryBatchConsumer>.Instance);
        services.AddSingleton<ILogger<TelemetryAggregationService>>(_ => NullLogger<TelemetryAggregationService>.Instance);
        services.AddDbContext<AppDbContext>(o => o.UseNpgsql(_postgres.ConnectionString));
        services.AddScoped<ITelemetryAggregationService, TelemetryAggregationService>();

        services.AddMassTransitTestHarness(cfg =>
        {
            cfg.AddConsumer<TelemetryBatchConsumer>();
        });

        return services.BuildServiceProvider(true);
    }

    [Fact]
    public async Task Consume_PersistsRoomsTelemetryAggregates_AndPublishesBatchPersisted()
    {
        await using var provider = BuildProvider();
        var harness = provider.GetRequiredService<ITestHarness>();
        await harness.Start();

        try
        {
            var endpoint = await harness.GetConsumerEndpoint<TelemetryBatchConsumer>();
            var batchId = Guid.NewGuid();
            var ts = new DateTime(2026, 7, 15, 11, 30, 0, DateTimeKind.Utc);
            var roomName = $"consumer-room-{Guid.NewGuid():N}"[..26];

            await endpoint.Send(new TelemetryBatchProduced(batchId, ts,
                new List<TelemetryPoint>
                {
                    new(SensorType.Energy, roomName, Energy: 100),
                    new(SensorType.Motion, roomName, MotionDetected: true),
                }));

            var consumerHarness = harness.GetConsumerHarness<TelemetryBatchConsumer>();
            Assert.True(await consumerHarness.Consumed.Any<TelemetryBatchProduced>());

            Assert.True(await harness.Published.Any<TelemetryBatchPersisted>(x =>
                x.Context.Message.BatchId == batchId));

            await using var db = _postgres.CreateDbContext();
            var room = await db.Rooms.SingleAsync(r => r.Name == roomName);

            var records = await db.TelemetryRecords.Where(r => r.BatchEventId == batchId).ToListAsync();
            Assert.Equal(2, records.Count);
            Assert.All(records, r => Assert.Equal(room.Id, r.RoomId));

            var energyAgg = await db.HourlyAggregates.SingleAsync(a =>
                a.RoomId == room.Id && a.Type == SensorType.Energy);
            Assert.Equal(1, energyAgg.RecordCount);
            Assert.Equal(100, energyAgg.AvgEnergy);
            Assert.Equal(100, energyAgg.TotalEnergy);

            var motionAgg = await db.HourlyAggregates.SingleAsync(a =>
                a.RoomId == room.Id && a.Type == SensorType.Motion);
            Assert.Equal(1, motionAgg.RecordCount);
            Assert.Equal(1, motionAgg.MotionCount);
        }
        finally
        {
            await harness.Stop();
        }
    }

    [Fact]
    public async Task Consume_UsesRoomCache_WhenRoomAlreadyExistsInDatabase()
    {
        var roomName = $"cached-{Guid.NewGuid():N}"[..20];
        var knownId = Guid.NewGuid();

        await using (var setupDb = _postgres.CreateDbContext())
        {
            setupDb.Rooms.Add(new Room { Id = knownId, Name = roomName });
            await setupDb.SaveChangesAsync();
        }

        await using var provider = BuildProvider();
        var cache = provider.GetRequiredService<RoomCache>();
        cache.Map[roomName] = knownId;

        var harness = provider.GetRequiredService<ITestHarness>();
        await harness.Start();

        try
        {
            var endpoint = await harness.GetConsumerEndpoint<TelemetryBatchConsumer>();
            var batchId = Guid.NewGuid();
            var ts = new DateTime(2026, 7, 16, 9, 0, 0, DateTimeKind.Utc);

            await endpoint.Send(new TelemetryBatchProduced(batchId, ts,
                new List<TelemetryPoint>
                {
                    new(SensorType.Energy, roomName, Energy: 50),
                }));

            var consumerHarness = harness.GetConsumerHarness<TelemetryBatchConsumer>();
            Assert.True(await consumerHarness.Consumed.Any<TelemetryBatchProduced>());

            await using var db = _postgres.CreateDbContext();
            var room = await db.Rooms.SingleAsync(r => r.Name == roomName);
            Assert.Equal(knownId, room.Id);

            var record = await db.TelemetryRecords.SingleAsync(r => r.BatchEventId == batchId);
            Assert.Equal(knownId, record.RoomId);
        }
        finally
        {
            await harness.Stop();
        }
    }
}
