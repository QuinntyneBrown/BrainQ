namespace BrainQ.Api.Embeddings;

public interface IEmbeddingClient
{
    Task<float[]?> EmbedAsync(string text, CancellationToken ct);
}
