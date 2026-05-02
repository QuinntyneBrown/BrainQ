using Microsoft.Extensions.Logging;

namespace BrainQ.Api.Embeddings;

public sealed class NullEmbeddingClient : IEmbeddingClient
{
    private readonly ILogger<NullEmbeddingClient>? logger;

    public NullEmbeddingClient() { }
    public NullEmbeddingClient(ILogger<NullEmbeddingClient> logger)
    {
        this.logger = logger;
    }

    public Task<float[]?> EmbedAsync(string text, CancellationToken ct)
    {
        logger?.LogDebug("NullEmbeddingClient skipped embedding for {Length} chars", text.Length);
        return Task.FromResult<float[]?>(null);
    }
}
