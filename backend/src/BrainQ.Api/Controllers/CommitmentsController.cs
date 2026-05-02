using BrainQ.Api.Contracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrainQ.Api.Controllers;

[ApiController]
[Route("api/commitments")]
public sealed class CommitmentsController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    public sealed record LogResult(int Streak, bool TodayDone);
    public sealed record HeatmapResponse(int[][] Cells);

    [HttpPost("{id:guid}/log")]
    public async Task<IActionResult> LogAsync(Guid id, CancellationToken ct)
    {
        var commitment = await db.Entities.FindAsync([id], ct);
        if (commitment is null || commitment.Type != EntityType.Commitment)
        {
            return NotFound();
        }

        var today = TodayLocal(clock);
        var existing = await db.CommitmentActivities
            .FirstOrDefaultAsync(a => a.CommitmentEntityId == id && a.DateUtc == today, ct);
        if (existing is null)
        {
            db.CommitmentActivities.Add(new CommitmentActivity
            {
                Id = Guid.NewGuid(),
                CommitmentEntityId = id,
                DateUtc = today,
                Value = 1,
            });
            await db.SaveChangesAsync(ct);
        }

        var dates = await db.CommitmentActivities
            .Where(a => a.CommitmentEntityId == id)
            .Select(a => a.DateUtc)
            .OrderByDescending(d => d)
            .ToListAsync(ct);
        return Ok(new LogResult(StreakFromDates(dates, today), true));
    }

    [HttpGet("{id:guid}/activity")]
    public async Task<IActionResult> ActivityAsync(Guid id, [FromQuery] int? weeks, CancellationToken ct)
    {
        var weekCount = Math.Clamp(weeks ?? 18, 1, 52);
        var today = TodayLocal(clock);
        var startMonday = today.AddDays(-(weekCount * 7) + 1);
        var rows = await db.CommitmentActivities
            .Where(a => a.CommitmentEntityId == id && a.DateUtc >= startMonday)
            .ToListAsync(ct);

        var byDate = rows.ToDictionary(r => r.DateUtc, r => r.Value);
        var cells = new int[weekCount][];
        for (var w = 0; w < weekCount; w++)
        {
            cells[w] = new int[7];
            for (var d = 0; d < 7; d++)
            {
                var date = startMonday.AddDays(w * 7 + d);
                cells[w][d] = HeatBand(byDate.GetValueOrDefault(date, 0));
            }
        }
        return Ok(new HeatmapResponse(cells));
    }

    [HttpGet]
    public async Task<IActionResult> ListAsync(CancellationToken ct)
    {
        var commitments = await db.Entities
            .AsNoTracking()
            .Where(e => e.Type == EntityType.Commitment)
            .OrderByDescending(e => e.UpdatedUtc)
            .ToListAsync(ct);

        var ids = commitments.Select(c => c.Id).ToList();
        var today = TodayLocal(clock);
        var activity = await db.CommitmentActivities
            .Where(a => ids.Contains(a.CommitmentEntityId))
            .ToListAsync(ct);

        var dtos = commitments
            .Select(c => EntityDto.From(c)
                .WithCommitmentMeta(streak: StreakOf(activity, c.Id, today), todayDone: TodayDoneOf(activity, c.Id, today)))
            .ToList();
        return Ok(dtos);
    }

    internal static int StreakOf(IEnumerable<CommitmentActivity> activity, Guid id, DateOnly today) =>
        StreakFromDates(
            activity.Where(a => a.CommitmentEntityId == id).Select(a => a.DateUtc).OrderByDescending(d => d),
            today);

    internal static int StreakFromDates(IEnumerable<DateOnly> descendingDates, DateOnly today)
    {
        var streak = 0;
        var cursor = today;
        foreach (var d in descendingDates)
        {
            if (d == cursor) { streak++; cursor = cursor.AddDays(-1); }
            else if (d < cursor) break;
        }
        return streak;
    }

    internal static bool TodayDoneOf(IEnumerable<CommitmentActivity> activity, Guid id, DateOnly today) =>
        activity.Any(a => a.CommitmentEntityId == id && a.DateUtc == today);

    internal static DateOnly TodayLocal(TimeProvider clock) =>
        DateOnly.FromDateTime(clock.GetLocalNow().DateTime);

    private static int HeatBand(int v) => v switch
    {
        0 => 0,
        1 => 1,
        <= 2 => 2,
        <= 4 => 3,
        _ => 4,
    };
}
