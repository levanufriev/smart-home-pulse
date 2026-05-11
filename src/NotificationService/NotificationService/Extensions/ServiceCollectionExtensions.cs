using MassTransit;
using NotificationService.Consumers;
using Serilog;

namespace NotificationService.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static IServiceCollection AddSerilogLogging(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSerilog((sp, lc) => lc
            .ReadFrom.Configuration(configuration)
            .ReadFrom.Services(sp));

        return services;
    }

    internal static IServiceCollection AddMessaging(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddMassTransit(x =>
        {
            x.AddConsumer<TelemetryBatchPersistedConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(configuration["RabbitMQ:Host"], "/", h =>
                {
                    h.Username(configuration["RabbitMQ:Username"] ?? "guest");
                    h.Password(configuration["RabbitMQ:Password"] ?? "guest");
                });

                cfg.ReceiveEndpoint("notification-telemetry-persisted", e =>
                {
                    e.Durable = false;                                                  // queue not persisted
                    e.AutoDelete = true;                                                // queue removed when service stops
                    e.UseMessageRetry(r => r.Interval(2, TimeSpan.FromSeconds(1)));     // absorb transient glitches
                    e.DiscardSkippedMessages();                                         // no _skipped queue
                    e.DiscardFaultedMessages();                                         // no _error / DLQ after retries

                    e.ConfigureConsumer<TelemetryBatchPersistedConsumer>(context);
                });
            });
        });

        return services;
    }
}
