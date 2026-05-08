using Microsoft.EntityFrameworkCore;
using Shared.Domain.Entities;
using Shared.Domain.Projections;

namespace ApiGateway.Data;

public class GatewayDbContext(DbContextOptions<GatewayDbContext> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<TelemetryRecord> TelemetryRecords => Set<TelemetryRecord>();
    public DbSet<HourlyAggregate> HourlyAggregates => Set<HourlyAggregate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Room>(entity =>
        {
            entity.ToTable("rooms");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<TelemetryRecord>(entity =>
        {
            entity.ToTable("telemetry_records");
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId);

            entity.Property(x => x.Type).HasConversion<string>();
        });

        modelBuilder.Entity<HourlyAggregate>(entity =>
        {
            entity.ToTable("hourly_aggregates");
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId);

            entity.Property(x => x.Type).HasConversion<string>();
        });
    }
}
