using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace BrainQ.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEdgesAndCommitmentActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Vector>(
                name: "Embedding",
                table: "Entity",
                type: "vector(768)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(1536)",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "CommitmentActivity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommitmentEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    DateUtc = table.Column<DateOnly>(type: "date", nullable: false),
                    Value = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommitmentActivity", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Edge",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Edge", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommitmentActivity_CommitmentEntityId_DateUtc",
                table: "CommitmentActivity",
                columns: new[] { "CommitmentEntityId", "DateUtc" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Edge_FromEntityId",
                table: "Edge",
                column: "FromEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Edge_FromEntityId_ToEntityId_Type",
                table: "Edge",
                columns: new[] { "FromEntityId", "ToEntityId", "Type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Edge_ToEntityId",
                table: "Edge",
                column: "ToEntityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommitmentActivity");

            migrationBuilder.DropTable(
                name: "Edge");

            migrationBuilder.AlterColumn<Vector>(
                name: "Embedding",
                table: "Entity",
                type: "vector(1536)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(768)",
                oldNullable: true);
        }
    }
}
