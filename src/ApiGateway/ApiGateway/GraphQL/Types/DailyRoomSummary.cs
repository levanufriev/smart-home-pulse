namespace ApiGateway.GraphQL.Types;

public record DailyRoomSummary(
    Guid RoomId,
    DateOnly Date,
    EnergyDailySummary Energy,
    AirQualityDailySummary AirQuality,
    MotionDailySummary Motion);

public record EnergyDailySummary(
    double TotalKwh,
    double? PeakHourlyKwh,
    double? AverageHourlyKwh);

public record AirQualityDailySummary(
    double? AverageCo2,
    double? MinCo2,
    double? MaxCo2,
    double? AveragePm25,
    double? MinPm25,
    double? MaxPm25,
    double? AverageHumidity,
    double? MinHumidity,
    double? MaxHumidity);

public record MotionDailySummary(
    int TotalEvents,
    int ActiveHours);
