using DataProcessor.Worker.Caching;
using DataProcessor.Worker.Data;
using DataProcessor.Worker.Extensions;
using DataProcessor.Worker.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services.AddSingleton<RoomCache>();
    builder.Services.AddHostedService<CacheWarmupService>();

    builder.Services.AddScoped<ITelemetryAggregationService, TelemetryAggregationService>();

    builder.Services
        .AddSerilogLogging(builder.Configuration)
        .AddDatabase(builder.Configuration)
        .AddMessaging(builder.Configuration);

    var host = builder.Build();

    using (var scope = host.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}
