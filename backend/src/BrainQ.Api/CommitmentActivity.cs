namespace BrainQ.Api;

public sealed class CommitmentActivity
{
    public Guid Id { get; set; }
    public Guid CommitmentEntityId { get; set; }
    public DateOnly DateUtc { get; set; }
    public int Value { get; set; } = 1;
}
