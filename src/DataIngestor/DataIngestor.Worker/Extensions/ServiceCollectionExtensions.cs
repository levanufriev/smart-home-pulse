using DataIngestor.Worker.Exceptions;
using DataIngestor.Worker.Services;
using MassTransit;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Refit;
using Serilog;

namespace DataIngestor.Worker.Extensions;

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
            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(configuration["RabbitMQ:Host"], "/", h =>
                {
                    h.Username(configuration["RabbitMQ:Username"] ?? "guest");
                    h.Password(configuration["RabbitMQ:Password"] ?? "guest");
                });

                cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(1)));
                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }

    internal static IServiceCollection AddWeakApiClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddTransient<AuthHandler>();
        services.AddTransient<CorruptedDataHandler>();

        var apiBuilder = services
            .AddRefitClient<IWeakApi>()
            .ConfigureHttpClient(c =>
            {
                var baseUrl = configuration["WeakApi:BaseUrl"] ?? "http://localhost:8080";
                c.BaseAddress = new Uri(baseUrl);
            })
            .AddHttpMessageHandler<AuthHandler>();

        apiBuilder
            .AddStandardResilienceHandler(options =>
            {
                options.Retry.MaxRetryAttempts = 2;
                options.Retry.BackoffType = DelayBackoffType.Constant;
                options.Retry.Delay = TimeSpan.FromSeconds(1);
                options.Retry.UseJitter = true;

                options.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(5);
                options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(5);

                options.Retry.ShouldHandle = args =>
                {
                    if (args.Outcome.Exception is CorruptedDataException)
                        return new ValueTask<bool>(true);

                    return new ValueTask<bool>(HttpClientResiliencePredicates.IsTransient(args.Outcome));
                };
            });

        apiBuilder.AddHttpMessageHandler<CorruptedDataHandler>();

        return services;
    }
}
