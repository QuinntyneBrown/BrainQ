using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Endpoints;

public static class EdgesEndpoints
{
    public static void MapEdgesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/edges");
        group.MapPost("", CreateAsync);
        group.MapGet("", ListAsync);
        group.MapDelete("{id:guid}", DeleteAsync);
    }

    public sealed record CreateRequest(Guid FromEntityId, Guid ToEntityId, string? Type);

    public sealed record EdgeDto(Guid Id, Guid FromEntityId, Guid ToEntityId, string Type, DateTime CreatedUtc)
    {
        public static EdgeDto From(Edge e) =>
            new(e.Id, e.FromEntityId, e.ToEntityId, e.Type.ToString(),
                DateTime.SpecifyKind(e.CreatedUtc, DateTimeKind.Utc));
    }

    public sealed record ListQuery(Guid? FromId, Guid? ToId, string? Type);

    private static async Task<IResult> CreateAsync(CreateRequest req, AppDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Type) ||
            !Enum.TryParse<EdgeKind>(req.Type, out var kind) ||
            !Enum.IsDefined(kind))
        {
            return Results.BadRequest(new { error = $"unknown edge type '{req.Type}'" });
        }

        var fromExists = await db.Entities.AnyAsync(e => e.Id == req.FromEntityId, ct);
        var toExists = await db.Entities.AnyAsync(e => e.Id == req.ToEntityId, ct);
        if (!fromExists || !toExists)
        {
            return Results.BadRequest(new { error = "entity not found" });
        }

        var duplicate = await db.Edges.AnyAsync(
            x => x.FromEntityId == req.FromEntityId && x.ToEntityId == req.ToEntityId && x.Type == kind,
            ct);
        if (duplicate)
        {
            return Results.Conflict(new { error = "duplicate edge" });
        }

        var edge = new Edge
        {
            Id = Guid.NewGuid(),
            FromEntityId = req.FromEntityId,
            ToEntityId = req.ToEntityId,
            Type = kind,
            CreatedUtc = DateTime.UtcNow,
        };
        db.Edges.Add(edge);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/edges/{edge.Id}", EdgeDto.From(edge));
    }

    private static async Task<IResult> ListAsync(
        [AsParameters] ListQuery q,
        AppDbContext db,
        CancellationToken ct)
    {
        var query = db.Edges.AsNoTracking().AsQueryable();
        if (q.FromId is { } fromId) query = query.Where(e => e.FromEntityId == fromId);
        if (q.ToId is { } toId) query = query.Where(e => e.ToEntityId == toId);
        if (!string.IsNullOrWhiteSpace(q.Type))
        {
            if (!Enum.TryParse<EdgeKind>(q.Type, out var kind) || !Enum.IsDefined(kind))
            {
                return Results.BadRequest(new { error = $"unknown edge type '{q.Type}'" });
            }
            query = query.Where(e => e.Type == kind);
        }

        var items = await query.OrderByDescending(e => e.CreatedUtc).ToListAsync(ct);
        return Results.Ok(items.Select(EdgeDto.From));
    }

    private static async Task<IResult> DeleteAsync(Guid id, AppDbContext db, CancellationToken ct)
    {
        var edge = await db.Edges.FindAsync([id], ct);
        if (edge is null) return Results.NotFound();

        db.Edges.Remove(edge);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
}
