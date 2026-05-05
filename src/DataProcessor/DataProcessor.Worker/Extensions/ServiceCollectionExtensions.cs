using DataProcessor.Worker.Consumers;
using DataProcessor.Worker.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace DataProcessor.Worker.Extensions;

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

    internal static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            var connectionString = configuration.GetConnectionString("Postgres");
            options.UseNpgsql(connectionString);
        });

        return services;
    }

    internal static IServiceCollection AddMessaging(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddMassTransit(x =>
        {
            x.AddEntityFrameworkOutbox<AppDbContext>(o =>
            {
                o.UsePostgres();
                o.UseBusOutbox();
            });

            x.AddConsumer<TelemetryBatchConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(configuration["RabbitMQ:Host"], "/", h =>
                {
                    h.Username(configuration["RabbitMQ:Username"] ?? "guest");
                    h.Password(configuration["RabbitMQ:Password"] ?? "guest");
                });

                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
