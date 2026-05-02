using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BrainQ.Api;
using BrainQ.Api.Embeddings;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddJsonConsole(o => o.IncludeScopes = true);

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
    });

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("BrainQ")
        ?? throw new InvalidOperationException("ConnectionStrings:BrainQ is required.");

    options.UseNpgsql(connectionString, npgsql => npgsql.UseVector());
});

builder.Services.Configure<EmbeddingsOptions>(builder.Configuration.GetSection("Embeddings"));
var provider = builder.Configuration["Embeddings:Provider"] ?? "Null";
if (string.Equals(provider, "Ollama", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHttpClient<IEmbeddingClient, OllamaEmbeddingClient>();
}
else
{
    builder.Services.AddSingleton<IEmbeddingClient, NullEmbeddingClient>();
}

builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.OnRejected = (ctx, _) =>
    {
        ctx.HttpContext.Response.Headers["Retry-After"] = "60";
        return ValueTask.CompletedTask;
    };
    o.AddPolicy("writes", _ => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: "global",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
    app.Use(async (ctx, next) =>
    {
        var headers = ctx.Response.Headers;
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Content-Security-Policy"] =
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";
        await next();
    });
}

app.UseRateLimiter();

app.MapControllers();

app.Run();

public partial class Program;
