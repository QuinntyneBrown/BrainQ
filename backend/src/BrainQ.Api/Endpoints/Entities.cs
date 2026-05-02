using System.Text.Json;
using BrainQ.Api.Embeddings;
using Microsoft.EntityFrameworkCore;
using Pgvector;

namespace BrainQ.Api.Endpoints;

public static class EntitiesEndpoints
{
    public static void MapEntitiesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/entities");
        group.MapPost("", CreateAsync);
        group.MapGet("", ListAsync);
        group.MapGet("{id:guid}", GetAsync);
        group.MapDelete("{id:guid}", DeleteAsync);
    }

    public sealed record CreateRequest(string? Type, string? Text);

    public sealed record EntityDto(
        Guid Id,
        string Type,
        string Title,
        string Subtitle,
        string Body,
        IReadOnlyList<string> Tags,
        JsonElement Meta,
        IReadOnlyList<EdgeDto> Edges,
        DateTime CreatedUtc,
        DateTime UpdatedUtc)
    {
        public static EntityDto From(Entity entity) =>
            new(
                entity.Id,
                entity.Type.ToString(),
                entity.Title,
                entity.Subtitle,
                entity.Body,
                entity.Tags,
                entity.Attributes.RootElement.Clone(),
                [],
                DateTime.SpecifyKind(entity.CreatedUtc, DateTimeKind.Utc),
                DateTime.SpecifyKind(entity.UpdatedUtc, DateTimeKind.Utc));
    }

    public sealed record EdgeDto(string Kind, Guid To);

    private static async Task<IResult> CreateAsync(
        CreateRequest req,
        AppDbContext db,
        IEmbeddingClient embed,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Text))
        {
            return Results.BadRequest(new { error = "text required" });
        }

        if (string.IsNullOrWhiteSpace(req.Type) ||
            !Enum.TryParse<EntityType>(req.Type, out var type) ||
            !Enum.IsDefined(type))
        {
            return Results.BadRequest(new { error = $"unknown type '{req.Type}'" });
        }

        if (req.Text.Length > 100_000)
        {
            return Results.BadRequest(new { error = "body >100000" });
        }

        var firstLine = FirstLineFrom(req.Text);
        if (firstLine.Length > 200)
        {
            return Results.BadRequest(new { error = "title >200" });
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
            Attributes = JsonDocument.Parse("{}"),
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        var vec = await embed.EmbedAsync($"{title}\n\n{req.Text}", ct);
        if (vec is not null) entity.Embedding = new Vector(vec);

        db.Entities.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/entities/{entity.Id}", EntityDto.From(entity));
    }

    public sealed record ListQuery(
        string? Type,
        string? Q,
        DateTime? From,
        DateTime? To,
        int? Take,
        int? Skip);

    private static async Task<IResult> ListAsync(
        [AsParameters] ListQuery q,
        AppDbContext db,
        CancellationToken ct)
    {
        var query = db.Entities.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Type))
        {
            var types = new List<EntityType>();
            foreach (var part in q.Type.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!Enum.TryParse<EntityType>(part, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
                {
                    return Results.BadRequest(new { error = $"unknown type '{part}'" });
                }
                types.Add(parsed);
            }
            query = query.Where(e => types.Contains(e.Type));
        }

        if (!string.IsNullOrWhiteSpace(q.Q))
        {
            var needle = q.Q.Trim().ToLower();
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

        if (q.From is { } from)
        {
            query = query.Where(e => e.CreatedUtc >= from);
        }
        if (q.To is { } to)
        {
            query = query.Where(e => e.CreatedUtc <= to);
        }

        var take = Math.Clamp(q.Take ?? 50, 1, 200);
        var skip = Math.Max(q.Skip ?? 0, 0);

        var items = await query
            .OrderByDescending(e => e.UpdatedUtc)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);

        return Results.Ok(items.Select(EntityDto.From));
    }

    private static async Task<IResult> GetAsync(Guid id, AppDbContext db, CancellationToken ct)
    {
        var entity = await db.Entities.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, ct);

        return entity is null
            ? Results.NotFound()
            : Results.Ok(EntityDto.From(entity));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db, CancellationToken ct)
    {
        var entity = await db.Entities.FindAsync([id], ct);
        if (entity is null) return Results.NotFound();

        var edges = await db.Edges
            .Where(e => e.FromEntityId == id || e.ToEntityId == id)
            .ToListAsync(ct);
        db.Edges.RemoveRange(edges);
        db.Entities.Remove(entity);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    private static string FirstLineFrom(string text)
    {
        return text.Split('\n', 2)[0].Trim();
    }
}
