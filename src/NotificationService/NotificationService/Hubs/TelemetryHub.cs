using Microsoft.AspNetCore.SignalR;

namespace NotificationService.Hubs;

public class TelemetryHub : Hub
{
    public Task JoinRoom(Guid roomId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, $"room:{roomId}");
    }

    public Task LeaveRoom(Guid roomId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room:{roomId}");
    }
}
