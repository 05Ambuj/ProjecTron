using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using System;
using System.Threading.Tasks;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling sprint operations
    // Sprints are time-boxed iterations where team works on tasks
    // Usually 2-4 weeks long in agile methodology
    [ApiController]
    [Route("api/sprints")]
    [Authorize]
    public class SprintsController : ControllerBase
    {
        private readonly ISprintService _sprintService;
        private readonly IProjectAllocationRepository _projectAllocationRepository;

        // Constructor - injecting sprint service and allocation repo
        public SprintsController(ISprintService sprintService, IProjectAllocationRepository projectAllocationRepository)
        {
            _sprintService = sprintService;
            _projectAllocationRepository = projectAllocationRepository;
        }

        // This function creates a new sprint for a project
        // Only Admin and PM can create sprints
        // Auto assigns all allocated TL/TM as sprint members
        [HttpPost]
        [Authorize(Roles = "Admin,ProjectManager")]
        public async Task<IActionResult> CreateSprint([FromBody] SprintCreateRequest request)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.CreateSprintAsync(userId, request);
            return StatusCode(response.StatusCode, response);
        }

        // This function fetches single sprint details by id
        // TL/TM can only view sprints of their allocated projects
        [HttpGet("{sprintId}")]
        public async Task<IActionResult> GetSprint(Guid sprintId)
        {
            // TL/TM can only access sprints of projects they are allocated to
            if (User.IsInRole("TeamLead") || User.IsInRole("TeamMember"))
            {
                var userId = User.GetUserId();
                var isAllocatedToSprint = await _sprintService.IsUserAllocatedToSprintProjectAsync(sprintId, userId);
                if (!isAllocatedToSprint)
                {
                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "You are not allocated to this project",
                        StatusCode = 403
                    });
                }
            }

            var response = await _sprintService.GetSprintByIdAsync(sprintId);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets all sprints for a specific project
        // Returns list of sprints ordered by start date descending
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetSprintsByProject(Guid projectId)
        {
            // TL/TM can only access sprints of projects they are allocated to
            if (User.IsInRole("TeamLead") || User.IsInRole("TeamMember"))
            {
                var userId = User.GetUserId();
                var isAllocated = await _projectAllocationRepository.ExistsAsync(projectId, userId);
                if (!isAllocated)
                {
                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "You are not allocated to this project",
                        StatusCode = 403
                    });
                }
            }

            var response = await _sprintService.GetSprintsByProjectIdAsync(projectId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("project/{projectId}/active")]
        public async Task<IActionResult> GetActiveSprint(Guid projectId)
        {
            // TL/TM can only access sprints of projects they are allocated to
            if (User.IsInRole("TeamLead") || User.IsInRole("TeamMember"))
            {
                var userId = User.GetUserId();
                var isAllocated = await _projectAllocationRepository.ExistsAsync(projectId, userId);
                if (!isAllocated)
                {
                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "You are not allocated to this project",
                        StatusCode = 403
                    });
                }
            }

            var response = await _sprintService.GetActiveSprintByProjectIdAsync(projectId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPut("{sprintId}")]
[Authorize(Roles = "Admin,ProjectManager")]
        public async Task<IActionResult> UpdateSprint(Guid sprintId, [FromBody] SprintUpdateRequest request)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.UpdateSprintAsync(sprintId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpDelete("{sprintId}")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> DeleteSprint(Guid sprintId)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.DeleteSprintAsync(sprintId, userId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("{sprintId}/start")]
        [Authorize(Roles = "ProjectManager")]
        public async Task<IActionResult> StartSprint(Guid sprintId)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.StartSprintAsync(sprintId, userId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("{sprintId}/complete")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> CompleteSprint(Guid sprintId)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.CompleteSprintAsync(sprintId, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function returns sprint statistics
        // Includes task counts by status, story points completed, member progress etc
        // Very useful for sprint review meetings
        [HttpGet("{sprintId}/stats")]
        public async Task<IActionResult> GetSprintStats(Guid sprintId)
        {
            // TL/TM can only access stats of sprints in projects they are allocated to
            if (User.IsInRole("TeamLead") || User.IsInRole("TeamMember"))
            {
                var userId = User.GetUserId();
                var isAllocatedToSprint = await _sprintService.IsUserAllocatedToSprintProjectAsync(sprintId, userId);
                if (!isAllocatedToSprint)
                {
                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "You are not allocated to this project",
                        StatusCode = 403
                    });
                }
            }

            var response = await _sprintService.GetSprintStatsAsync(sprintId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("{sprintId}/members")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> AddSprintMember(Guid sprintId, [FromBody] SprintMemberCreateRequest request)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.AddSprintMemberAsync(sprintId, request, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function removes a member from the sprint
        // Their tasks will remain but they won't be counted in sprint capacity
        [HttpDelete("{sprintId}/members/{userId}")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> RemoveSprintMember(Guid sprintId, Guid userId)
        {
            var requestingUserId = User.GetUserId();
            var response = await _sprintService.RemoveSprintMemberAsync(sprintId, userId, requestingUserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("{sprintId}/time-summary")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> GetSprintTimeSummary(Guid sprintId)
        {
            var userId = User.GetUserId();
            var response = await _sprintService.GetSprintTimeSummaryAsync(sprintId, userId);
            return StatusCode(response.StatusCode, response);
        }

        // This function returns burndown chart data for the sprint
        // Shows ideal vs actual burndown of story points day by day
        // Very important for tracking if sprint is on track
        [HttpGet("{sprintId}/burndown")]
        public async Task<IActionResult> GetSprintBurndown(Guid sprintId)
        {
            // TL/TM can only access burndown of sprints in projects they are allocated to
            if (User.IsInRole("TeamLead") || User.IsInRole("TeamMember"))
            {
                var userId = User.GetUserId();
                var isAllocatedToSprint = await _sprintService.IsUserAllocatedToSprintProjectAsync(sprintId, userId);
                if (!isAllocatedToSprint)
                {
                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "You are not allocated to this project",
                        StatusCode = 403
                    });
                }
            }

            var response = await _sprintService.GetSprintBurndownAsync(sprintId);
            return StatusCode(response.StatusCode, response);
        }

    }
}