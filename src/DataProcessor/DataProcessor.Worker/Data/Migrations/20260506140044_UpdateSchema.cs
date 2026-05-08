using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataProcessor.Worker.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_telemetry_records_RoomName_CapturedAt",
                table: "telemetry_records");

            migrationBuilder.DropIndex(
                name: "IX_telemetry_records_Type_CapturedAt",
                table: "telemetry_records");

            migrationBuilder.DropColumn(
                name: "RoomName",
                table: "telemetry_records");

            migrationBuilder.AddColumn<Guid>(
                name: "RoomId",
                table: "telemetry_records",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "rooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rooms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "hourly_aggregates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    HourBucket = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordCount = table.Column<int>(type: "integer", nullable: false),
                    AvgEnergy = table.Column<double>(type: "double precision", nullable: true),
                    TotalEnergy = table.Column<double>(type: "double precision", nullable: true),
                    AvgCo2 = table.Column<double>(type: "double precision", nullable: true),
                    AvgPm25 = table.Column<double>(type: "double precision", nullable: true),
                    AvgHumidity = table.Column<double>(type: "double precision", nullable: true),
                    MotionCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hourly_aggregates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_hourly_aggregates_rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_records_RoomId_Type_CapturedAt",
                table: "telemetry_records",
                columns: new[] { "RoomId", "Type", "CapturedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_hourly_aggregates_RoomId_Type_HourBucket",
                table: "hourly_aggregates",
                columns: new[] { "RoomId", "Type", "HourBucket" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rooms_Name",
                table: "rooms",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_telemetry_records_rooms_RoomId",
                table: "telemetry_records",
                column: "RoomId",
                principalTable: "rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_telemetry_records_rooms_RoomId",
                table: "telemetry_records");

            migrationBuilder.DropTable(
                name: "hourly_aggregates");

            migrationBuilder.DropTable(
                name: "rooms");

            migrationBuilder.DropIndex(
                name: "IX_telemetry_records_RoomId_Type_CapturedAt",
                table: "telemetry_records");

            migrationBuilder.DropColumn(
                name: "RoomId",
                table: "telemetry_records");

            migrationBuilder.AddColumn<string>(
                name: "RoomName",
                table: "telemetry_records",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_records_RoomName_CapturedAt",
                table: "telemetry_records",
                columns: new[] { "RoomName", "CapturedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_records_Type_CapturedAt",
                table: "telemetry_records",
                columns: new[] { "Type", "CapturedAt" });
        }
    }
}
