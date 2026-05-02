using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BrainQ.Api.Embeddings;

public sealed class EmbeddingsOptions
{
    public string Provider { get; set; } = "Null";
    public string Url { get; set; } = "http://localhost:11434";
    public string Model { get; set; } = "nomic-embed-text";
    public int Dim { get; set; } = 768;
}

public sealed class OllamaEmbeddingClient : IEmbeddingClient
{
    private readonly HttpClient http;
    private readonly EmbeddingsOptions options;
    private readonly ILogger<OllamaEmbeddingClient> logger;

    public OllamaEmbeddingClient(HttpClient http, IOptions<EmbeddingsOptions> options, ILogger<OllamaEmbeddingClient> logger)
    {
        this.http = http;
        this.options = options.Value;
        this.logger = logger;
    }

    public async Task<float[]?> EmbedAsync(string text, CancellationToken ct)
    {
        try
        {
            var response = await http.PostAsJsonAsync(
                new Uri(new Uri(options.Url), "/api/embeddings"),
                new { model = options.Model, prompt = text },
                ct);
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<OllamaResponse>(cancellationToken: ct);
            return body?.Embedding;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Ollama embedding failed; falling back to null");
            return null;
        }
    }

    private sealed record OllamaResponse(float[] Embedding);
}
