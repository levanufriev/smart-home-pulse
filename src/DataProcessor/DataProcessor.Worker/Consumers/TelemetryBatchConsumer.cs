using DataProcessor.Worker.Caching;
using DataProcessor.Worker.Data;
using DataProcessor.Worker.Mappers;
using DataProcessor.Worker.Services;
using MassTransit;
using Shared.Contracts.Events;
using Shared.Domain.Entities;

namespace DataProcessor.Worker.Consumers;

public class TelemetryBatchConsumer(
    AppDbContext dbContext,
    RoomCache roomCache,
    ITelemetryAggregationService aggregationService,
    ILogger<TelemetryBatchConsumer> logger) : IConsumer<TelemetryBatchProduced>
{
    public async Task Consume(ConsumeContext<TelemetryBatchProduced> context)
    {
        var batch = context.Message;
        logger.LogInformation("Received batch {BatchId} with {Count} points. Saving to database...",
            batch.EventId, batch.Points.Count);

        var uniqueRoomNames = batch.Points.Select(p => p.RoomName).Distinct();

        var batchRooms = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        var newRoomsToCache = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        foreach (var roomName in uniqueRoomNames)
        {
            if (roomCache.Map.TryGetValue(roomName, out Guid roomId))
            {
                batchRooms[roomName] = roomId;
            }
            else
            {
                roomId = Guid.NewGuid();
                dbContext.Rooms.Add(new Room { Id = roomId, Name = roomName });

                batchRooms[roomName] = roomId;
                newRoomsToCache[roomName] = roomId;

                logger.LogInformation("New room created: {RoomName}", roomName);
            }
        }

        var records = batch.Points
            .Select(point => point.ToEntity(batch.EventId, batchRooms[point.RoomName], batch.Timestamp))
            .ToList();

        await dbContext.TelemetryRecords.AddRangeAsync(records, context.CancellationToken);

        await aggregationService.ProcessAggregatesAsync(records, context.CancellationToken);

        var outgoingEvent = new TelemetryBatchPersisted(
            BatchId: batch.EventId,
            SavedAt: DateTime.UtcNow,
            CapturedAt: batch.Timestamp,
            SavedRecords: records.Select(r => r.ToSummary()).ToList()
        );

        await context.Publish(outgoingEvent, context.CancellationToken);

        await dbContext.SaveChangesAsync(context.CancellationToken);

        foreach (var newRoom in newRoomsToCache)
        {
            roomCache.Map.TryAdd(newRoom.Key, newRoom.Value);
        }

        logger.LogInformation("Batch {BatchId} with {Count} records persisted and event published.",
            batch.EventId, records.Count);
    }
}
