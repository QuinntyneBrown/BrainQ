namespace BrainQ.Api;

/// <summary>
/// Pure helpers used by both EntitiesController.ListAsync (when hydrating
/// Commitment meta) and CommitmentsController. Kept here so neither controller
/// reaches across into the other's internals.
/// </summary>
public static class CommitmentMath
{
    public static DateOnly TodayLocal(TimeProvider clock) =>
        DateOnly.FromDateTime(clock.GetLocalNow().DateTime);

    public static int StreakOf(IEnumerable<CommitmentActivity> activity, Guid id, DateOnly today) =>
        StreakFromDates(
            activity.Where(a => a.CommitmentEntityId == id).Select(a => a.DateUtc).OrderByDescending(d => d),
            today);

    public static int StreakFromDates(IEnumerable<DateOnly> descendingDates, DateOnly today)
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

    public static bool TodayDoneOf(IEnumerable<CommitmentActivity> activity, Guid id, DateOnly today) =>
        activity.Any(a => a.CommitmentEntityId == id && a.DateUtc == today);
}
