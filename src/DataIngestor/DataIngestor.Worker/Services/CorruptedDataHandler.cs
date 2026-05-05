using DataIngestor.Worker.Exceptions;

namespace DataIngestor.Worker.Services;

public class CorruptedDataHandler(ILogger<CorruptedDataHandler> logger) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            await response.Content.LoadIntoBufferAsync();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var trimmedContent = content.Trim();

            if (trimmedContent == "[]")
            {
                logger.LogDebug("API returned an empty array []. No telemetry available right now.");

                return response;
            }

            if (trimmedContent.Contains("\"error\"") && trimmedContent.Contains("data corrupted"))
            {
                logger.LogWarning("Intercepted corrupted data payload disguised as a 200 OK. Forcing failure.");

                throw new CorruptedDataException("Unstable API returned corrupted data payload.");
            }
        }

        return response;
    }
}
