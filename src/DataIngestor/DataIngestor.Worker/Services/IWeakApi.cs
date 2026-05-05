using DataIngestor.Worker.Models;
using Refit;

namespace DataIngestor.Worker.Services;

public interface IWeakApi
{
    [Get("/meters")]
    Task<List<Metric>> GetMetersAsync(CancellationToken cancellationToken);
}
