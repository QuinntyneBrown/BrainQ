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

public sealed class CommitmentsEndpointsTests
{
    [Fact]
    public async Task LogCommitment_FirstLogReturnsStreakOneAndTodayDoneTrue()
    {
        // Traces to: L2-008
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var id = await CreateCommitmentAsync(client, "Read 30 minutes");

        var response = await client.PostAsync($"/api/commitments/{id}/log", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        Assert.Equal(1, doc.RootElement.GetProperty("streak").GetInt32());
        Assert.True(doc.RootElement.GetProperty("todayDone").GetBoolean());
    }

    [Fact]
    public async Task LogCommitment_SecondLogSameDayIsNoOp()
    {
        // Traces to: L2-008 AC2 (upsert)
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var id = await CreateCommitmentAsync(client, "Run or walk");

        await client.PostAsync($"/api/commitments/{id}/log", content: null);
        var second = await client.PostAsync($"/api/commitments/{id}/log", content: null);

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        using var doc = await ReadJsonAsync(second);
        Assert.Equal(1, doc.RootElement.GetProperty("streak").GetInt32());
    }

    [Fact]
    public async Task LogCommitment_NotFoundForNonCommitmentEntity()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var note = await CreateAsync(client, "Note", "not a commitment");

        var response = await client.PostAsync($"/api/commitments/{note}/log", content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetActivity_ReturnsHeatmapWithRequestedWeeks()
    {
        // Traces to: L2-023
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var id = await CreateCommitmentAsync(client, "Walk");
        await client.PostAsync($"/api/commitments/{id}/log", content: null);

        var response = await client.GetAsync($"/api/commitments/{id}/activity?weeks=4");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        var cells = doc.RootElement.GetProperty("cells");
        Assert.Equal(4, cells.GetArrayLength());
        foreach (var week in cells.EnumerateArray())
        {
            Assert.Equal(7, week.GetArrayLength());
        }
        var lastWeek = cells[3];
        var lastDay = lastWeek[6];
        Assert.True(lastDay.GetInt32() >= 1, "today's cell should have a non-zero band");
    }

    [Fact]
    public async Task ListCommitments_HydratesStreakAndTodayDone()
    {
        // Traces to: L2-008
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var id = await CreateCommitmentAsync(client, "Stretch");
        await client.PostAsync($"/api/commitments/{id}/log", content: null);

        var response = await client.GetAsync("/api/commitments");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        var item = Assert.Single(doc.RootElement.EnumerateArray());
        var meta = item.GetProperty("meta");
        Assert.Equal(1, meta.GetProperty("streak").GetInt32());
        Assert.True(meta.GetProperty("todayDone").GetBoolean());
    }

    private static async Task<Guid> CreateCommitmentAsync(HttpClient client, string text) =>
        await CreateAsync(client, "Commitment", text);

    private static async Task<Guid> CreateAsync(HttpClient client, string type, string text)
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
