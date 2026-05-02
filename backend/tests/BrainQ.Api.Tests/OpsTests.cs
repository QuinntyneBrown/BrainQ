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

public sealed class OpsTests
{
    [Fact]
    public async Task GetHealth_ReturnsOkWhenDbReachable()
    {
        // Traces to: L2-019
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = await ReadJsonAsync(response);
        Assert.Equal("ok", doc.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task ProductionResponse_HasHstsCspNoSniffHeaders()
    {
        // Traces to: L2-016
        using var factory = new ApiFactory(environment: "Production");
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.True(response.Headers.Contains("Strict-Transport-Security"),
            "HSTS header must be present in Production");
        var nosniff = response.Content.Headers.TryGetValues("X-Content-Type-Options", out var nosniffValues)
            ? nosniffValues.FirstOrDefault()
            : response.Headers.TryGetValues("X-Content-Type-Options", out var hv) ? hv.FirstOrDefault() : null;
        Assert.Equal("nosniff", nosniff);
        var csp = response.Headers.TryGetValues("Content-Security-Policy", out var cspValues)
            ? cspValues.FirstOrDefault()
            : null;
        Assert.False(string.IsNullOrEmpty(csp), "CSP header must be present in Production");
    }

    [Fact]
    public async Task DevelopmentResponse_DoesNotSetHstsCsp()
    {
        // Traces to: L2-016
        using var factory = new ApiFactory(environment: "Development");
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.False(response.Headers.Contains("Strict-Transport-Security"));
        Assert.False(response.Headers.Contains("Content-Security-Policy"));
    }

    [Fact]
    public async Task SixtyFirstWriteInAMinute_Returns429WithRetryAfter()
    {
        // Traces to: L2-017
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var saw429 = false;
        for (var i = 0; i < 65; i++)
        {
            var response = await client.PostAsJsonAsync("/api/entities",
                new { type = "Note", text = $"entry {i}" });
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                saw429 = true;
                Assert.True(response.Headers.Contains("Retry-After"),
                    "429 response must include Retry-After");
                break;
            }
        }
        Assert.True(saw429, "Expected at least one 429 within the first 65 writes");
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response) =>
        await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
}

file sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string databaseName = $"brainq_{Guid.NewGuid():N}";
    private readonly string environment;

    public ApiFactory(string environment = "Testing")
    {
        this.environment = environment;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(environment);
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(databaseName));
        });
    }
}
