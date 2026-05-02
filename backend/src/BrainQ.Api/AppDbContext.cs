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
    }
}
