using DataProcessor.Worker.Data.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace DataProcessor.Worker.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<TelemetryRecord> TelemetryRecords => Set<TelemetryRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TelemetryRecord>()
            .Property(x => x.Type)
            .HasConversion<string>();

        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();
    }
}
