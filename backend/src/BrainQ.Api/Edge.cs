namespace BrainQ.Api;

public enum EdgeKind
{
    mentions,
    blocks,
    fulfills,
    relatesTo
}

public sealed class Edge
{
    public Guid Id { get; set; }
    public Guid FromEntityId { get; set; }
    public Guid ToEntityId { get; set; }
    public EdgeKind Type { get; set; }
    public DateTime CreatedUtc { get; set; }
}
