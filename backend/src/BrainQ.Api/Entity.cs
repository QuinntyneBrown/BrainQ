using System.Text.Json;
using Pgvector;

namespace BrainQ.Api;

public enum EntityType
{
    Person,
    Project,
    Commitment,
    Note,
    Idea
}

public sealed class Entity
{
    public Guid Id { get; set; }
    public EntityType Type { get; set; }
    public string Title { get; set; } = "";
    public string Subtitle { get; set; } = "";
    public string Body { get; set; } = "";
    public string[] Tags { get; set; } = [];
    public JsonDocument Attributes { get; set; } = JsonDocument.Parse("{}");
    public Vector? Embedding { get; set; }
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }
}
