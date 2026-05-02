using BrainQ.Api.Contracts;
using BrainQ.Api.Embeddings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Pgvector;

namespace BrainQ.Api.Controllers;

[ApiController]
[Route("api/entities")]
public sealed class EntitiesController(AppDbContext db, IEmbeddingClient embed) : ControllerBase
{
    public sealed record CreateRequest(string? Type, string? Text);

    [HttpPost]
    [EnableRateLimiting("writes")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateRequest? req, CancellationToken ct)
    {
        if (req is null)
        {
            return BadRequest(new { error = "body required" });
        }

        if (string.IsNullOrWhiteSpace(req.Text))
        {
            return BadRequest(new { error = "text required" });
        }

        if (string.IsNullOrWhiteSpace(req.Type) ||
            !Enum.TryParse<EntityType>(req.Type, out var type) ||
            !Enum.IsDefined(type))
        {
            return BadRequest(new { error = $"unknown type '{req.Type}'" });
        }

        if (req.Text.Length > 100_000)
        {
            return BadRequest(new { error = "body >100000" });
        }

        var firstLine = FirstLineFrom(req.Text);
        if (firstLine.Length > 200)
        {
            return BadRequest(new { error = "title >200" });
        }

        var now = DateTime.UtcNow;
        var title = firstLine.Length <= 80 ? firstLine : firstLine[..80];
        var entity = new Entity
        {
            Id = Guid.NewGuid(),
            Type = type,
            Title = title,
            Body = req.Text,
            Subtitle = "Just captured",
            Tags = [],
            Attributes = System.Text.Json.JsonDocument.Parse("{}"),
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        var vec = await embed.EmbedAsync($"{title}\n\n{req.Text}", ct);
        if (vec is not null) entity.Embedding = new Vector(vec);

        db.Entities.Add(entity);
        await db.SaveChangesAsync(ct);

        return Created($"/api/entities/{entity.Id}", EntityDto.From(entity));
    }

    [HttpGet]
    public async Task<IActionResult> ListAsync(
        [FromQuery] string? type,
        [FromQuery(Name = "q")] string? q,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? take,
        [FromQuery] int? skip,
        CancellationToken ct)
    {
        var query = db.Entities.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
        {
            var types = new List<EntityType>();
            foreach (var part in type.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!Enum.TryParse<EntityType>(part, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
                {
                    return BadRequest(new { error = $"unknown type '{part}'" });
                }
                types.Add(parsed);
            }
            query = query.Where(e => types.Contains(e.Type));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var needle = q.Trim().ToLower();
            var pattern = $"%{needle}%";
            var isInMemory = db.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";
            query = isInMemory
                ? query.Where(e =>
                    e.Title.ToLower().Contains(needle) ||
                    e.Body.ToLower().Contains(needle) ||
                    e.Tags.Any(t => t.ToLower().Contains(needle)))
                : query.Where(e =>
                    EF.Functions.ILike(e.Title, pattern) ||
                    EF.Functions.ILike(e.Body, pattern) ||
                    e.Tags.Any(t => EF.Functions.ILike(t, pattern)));
        }

        if (from is { })
        {
            query = query.Where(e => e.CreatedUtc >= from);
        }
        if (to is { })
        {
            query = query.Where(e => e.CreatedUtc <= to);
        }

        var limit = Math.Clamp(take ?? 50, 1, 200);
        var offset = Math.Max(skip ?? 0, 0);

        var items = await query
            .OrderByDescending(e => e.UpdatedUtc)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(ct);

        return Ok(items.Select(EntityDto.From));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Entities.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, ct);

        return entity is null
            ? NotFound()
            : Ok(EntityDto.From(entity));
    }

    [HttpDelete("{id:guid}")]
    [EnableRateLimiting("writes")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Entities.FindAsync([id], ct);
        if (entity is null) return NotFound();

        var edges = await db.Edges
            .Where(e => e.FromEntityId == id || e.ToEntityId == id)
            .ToListAsync(ct);
        db.Edges.RemoveRange(edges);
        db.Entities.Remove(entity);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static string FirstLineFrom(string text)
    {
        return text.Split('\n', 2)[0].Trim();
    }
}
