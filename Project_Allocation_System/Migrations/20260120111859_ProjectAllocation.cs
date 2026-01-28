using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Project_Allocation_System.Migrations
{
    /// <inheritdoc />
    public partial class ProjectAllocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_Users_UserId",
                table: "TaskComments");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Projects_ProjectId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Users_AssignedByUserId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Users_AssignedToUserId",
                table: "WorkTasks");

            migrationBuilder.RenameColumn(
                name: "StartedDate",
                table: "WorkTasks",
                newName: "StartDate");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DueDate",
                table: "WorkTasks",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedByUserId",
                table: "WorkTasks",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AcceptanceCriteria",
                table: "WorkTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ActualHours",
                table: "WorkTasks",
                type: "decimal(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualStartDate",
                table: "WorkTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Attachments",
                table: "WorkTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BlockedReason",
                table: "WorkTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Complexity",
                table: "WorkTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "WorkTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EffortCategory",
                table: "WorkTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedHours",
                table: "WorkTasks",
                type: "decimal(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentTaskId",
                table: "WorkTasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewerId",
                table: "WorkTasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RiskLevel",
                table: "WorkTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SkillsRequired",
                table: "WorkTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SprintId",
                table: "WorkTasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StoryPoints",
                table: "WorkTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TaskCode",
                table: "WorkTasks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TaskType",
                table: "WorkTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Attachments",
                table: "TaskComments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CodeSnippet",
                table: "TaskComments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CommentType",
                table: "TaskComments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsBlocking",
                table: "TaskComments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsResolved",
                table: "TaskComments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TaggedUserId",
                table: "TaskComments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "TaskComments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Sprints",
                columns: table => new
                {
                    SprintId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Goals = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalStoryPoints = table.Column<int>(type: "int", nullable: false),
                    CompletedStoryPoints = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ActualStartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActualEndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sprints", x => x.SprintId);
                    table.ForeignKey(
                        name: "FK_Sprints_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "ProjectId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TaskDependencies",
                columns: table => new
                {
                    TaskDependencyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DependsOnTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DependencyType = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskDependencies", x => x.TaskDependencyId);
                    table.ForeignKey(
                        name: "FK_TaskDependencies_WorkTasks_DependsOnTaskId",
                        column: x => x.DependsOnTaskId,
                        principalTable: "WorkTasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskDependencies_WorkTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "WorkTasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskTimeLogs",
                columns: table => new
                {
                    TimeLogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HoursLogged = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    LogDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTimeLogs", x => x.TimeLogId);
                    table.ForeignKey(
                        name: "FK_TaskTimeLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskTimeLogs_WorkTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "WorkTasks",
                        principalColumn: "TaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SprintMembers",
                columns: table => new
                {
                    SprintMemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SprintId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AvailableHoursPerWeek = table.Column<int>(type: "int", nullable: false),
                    AllocatedStoryPoints = table.Column<int>(type: "int", nullable: false),
                    CompletedStoryPoints = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SprintMembers", x => x.SprintMemberId);
                    table.ForeignKey(
                        name: "FK_SprintMembers_Sprints_SprintId",
                        column: x => x.SprintId,
                        principalTable: "Sprints",
                        principalColumn: "SprintId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SprintMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkTasks_ParentTaskId",
                table: "WorkTasks",
                column: "ParentTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkTasks_ReviewerId",
                table: "WorkTasks",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkTasks_SprintId",
                table: "WorkTasks",
                column: "SprintId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkTasks_Status",
                table: "WorkTasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_WorkTasks_TaskCode",
                table: "WorkTasks",
                column: "TaskCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_TaggedUserId",
                table: "TaskComments",
                column: "TaggedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SprintMembers_SprintId_UserId",
                table: "SprintMembers",
                columns: new[] { "SprintId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SprintMembers_UserId",
                table: "SprintMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Sprints_ProjectId",
                table: "Sprints",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_DependsOnTaskId",
                table: "TaskDependencies",
                column: "DependsOnTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_TaskId_DependsOnTaskId",
                table: "TaskDependencies",
                columns: new[] { "TaskId", "DependsOnTaskId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskTimeLogs_TaskId",
                table: "TaskTimeLogs",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTimeLogs_UserId",
                table: "TaskTimeLogs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_Users_TaggedUserId",
                table: "TaskComments",
                column: "TaggedUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_Users_UserId",
                table: "TaskComments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Projects_ProjectId",
                table: "WorkTasks",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "ProjectId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Sprints_SprintId",
                table: "WorkTasks",
                column: "SprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Users_AssignedByUserId",
                table: "WorkTasks",
                column: "AssignedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Users_AssignedToUserId",
                table: "WorkTasks",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Users_ReviewerId",
                table: "WorkTasks",
                column: "ReviewerId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_WorkTasks_ParentTaskId",
                table: "WorkTasks",
                column: "ParentTaskId",
                principalTable: "WorkTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_Users_TaggedUserId",
                table: "TaskComments");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_Users_UserId",
                table: "TaskComments");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Projects_ProjectId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Sprints_SprintId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Users_AssignedByUserId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Users_AssignedToUserId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_Users_ReviewerId",
                table: "WorkTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_WorkTasks_ParentTaskId",
                table: "WorkTasks");

            migrationBuilder.DropTable(
                name: "SprintMembers");

            migrationBuilder.DropTable(
                name: "TaskDependencies");

            migrationBuilder.DropTable(
                name: "TaskTimeLogs");

            migrationBuilder.DropTable(
                name: "Sprints");

            migrationBuilder.DropIndex(
                name: "IX_WorkTasks_ParentTaskId",
                table: "WorkTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkTasks_ReviewerId",
                table: "WorkTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkTasks_SprintId",
                table: "WorkTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkTasks_Status",
                table: "WorkTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkTasks_TaskCode",
                table: "WorkTasks");

            migrationBuilder.DropIndex(
                name: "IX_TaskComments_TaggedUserId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "AcceptanceCriteria",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "ActualHours",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "ActualStartDate",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "Attachments",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "BlockedReason",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "Complexity",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "EffortCategory",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "EstimatedHours",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "ParentTaskId",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "ReviewerId",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "RiskLevel",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "SkillsRequired",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "SprintId",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "StoryPoints",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "TaskCode",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "TaskType",
                table: "WorkTasks");

            migrationBuilder.DropColumn(
                name: "Attachments",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "CodeSnippet",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "CommentType",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "IsBlocking",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "IsResolved",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "TaggedUserId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "TaskComments");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "WorkTasks",
                newName: "StartedDate");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DueDate",
                table: "WorkTasks",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedByUserId",
                table: "WorkTasks",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_Users_UserId",
                table: "TaskComments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Projects_ProjectId",
                table: "WorkTasks",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "ProjectId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Users_AssignedByUserId",
                table: "WorkTasks",
                column: "AssignedByUserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_Users_AssignedToUserId",
                table: "WorkTasks",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
