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

public sealed class EntitiesEndpointsTests
{
    [Fact]
    public async Task CreateEntity_PersistsAndReturnsCreatedDto()
    {
        // Traces to: L2-001, L2-003, L2-015
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Note", text = "reminder to water the basil" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var created = await ReadJsonAsync(response);
        var root = created.RootElement;
        Assert.Equal("Note", root.GetProperty("type").GetString());
        Assert.Equal("reminder to water the basil", root.GetProperty("title").GetString());
        Assert.Equal("Just captured", root.GetProperty("subtitle").GetString());
        Assert.Empty(root.GetProperty("tags").EnumerateArray());
        Assert.Empty(root.GetProperty("edges").EnumerateArray());

        var list = await client.GetAsync("/api/entities");

        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        using var listed = await ReadJsonAsync(list);
        var item = Assert.Single(listed.RootElement.EnumerateArray());
        Assert.Equal(root.GetProperty("id").GetString(), item.GetProperty("id").GetString());
    }

    [Fact]
    public async Task CreateEntity_RejectsWhitespaceText()
    {
        // Traces to: L2-015
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Note", text = "   " });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = await ReadJsonAsync(response);
        Assert.Equal("text required", body.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task CreateEntity_RejectsUnknownType()
    {
        // Traces to: L2-015
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Foo", text = "valid body" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = await ReadJsonAsync(response);
        Assert.Equal("unknown type 'Foo'", body.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task CreateEntity_RejectsNumericEnumValues()
    {
        // Traces to: L2-015
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "999", text = "valid body" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = await ReadJsonAsync(response);
        Assert.Equal("unknown type '999'", body.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task CreateEntity_RejectsUnknownJsonProperties()
    {
        // Traces to: L2-015
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Note", text = "valid body", extra = true });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateEntity_PersistsTagsWhenProvided()
    {
        // Bug 0020: tags ride along on capture so e2e fixtures can stand up
        // RecallQ overdue / nudge state.
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Person", text = "Nadia Cole", tags = new[] { "overdue", "close" } });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var created = await ReadJsonAsync(response);
        var tags = created.RootElement.GetProperty("tags").EnumerateArray()
            .Select(t => t.GetString()).ToArray();
        Assert.Equal(new[] { "overdue", "close" }, tags);
    }

    [Fact]
    public async Task CreateEntity_RejectsTagOver64Chars()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Note", text = "n", tags = new[] { new string('a', 65) } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = await ReadJsonAsync(response);
        Assert.Equal("tag >64", body.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task CreateEntity_RejectsMoreThanTwentyTags()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var tooMany = Enumerable.Range(1, 21).Select(i => $"t{i}").ToArray();

        var response = await client.PostAsJsonAsync(
            "/api/entities",
            new { type = "Note", text = "n", tags = tooMany });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = await ReadJsonAsync(response);
        Assert.Equal(">20 tags", body.RootElement.GetProperty("error").GetString());
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
