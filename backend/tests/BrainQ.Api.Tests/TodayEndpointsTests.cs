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

public sealed class TodayEndpointsTests
{
    [Fact]
    public async Task Today_ReturnsGreetingPromptAndEmptyAgenda()
    {
        // Traces to: L2-022, L1-013
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/today");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        var root = doc.RootElement;
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("date").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("greeting").GetString()));
        Assert.Equal("What's on your mind?", root.GetProperty("prompt").GetString());
        Assert.Empty(root.GetProperty("recent").EnumerateArray());
        Assert.Empty(root.GetProperty("nudges").EnumerateArray());
    }

    [Fact]
    public async Task Today_RecentLists3MostRecentlyUpdatedEntities()
    {
        // Traces to: L2-022 AC1
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        await CreateAsync(client, "Note", "first");
        await CreateAsync(client, "Note", "second");
        await CreateAsync(client, "Note", "third");
        var fourth = await CreateAsync(client, "Note", "fourth");

        var response = await client.GetAsync("/api/today");
        using var doc = await ReadJsonAsync(response);
        var recent = doc.RootElement.GetProperty("recent").EnumerateArray()
            .Select(x => x.GetString())
            .ToArray();
        Assert.Equal(3, recent.Length);
        Assert.Equal(fourth.ToString(), recent[0]);
    }

    [Fact]
    public async Task Today_NudgesOverduePeople()
    {
        // Traces to: L2-022 AC2
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var nadia = await CreateAsync(client, "Person", "Nadia Cole");
        await TagAsync(factory, nadia, "overdue");
        await CreateAsync(client, "Person", "Casual Friend");

        var response = await client.GetAsync("/api/today");
        using var doc = await ReadJsonAsync(response);
        var nudges = doc.RootElement.GetProperty("nudges").EnumerateArray().ToArray();
        var nudge = Assert.Single(nudges);
        Assert.Equal(nadia.ToString(), nudge.GetProperty("entityId").GetString());
        Assert.Equal("soft", nudge.GetProperty("kind").GetString());
        Assert.Contains("Nadia Cole", nudge.GetProperty("text").GetString());
    }

    private static async Task<Guid> CreateAsync(HttpClient client, string type, string text)
    {
        var response = await client.PostAsJsonAsync("/api/entities", new { type, text });
        response.EnsureSuccessStatusCode();
        using var doc = await ReadJsonAsync(response);
        return doc.RootElement.GetProperty("id").GetGuid();
    }

    private static async Task TagAsync(WebApplicationFactory<Program> factory, Guid id, params string[] tags)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = await db.Entities.FindAsync(id) ?? throw new InvalidOperationException("seed missing");
        entity.Tags = tags;
        await db.SaveChangesAsync();
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
