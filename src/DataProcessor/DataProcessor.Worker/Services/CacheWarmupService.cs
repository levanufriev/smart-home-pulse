using DataProcessor.Worker.Caching;
using DataProcessor.Worker.Data;
using Microsoft.EntityFrameworkCore;

namespace DataProcessor.Worker.Services;

public class CacheWarmupService(
    IServiceProvider serviceProvider,
    RoomCache roomCache,
    ILogger<CacheWarmupService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting room cache warmup...");

        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var rooms = await dbContext.Rooms.ToListAsync(cancellationToken);

        foreach (var room in rooms)
        {
            roomCache.Map.TryAdd(room.Name, room.Id);
        }

        logger.LogInformation("Warmup completed. Loaded {Count} rooms.", rooms.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
