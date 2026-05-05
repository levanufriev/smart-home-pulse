namespace DataIngestor.Worker.Models;

public record Metric(
    string Type,
    string Name,
    MetricPayload? Payload);

public record MetricPayload(
    double? Energy,
    bool? MotionDetected,
    int? Co2,
    int? Pm25,
    int? Humidity);
