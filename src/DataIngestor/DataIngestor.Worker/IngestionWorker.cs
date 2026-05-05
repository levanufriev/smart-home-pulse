using DataIngestor.Worker.Mappers;
using DataIngestor.Worker.Services;
using MassTransit;
using Shared.Contracts.Events;

namespace DataIngestor.Worker;

public class IngestionWorker(IServiceProvider serviceProvider, ILogger<IngestionWorker> logger) : BackgroundService
{
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(10);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = serviceProvider.CreateScope();
            var api = scope.ServiceProvider.GetRequiredService<IWeakApi>();
            var bus = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

            try
            {
                var metrics = await api.GetMetersAsync(stoppingToken);

                if (metrics != null && metrics.Count != 0)
                {
                    var validPoints = metrics
                        .Select(m => m.ToTelemetryPoint())
                        .OfType<TelemetryPoint>()
                        .ToList();

                    if (validPoints.Count != 0)
                    {
                        var batchEvent = new TelemetryBatchProduced(
                            EventId: Guid.NewGuid(),
                            Timestamp: DateTime.UtcNow,
                            Points: validPoints);

                        await bus.Publish(batchEvent, stoppingToken);

                        logger.LogInformation("Successfully ingested and published {Count} telemetry points.", validPoints.Count);
                    }
                    else
                    {
                        logger.LogDebug("Received data from API, but no valid telemetry points were mapped.");
                    }
                }
            }
            catch (Exception ex) 
            {
                logger.LogError(ex, "Ingestion cycle failed after all retries were exhausted.");
            }

            await Task.Delay(PollingInterval, stoppingToken);
        }
    }
}
