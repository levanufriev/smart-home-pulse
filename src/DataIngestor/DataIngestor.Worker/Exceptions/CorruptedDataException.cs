namespace DataIngestor.Worker.Exceptions;

public class CorruptedDataException(string message) : Exception(message);