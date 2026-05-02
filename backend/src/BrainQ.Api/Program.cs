using System.Text.Json.Serialization;
using BrainQ.Api;
using BrainQ.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
});

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("BrainQ")
        ?? throw new InvalidOperationException("ConnectionStrings:BrainQ is required.");

    options.UseNpgsql(connectionString, npgsql => npgsql.UseVector());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapEntitiesEndpoints();

app.Run();

public partial class Program;
