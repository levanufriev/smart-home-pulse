using System.Collections.Concurrent;

namespace DataProcessor.Worker.Caching;

public class RoomCache
{
    public ConcurrentDictionary<string, Guid> Map { get; } = new(StringComparer.OrdinalIgnoreCase);
}
