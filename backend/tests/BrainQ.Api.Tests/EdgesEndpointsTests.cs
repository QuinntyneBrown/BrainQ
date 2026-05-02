using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BrainQ.Api;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BrainQ.Api.Tests;

public sealed class EdgesEndpointsTests
{
    [Fact]
    public async Task CreateEdge_PersistsAndReturnsCreated()
    {
        // Traces to: L2-004
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (fromId, toId) = await SeedTwoEntitiesAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/edges",
            new { fromEntityId = fromId, toEntityId = toId, type = "mentions" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var created = await ReadJsonAsync(response);
        var root = created.RootElement;
        Assert.Equal(fromId, root.GetProperty("fromEntityId").GetGuid());
        Assert.Equal(toId, root.GetProperty("toEntityId").GetGuid());
        Assert.Equal("mentions", root.GetProperty("type").GetString());
    }

    [Fact]
    public async Task CreateEdge_DuplicateReturnsConflict()
    {
        // Traces to: L2-004
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (fromId, toId) = await SeedTwoEntitiesAsync(client);
        var payload = new { fromEntityId = fromId, toEntityId = toId, type = "mentions" };

        var first = await client.PostAsJsonAsync("/api/edges", payload);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/edges", payload);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task CreateEdge_RejectsUnknownType()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (fromId, toId) = await SeedTwoEntitiesAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/edges",
            new { fromEntityId = fromId, toEntityId = toId, type = "nope" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateEdge_RejectsMissingEntity()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (fromId, _) = await SeedTwoEntitiesAsync(client);

        var response = await client.PostAsJsonAsync(
            "/api/edges",
            new { fromEntityId = fromId, toEntityId = Guid.NewGuid(), type = "mentions" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ListEdges_FiltersByFromAndType()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (a, b) = await SeedTwoEntitiesAsync(client);
        await client.PostAsJsonAsync("/api/edges", new { fromEntityId = a, toEntityId = b, type = "mentions" });
        await client.PostAsJsonAsync("/api/edges", new { fromEntityId = a, toEntityId = b, type = "blocks" });

        var response = await client.GetAsync($"/api/edges?fromId={a}&type=mentions");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        var single = Assert.Single(doc.RootElement.EnumerateArray());
        Assert.Equal("mentions", single.GetProperty("type").GetString());
    }

    [Fact]
    public async Task DeleteEdge_RemovesEdge()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (a, b) = await SeedTwoEntitiesAsync(client);
        var created = await client.PostAsJsonAsync("/api/edges", new { fromEntityId = a, toEntityId = b, type = "mentions" });
        using var doc = await ReadJsonAsync(created);
        var edgeId = doc.RootElement.GetProperty("id").GetGuid();

        var response = await client.DeleteAsync($"/api/edges/{edgeId}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listed = await client.GetAsync($"/api/edges?fromId={a}");
        using var listedDoc = await ReadJsonAsync(listed);
        Assert.Empty(listedDoc.RootElement.EnumerateArray());
    }

    [Fact]
    public async Task DeleteEntity_AlsoRemovesItsEdges()
    {
        // Traces to: L2-002, L2-003
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var (a, b) = await SeedTwoEntitiesAsync(client);
        await client.PostAsJsonAsync("/api/edges", new { fromEntityId = a, toEntityId = b, type = "mentions" });

        var del = await client.DeleteAsync($"/api/entities/{a}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var listed = await client.GetAsync("/api/edges");
        using var listedDoc = await ReadJsonAsync(listed);
        Assert.Empty(listedDoc.RootElement.EnumerateArray());
    }

    [Fact]
    public async Task DeleteEntity_NotFoundReturns404()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.DeleteAsync($"/api/entities/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<(Guid, Guid)> SeedTwoEntitiesAsync(HttpClient client)
    {
        var a = await CreateEntityAsync(client, "Person", "Iris Okafor");
        var b = await CreateEntityAsync(client, "Note", "seams note");
        return (a, b);
    }

    private static async Task<Guid> CreateEntityAsync(HttpClient client, string type, string text)
    {
        var response = await client.PostAsJsonAsync("/api/entities", new { type, text });
        response.EnsureSuccessStatusCode();
        using var doc = await ReadJsonAsync(response);
        return doc.RootElement.GetProperty("id").GetGuid();
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response) =>
        await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
}

file sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string databaseName = $"brainq_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(databaseName));
        });
    }
}
