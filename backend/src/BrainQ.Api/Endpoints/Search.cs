using BrainQ.Api.Embeddings;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace BrainQ.Api.Endpoints;

public static class SearchEndpoints
{
    public sealed record SearchHit(EntitiesEndpoints.EntityDto Entity, double Distance);

    public static void MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/search", SearchAsync);
    }

    private static async Task<IResult> SearchAsync(
        string? q,
        string? type,
        int? take,
        AppDbContext db,
        IEmbeddingClient embed,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.BadRequest(new { error = "q required" });
        }

        var vec = await embed.EmbedAsync(q, ct);
        if (vec is null)
        {
            return Results.Ok(Array.Empty<SearchHit>());
        }

        var query = db.Entities.AsNoTracking().Where(e => e.Embedding != null);
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<EntityType>(type, ignoreCase: true, out var parsed) ||
                !Enum.IsDefined(parsed))
            {
                return Results.BadRequest(new { error = $"unknown type '{type}'" });
            }
            query = query.Where(e => e.Type == parsed);
        }

        var v = new Vector(vec);
        var limit = Math.Clamp(take ?? 8, 1, 50);
        var rows = await query
            .OrderBy(e => VectorDbFunctionsExtensions.CosineDistance(e.Embedding!, v))
            .Take(limit)
            .Select(e => new { Entity = e, Distance = VectorDbFunctionsExtensions.CosineDistance(e.Embedding!, v) })
            .ToListAsync(ct);

        return Results.Ok(rows.Select(r => new SearchHit(EntitiesEndpoints.EntityDto.From(r.Entity), r.Distance)));
    }
}
