using System.Text.Json;
using System.Text.Json.Serialization;
using NotificationService.Extensions;
using NotificationService.Hubs;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Services
        .AddSerilogLogging(builder.Configuration)
        .AddMessaging(builder.Configuration);

    // Hub JSON payloads: SensorType (C# enum) → JSON strings "ENERGY", "MOTION", "AIR_QUALITY"
    // (not raw 1,2,3). JsonNamingPolicy.SnakeCaseUpper maps Energy→ENERGY, AirQuality→AIR_QUALITY.
    builder.Services.AddSignalR()
        .AddJsonProtocol(options =>
        {
            options.PayloadSerializerOptions.Converters.Add(
                new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseUpper));
        });

    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? Array.Empty<string>();

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            if (allowedOrigins.Length > 0)
            {
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
            else if (builder.Environment.IsDevelopment())
            {
                policy.SetIsOriginAllowed(_ => true)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
        });
    });

    var app = builder.Build();

    app.UseCors();
    app.MapHub<TelemetryHub>("/hubs/telemetry");

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}
