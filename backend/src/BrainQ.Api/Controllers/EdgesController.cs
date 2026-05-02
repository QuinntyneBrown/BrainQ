using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Controllers;

[ApiController]
[Route("api/edges")]
public sealed class EdgesController(AppDbContext db) : ControllerBase
{
    public sealed record CreateRequest(Guid FromEntityId, Guid ToEntityId, string? Type);

    public sealed record EdgeDto(Guid Id, Guid FromEntityId, Guid ToEntityId, string Type, DateTime CreatedUtc)
    {
        public static EdgeDto From(Edge e) =>
            new(e.Id, e.FromEntityId, e.ToEntityId, e.Type.ToString(),
                DateTime.SpecifyKind(e.CreatedUtc, DateTimeKind.Utc));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CreateRequest? req, CancellationToken ct)
    {
        if (req is null)
        {
            return BadRequest(new { error = "body required" });
        }

        if (string.IsNullOrWhiteSpace(req.Type) ||
            !Enum.TryParse<EdgeKind>(req.Type, out var kind) ||
            !Enum.IsDefined(kind))
        {
            return BadRequest(new { error = $"unknown edge type '{req.Type}'" });
        }

        var fromExists = await db.Entities.AnyAsync(e => e.Id == req.FromEntityId, ct);
        var toExists = await db.Entities.AnyAsync(e => e.Id == req.ToEntityId, ct);
        if (!fromExists || !toExists)
        {
            return BadRequest(new { error = "entity not found" });
        }

        var duplicate = await db.Edges.AnyAsync(
            x => x.FromEntityId == req.FromEntityId && x.ToEntityId == req.ToEntityId && x.Type == kind,
            ct);
        if (duplicate)
        {
            return Conflict(new { error = "duplicate edge" });
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

        return Created($"/api/edges/{edge.Id}", EdgeDto.From(edge));
    }

    [HttpGet]
    public async Task<IActionResult> ListAsync(
        [FromQuery] Guid? fromId,
        [FromQuery] Guid? toId,
        [FromQuery] string? type,
        CancellationToken ct)
    {
        var query = db.Edges.AsNoTracking().AsQueryable();
        if (fromId is { }) query = query.Where(e => e.FromEntityId == fromId);
        if (toId is { }) query = query.Where(e => e.ToEntityId == toId);
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<EdgeKind>(type, out var kind) || !Enum.IsDefined(kind))
            {
                return BadRequest(new { error = $"unknown edge type '{type}'" });
            }
            query = query.Where(e => e.Type == kind);
        }

        var items = await query.OrderByDescending(e => e.CreatedUtc).ToListAsync(ct);
        return Ok(items.Select(EdgeDto.From));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        var edge = await db.Edges.FindAsync([id], ct);
        if (edge is null) return NotFound();

        db.Edges.Remove(edge);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
