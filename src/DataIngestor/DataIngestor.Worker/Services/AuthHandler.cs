namespace DataIngestor.Worker.Services;

public class AuthHandler(IConfiguration configuration) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var apiKey = configuration["WeakApi:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
            request.Headers.TryAddWithoutValidation("X-Api-Key", apiKey);

        return base.SendAsync(request, cancellationToken);
    }
}
