using Shared.Domain.Entities;

namespace DataProcessor.Worker.Services;

public interface ITelemetryAggregationService
{
    Task ProcessAggregatesAsync(List<TelemetryRecord> newRecords, CancellationToken cancellationToken);
}
