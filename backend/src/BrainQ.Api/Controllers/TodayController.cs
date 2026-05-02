using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Controllers;

[ApiController]
[Route("api/today")]
public sealed class TodayController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    public sealed record AgendaDto(
        string Date,
        string Greeting,
        string Prompt,
        string[] Recent,
        NudgeDto[] Nudges);

    public sealed record NudgeDto(string Id, string Text, string Kind, string EntityId);

    [HttpGet]
    public async Task<IActionResult> GetAsync(CancellationToken ct)
    {
        var now = clock.GetLocalNow().DateTime;
        var entities = await db.Entities.AsNoTracking().ToListAsync(ct);

        var recent = entities
            .OrderByDescending(e => e.UpdatedUtc)
            .Take(3)
            .Select(e => e.Id.ToString())
            .ToArray();

        var nudges = entities
            .Where(e => e.Type == EntityType.Person && e.Tags.Contains("overdue"))
            .Select(p => new NudgeDto(
                Guid.NewGuid().ToString(),
                $"{p.Title} \u2014 worth a message.",
                "soft",
                p.Id.ToString()))
            .ToArray();

        return Ok(new AgendaDto(
            Date: now.ToString("dddd, MMM d"),
            Greeting: GreetingFor(now),
            Prompt: "What's on your mind?",
            Recent: recent,
            Nudges: nudges));
    }

    private static string GreetingFor(DateTime t) => t.Hour switch
    {
        < 5 => "Quiet night",
        < 12 => "Quiet morning",
        < 17 => "Steady afternoon",
        _ => "Easy evening",
    };
}
