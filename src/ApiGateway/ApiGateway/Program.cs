using ApiGateway.Data;
using ApiGateway.GraphQL;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddPooledDbContextFactory<GatewayDbContext>(options => options
    .UseNpgsql(builder.Configuration.GetConnectionString("Postgres"))
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("GraphQLPolicy", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .RegisterDbContextFactory<GatewayDbContext>()
    .AddProjections()
    .AddFiltering()
    .AddSorting()
    .AddMaxExecutionDepthRule(10)
    .ModifyRequestOptions(o => o.ExecutionTimeout = TimeSpan.FromSeconds(15));

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
                .AllowAnyMethod();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseCors();

app.UseRateLimiter();

app.MapGraphQL("/graphql").RequireRateLimiting("GraphQLPolicy");

await app.RunAsync();
