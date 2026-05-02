using System.Text.Json;

namespace BrainQ.Api.Contracts;

public sealed record EntityDto(
    Guid Id,
    string Type,
    string Title,
    string Subtitle,
    string Body,
    IReadOnlyList<string> Tags,
    JsonElement Meta,
    IReadOnlyList<EntityEdgeDto> Edges,
    DateTime CreatedUtc,
    DateTime UpdatedUtc)
{
    public static EntityDto From(Entity entity) =>
        new(
            entity.Id,
            entity.Type.ToString(),
            entity.Title,
            entity.Subtitle,
            entity.Body,
            entity.Tags,
            entity.Attributes.RootElement.Clone(),
            Array.Empty<EntityEdgeDto>(),
            DateTime.SpecifyKind(entity.CreatedUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(entity.UpdatedUtc, DateTimeKind.Utc));

    public EntityDto WithCommitmentMeta(int streak, bool todayDone)
    {
        var bag = new Dictionary<string, JsonElement>();
        foreach (var p in Meta.EnumerateObject()) bag[p.Name] = p.Value.Clone();
        bag["streak"] = JsonSerializer.SerializeToElement(streak);
        bag["todayDone"] = JsonSerializer.SerializeToElement(todayDone);
        var enriched = JsonSerializer.SerializeToElement(bag);
        return this with { Meta = enriched };
    }
}

public sealed record EntityEdgeDto(string Kind, Guid To);
