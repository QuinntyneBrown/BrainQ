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

public sealed class EntitiesListHydratesCommitmentMetaTests
{
    [Fact]
    public async Task GetEntities_HydratesCommitmentStreakAndTodayDone()
    {
        // Bug 0004: GET /api/entities returned Commitments with empty meta,
        // so the Today screen reset the streak to 0 on every reload.
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var noteCreate = await client.PostAsJsonAsync("/api/entities",
            new { type = "Note", text = "non-commitment row" });
        noteCreate.EnsureSuccessStatusCode();

        var commitmentCreate = await client.PostAsJsonAsync("/api/entities",
            new { type = "Commitment", text = "Stretch daily" });
        commitmentCreate.EnsureSuccessStatusCode();
        using var commitmentCreated = await ReadJsonAsync(commitmentCreate);
        var commitmentId = commitmentCreated.RootElement.GetProperty("id").GetGuid();

        var log = await client.PostAsync($"/api/commitments/{commitmentId}/log", content: null);
        log.EnsureSuccessStatusCode();

        var list = await client.GetAsync("/api/entities");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        using var listed = await ReadJsonAsync(list);

        var commitment = listed.RootElement
            .EnumerateArray()
            .Single(e => e.GetProperty("id").GetGuid() == commitmentId);
        var meta = commitment.GetProperty("meta");

        Assert.Equal(1, meta.GetProperty("streak").GetInt32());
        Assert.True(meta.GetProperty("todayDone").GetBoolean());
    }

    [Fact]
    public async Task GetEntities_LeavesNonCommitmentMetaUnchanged()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        await client.PostAsJsonAsync("/api/entities", new { type = "Note", text = "plain note" });

        var list = await client.GetAsync("/api/entities");
        using var listed = await ReadJsonAsync(list);
        var note = Assert.Single(listed.RootElement.EnumerateArray());
        var meta = note.GetProperty("meta");

        Assert.False(meta.TryGetProperty("streak", out _));
        Assert.False(meta.TryGetProperty("todayDone", out _));
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
