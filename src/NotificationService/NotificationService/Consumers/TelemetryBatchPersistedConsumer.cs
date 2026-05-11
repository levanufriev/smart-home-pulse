using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Contracts;
using NotificationService.Hubs;
using Shared.Contracts.Events;

namespace NotificationService.Consumers;

public class TelemetryBatchPersistedConsumer(
    IHubContext<TelemetryHub> hub,
    ILogger<TelemetryBatchPersistedConsumer> logger) : IConsumer<TelemetryBatchPersisted>
{
    public async Task Consume(ConsumeContext<TelemetryBatchPersisted> context)
    {
        var message = context.Message;
        var ct = context.CancellationToken;

        logger.LogInformation("Received TelemetryBatchPersisted {BatchId} with {Count} records. Pushing to SignalR...",
            message.BatchId, message.SavedRecords.Count);

        var byRoom = message.SavedRecords.GroupBy(r => r.RoomId);

        foreach (var group in byRoom)
        {
            var roomId = group.Key;
            var groupName = $"room:{roomId}";

            var records = group
                .Select(r => new LiveTelemetryRecord(r.Type, r.Energy, r.MotionDetected, r.Co2, r.Pm25, r.Humidity))
                .ToList();

            try
            {
                await hub.Clients.Group(groupName).SendAsync(
                    "TelemetryUpdate",
                    new LiveTelemetryUpdate(roomId, message.CapturedAt, records),
                    ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send TelemetryUpdate to group {Group}", groupName);
            }

            try
            {
                await hub.Clients.Group(groupName).SendAsync(
                    "DailySummaryChanged",
                    new DailySummaryChangedNotification(roomId, DateOnly.FromDateTime(message.CapturedAt.ToUniversalTime())),
                    ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send DailySummaryChanged to group {Group}", groupName);
            }
        }

        logger.LogInformation("SignalR push complete for batch {BatchId}.", message.BatchId);
    }
}
