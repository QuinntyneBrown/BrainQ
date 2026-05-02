using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAsync(CancellationToken ct)
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
            return Ok(new { status = "ok", db = "ok" });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { status = "down", db = "unreachable", error = ex.Message });
        }
    }
}
