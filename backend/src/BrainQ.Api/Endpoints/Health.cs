using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", async (AppDbContext db, CancellationToken ct) =>
        {
            try
            {
                if (db.Database.IsRelational())
                {
                    await db.Database.ExecuteSqlRawAsync("SELECT 1", ct);
                }
                else
                {
                    _ = await db.Entities.CountAsync(ct);
                }
                return Results.Ok(new { status = "ok", db = "ok" });
            }
            catch (Exception ex)
            {
                return Results.Json(
                    new { status = "down", db = "unreachable", error = ex.Message },
                    statusCode: 503);
            }
        });
    }
}
