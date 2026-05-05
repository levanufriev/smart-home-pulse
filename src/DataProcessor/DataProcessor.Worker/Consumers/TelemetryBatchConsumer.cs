using DataProcessor.Worker.Data;
using DataProcessor.Worker.Data.Entities;
using DataProcessor.Worker.Mappers;
using MassTransit;
using Shared.Contracts.Events;

namespace DataProcessor.Worker.Consumers;

public class TelemetryBatchConsumer(
    AppDbContext dbContext,
    ILogger<TelemetryBatchConsumer> logger) : IConsumer<TelemetryBatchProduced>
{
    public async Task Consume(ConsumeContext<TelemetryBatchProduced> context)
    {
        var batch = context.Message;
        logger.LogInformation("Received batch {BatchId} with {Count} points. Saving to database...",
            batch.EventId, batch.Points.Count);

        var records = batch.Points
            .Select(p => p.ToEntity(batch.EventId, batch.Timestamp))
            .ToList();

        await dbContext.TelemetryRecords.AddRangeAsync(records, context.CancellationToken);

        var outgoingEvent = new TelemetryBatchPersisted(
            BatchId: batch.EventId,
            SavedAt: DateTime.UtcNow,
            SavedRecords: records.Select(r => r.ToSummary()).ToList()
        );

        await context.Publish(outgoingEvent, context.CancellationToken);

        await dbContext.SaveChangesAsync(context.CancellationToken);

        logger.LogInformation("Successfully processed and saved batch {BatchId}.", batch.EventId);
    }
}
