using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Endpoints;

public static class TodayEndpoints
{
    public sealed record AgendaDto(
        string Date,
        string Greeting,
        string Prompt,
        string[] Recent,
        NudgeDto[] Nudges);

    public sealed record NudgeDto(string Id, string Text, string Kind, string EntityId);

    public static void MapTodayEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/today", GetAsync);
    }

    private static async Task<IResult> GetAsync(AppDbContext db, TimeProvider clock, CancellationToken ct)
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
                $"{p.Title} — worth a message.",
                "soft",
                p.Id.ToString()))
            .ToArray();

        return Results.Ok(new AgendaDto(
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
