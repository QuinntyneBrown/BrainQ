using BrainQ.Api.Contracts;
using BrainQ.Api.Embeddings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace BrainQ.Api.Controllers;

[ApiController]
[Route("api/search")]
public sealed class SearchController(AppDbContext db, IEmbeddingClient embed) : ControllerBase
{
    public sealed record SearchHit(EntityDto Entity, double Distance);

    [HttpGet]
    public async Task<IActionResult> SearchAsync(
        [FromQuery(Name = "q")] string? q,
        [FromQuery] string? type,
        [FromQuery] int? take,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { error = "q required" });
        }

        var vec = await embed.EmbedAsync(q, ct);
        if (vec is null)
        {
            return Ok(Array.Empty<SearchHit>());
        }

        var query = db.Entities.AsNoTracking().Where(e => e.Embedding != null);
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<EntityType>(type, ignoreCase: true, out var parsed) ||
                !Enum.IsDefined(parsed))
            {
                return BadRequest(new { error = $"unknown type '{type}'" });
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

        return Ok(rows.Select(r => new SearchHit(EntityDto.From(r.Entity), r.Distance)));
    }
}
