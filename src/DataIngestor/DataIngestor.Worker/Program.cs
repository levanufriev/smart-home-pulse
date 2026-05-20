//
using DataIngestor.Worker;
using DataIngestor.Worker.Extensions;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services
        .AddSerilogLogging(builder.Configuration)
        .AddMessaging(builder.Configuration)
        .AddWeakApiClient(builder.Configuration);

    builder.Services.AddHostedService<IngestionWorker>();

    var host = builder.Build();
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
