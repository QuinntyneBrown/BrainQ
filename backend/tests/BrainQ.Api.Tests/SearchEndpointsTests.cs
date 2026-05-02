using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BrainQ.Api;
using BrainQ.Api.Embeddings;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BrainQ.Api.Tests;

public sealed class SearchEndpointsTests
{
    [Fact]
    public async Task Search_RequiresQ()
    {
        // Traces to: L2-007
        using var factory = new ApiFactory(new NullEmbeddingClient());
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_ReturnsEmptyWhenEmbeddingProviderDown()
    {
        // Traces to: L2-006 AC4 (graceful degradation)
        using var factory = new ApiFactory(new NullEmbeddingClient());
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=anything");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        Assert.Empty(doc.RootElement.EnumerateArray());
    }

    [Fact]
    public async Task CreateEntity_StillSucceedsWhenEmbeddingProviderDown()
    {
        // Traces to: L2-006 AC4
        using var factory = new ApiFactory(new NullEmbeddingClient());
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/entities",
            new { type = "Note", text = "an idea worth keeping" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateEntity_CallsEmbeddingClientWithTitleAndBody()
    {
        // Traces to: L2-006
        var spy = new SpyEmbeddingClient();
        using var factory = new ApiFactory(spy);
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/entities",
            new { type = "Idea", text = "graphs are great" });

        Assert.Single(spy.Calls);
        Assert.Contains("graphs are great", spy.Calls[0]);
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response) =>
        await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
}

internal sealed class SpyEmbeddingClient : IEmbeddingClient
{
    public List<string> Calls { get; } = [];

    public Task<float[]?> EmbedAsync(string text, CancellationToken ct)
    {
        Calls.Add(text);
        return Task.FromResult<float[]?>(null);
    }
}

file sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string databaseName = $"brainq_{Guid.NewGuid():N}";
    private readonly IEmbeddingClient embedder;

    public ApiFactory(IEmbeddingClient embedder)
    {
        this.embedder = embedder;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(databaseName));
            services.RemoveAll<IEmbeddingClient>();
            services.AddSingleton<IEmbeddingClient>(embedder);
        });
    }
}
