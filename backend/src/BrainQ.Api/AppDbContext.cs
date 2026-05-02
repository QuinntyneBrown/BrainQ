using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BrainQ.Api;

public sealed class AppDbContext : DbContext
{
    private readonly int embeddingDimensions;

    public AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration)
        : base(options)
    {
        embeddingDimensions = configuration.GetValue("BrainQ:EmbeddingDimensions", 1536);
    }

    public DbSet<Entity> Entities => Set<Entity>();
    public DbSet<Edge> Edges => Set<Edge>();
    public DbSet<CommitmentActivity> CommitmentActivities => Set<CommitmentActivity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var isInMemory = Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";
        var jsonDocumentConverter = new ValueConverter<System.Text.Json.JsonDocument, string>(
            document => document.RootElement.GetRawText(),
            json => System.Text.Json.JsonDocument.Parse(json));

        modelBuilder.HasPostgresExtension("vector");

        var entity = modelBuilder.Entity<Entity>();
        entity.ToTable("Entity");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
        entity.Property(e => e.Subtitle).HasMaxLength(200).IsRequired();
        entity.Property(e => e.Body).IsRequired();
        entity.Property(e => e.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");
        var attributes = entity.Property(e => e.Attributes).IsRequired();
        if (isInMemory)
        {
            attributes.HasConversion(jsonDocumentConverter);
            entity.Ignore(e => e.Embedding);
        }
        else
        {
            attributes.HasColumnType("jsonb");
            entity.Property(e => e.Embedding).HasColumnType($"vector({embeddingDimensions})");
        }
        entity.Property(e => e.CreatedUtc).IsRequired();
        entity.Property(e => e.UpdatedUtc).IsRequired();
        entity.HasIndex(e => e.UpdatedUtc);

        var edge = modelBuilder.Entity<Edge>();
        edge.ToTable("Edge");
        edge.HasKey(x => x.Id);
        edge.Property(x => x.Type).HasConversion<string>().HasMaxLength(32).IsRequired();
        edge.Property(x => x.CreatedUtc).IsRequired();
        edge.HasIndex(x => new { x.FromEntityId, x.ToEntityId, x.Type }).IsUnique();
        edge.HasIndex(x => x.FromEntityId);
        edge.HasIndex(x => x.ToEntityId);

        var activity = modelBuilder.Entity<CommitmentActivity>();
        activity.ToTable("CommitmentActivity");
        activity.HasKey(x => x.Id);
        activity.Property(x => x.Value).IsRequired();
        activity.HasIndex(x => new { x.CommitmentEntityId, x.DateUtc }).IsUnique();
    }
}
