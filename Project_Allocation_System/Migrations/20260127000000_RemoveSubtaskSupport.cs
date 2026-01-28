using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Project_Allocation_System.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSubtaskSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the foreign key constraint
            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_WorkTasks_ParentTaskId",
                table: "WorkTasks");

            // Drop the index
            migrationBuilder.DropIndex(
                name: "IX_WorkTasks_ParentTaskId",
                table: "WorkTasks");

            // Drop the column
            migrationBuilder.DropColumn(
                name: "ParentTaskId",
                table: "WorkTasks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-add the column
            migrationBuilder.AddColumn<Guid>(
                name: "ParentTaskId",
                table: "WorkTasks",
                type: "uniqueidentifier",
                nullable: true);

            // Re-create the index
            migrationBuilder.CreateIndex(
                name: "IX_WorkTasks_ParentTaskId",
                table: "WorkTasks",
                column: "ParentTaskId");

            // Re-create the foreign key constraint
            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_WorkTasks_ParentTaskId",
                table: "WorkTasks",
                column: "ParentTaskId",
                principalTable: "WorkTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
