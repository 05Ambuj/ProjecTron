using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using System;
using System.Threading.Tasks;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling task related operations
    // Tasks are the actual work items assigned to team members
    // Has all CRUD operations plus status updates, time logging, comments etc
    [ApiController]
    [Route("api/tasks")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        // Constructor - injecting task service
        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        // This function creates a new task in a sprint
        // Team Lead and Project Manager can create tasks
        // Auto generates task code like PROJ-001 based on project code
        [HttpPost]
        [Authorize(Roles = "ProjectManager,TeamLead")]
        public async Task<IActionResult> CreateTask([FromBody] TaskCreateRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.CreateTaskAsync(userId, request);
            return StatusCode(response.StatusCode, response);
        }

        // This function fetches single task details by id
        // Returns full task info with comments, time logs, dependencies etc
        [HttpGet("{taskId}")]
        public async Task<IActionResult> GetTask(Guid taskId)
        {
            var response = await _taskService.GetTaskByIdAsync(taskId);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets all tasks with pagination and filtering
        // PM can see tasks from their managed projects
        // TL/TM can see tasks from allocated projects only
        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] TaskFilterRequest filter)
        {
            var userId = User.GetUserId();
            var userRole = User.GetUserRole();
            var organizationId = User.GetOrganizationId();

            List<Guid>? allowedProjectIds = null;

            if (userRole == UserRole.ProjectManager)
            {
                allowedProjectIds =
                    await _taskService.GetProjectIdsForProjectManagerAsync(userId);
            }

            var response = await _taskService.GetTasksAsync(
                filter,
                userId,
                userRole,
                organizationId,
                allowedProjectIds
            );

            return StatusCode(response.StatusCode, response);
        }

        // This function gets all tasks assigned to current logged in user
        // Useful for team members to see their work
        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userId = User.GetUserId();
            var response = await _taskService.GetMyTasksAsync(userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function updates an existing task
        // Can update title, description, priority, story points, dates etc
        // Creator, assignee, TL, PM or Admin can update tasks
        [HttpPut("{taskId}")]
        public async Task<IActionResult> UpdateTask(Guid taskId, [FromBody] TaskUpdateRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.UpdateTaskAsync(taskId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function deletes (cancels) a task
        // Soft delete - sets status to Cancelled
        // PM, TL can delete any task; TM can only delete tasks they created
        [HttpDelete("{taskId}")]
        [Authorize(Roles = "ProjectManager,TeamLead,TeamMember")]
        public async Task<IActionResult> DeleteTask(Guid taskId)
        {
            var userId = User.GetUserId();
            var response = await _taskService.DeleteTaskAsync(taskId, userId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("{taskId}/assign")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> AssignTask(Guid taskId, [FromBody] TaskAssignmentRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.AssignTaskAsync(taskId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function updates task status
        // Validates status transitions (e.g. cannot go from NotStarted to Done directly)
        // Also checks task dependencies before allowing status change
        [HttpPut("{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(Guid taskId, [FromBody] TaskStatusUpdateRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.UpdateTaskStatusAsync(taskId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function logs time spent on a task
        // Only assigned user can log time on their task
        // Updates task's actual hours field automatically
        [HttpPost("{taskId}/time-log")]
        public async Task<IActionResult> LogTime(Guid taskId, [FromBody] TaskTimeLogRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.LogTimeAsync(taskId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function adds a comment to a task
        // Can be general comment, blocker, code review etc
        // Can also tag other users in the comment
        [HttpPost("{taskId}/comments")]
        public async Task<IActionResult> AddComment(Guid taskId, [FromBody] TaskCommentRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.AddCommentAsync(taskId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets all comments for a task
        // Returns comments ordered by created date descending (newest first)
        [HttpGet("{taskId}/comments")]
        public async Task<IActionResult> GetTaskComments(Guid taskId)
        {
            var response = await _taskService.GetTaskCommentsAsync(taskId);
            return StatusCode(response.StatusCode, response);
        }

        // This function updates an existing comment
        // Only comment author, Admin, PM, or TL can edit
        [HttpPut("comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(Guid commentId, [FromBody] TaskCommentRequest request)
        {
            var userId = User.GetUserId();
            var response = await _taskService.UpdateCommentAsync(commentId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function deletes a comment
        // Only comment author, Admin, PM, or TL can delete
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid commentId)
        {
            var userId = User.GetUserId();
            var response = await _taskService.DeleteCommentAsync(commentId, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets all overdue tasks
        // Overdue means due date has passed and task is not done
        // Can filter by project id
        [HttpGet("overdue")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> GetOverdueTasks([FromQuery] Guid? projectId)
        {
            var response = await _taskService.GetOverdueTasksAsync(projectId, null);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets tasks that are not started but due soon
        // Useful for finding tasks that need attention
        // Default shows tasks due within 2 days
        [HttpGet("not-started")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> GetNotStartedTasks(
            [FromQuery] Guid? projectId,
            [FromQuery] int daysUntilDue = 2)
        {
            var response = await _taskService.GetNotStartedTasksAsync(projectId, daysUntilDue);
            return StatusCode(response.StatusCode, response);
        }

        // This function returns task board data for kanban view
        // Groups tasks by status columns (Not Started, In Progress, Blocked, Done)
        // Can filter by assigned user
        [HttpGet("board/{projectId}")]
        public async Task<IActionResult> GetTaskBoard(Guid projectId, [FromQuery] Guid? assignedToUserId)
        {
            var userId = User.GetUserId();
            var role = User.GetUserRole();

            var response = await _taskService.GetTaskBoardAsync(projectId, userId, role, assignedToUserId);
            return StatusCode(response.StatusCode, response);
        }

    }
}