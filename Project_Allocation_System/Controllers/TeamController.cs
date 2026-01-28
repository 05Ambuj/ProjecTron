using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling team operations
    // Teams are subgroups within a project with one team lead and multiple members
    [ApiController]
    [Route("api/teams")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _teamService;

        // Constructor - injecting team service
        public TeamController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        // This function searches projects and returns their teams
        // PM will only see their own projects, Admin can see all
        // Can search by project name or code
        [HttpGet("search")]
        public async Task<IActionResult> SearchProjectsWithTeams([FromQuery] string? searchTerm)
        {
            var actorUserId = User.GetUserId();
            var response = await _teamService.SearchProjectsWithTeamsAsync(searchTerm, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets all teams for a specific project
        // Returns team details with member count and team lead info
        [HttpGet("project/{projectId}")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead,TeamMember")]
        public async Task<IActionResult> GetProjectTeams(Guid projectId)
        {
            var actorUserId = User.GetUserId();
            var response = await _teamService.GetProjectTeamsAsync(projectId, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function fetches single team details by id
        // Returns team info with all members list
        [HttpGet("{teamId}")]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead,TeamMember")]
        public async Task<IActionResult> GetTeam(Guid teamId)
        {
            var actorUserId = User.GetUserId();
            var response = await _teamService.GetTeamByIdAsync(teamId, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function creates a new team for a project
        // Each team must have exactly one team lead
        // Team name must be unique within the project
        [HttpPost]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request)
        {
            if (request == null || request.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new ApiResponse<TeamDTO>
                {
                    Success = false,
                    Message = "Invalid request. ProjectId and Name are required.",
                    StatusCode = 400
                });
            }

            if (request.TeamLeadId == Guid.Empty)
            {
                return BadRequest(new ApiResponse<TeamDTO>
                {
                    Success = false,
                    Message = "TeamLeadId is required. Each team must have exactly one team lead.",
                    StatusCode = 400
                });
            }

            var actorUserId = User.GetUserId();
            var response = await _teamService.CreateTeamAsync(request, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function updates an existing team
        // Can update name, description and team lead
        // If team lead changes, old lead is unassigned from tasks
        [HttpPut("{teamId}")]
        public async Task<IActionResult> UpdateTeam(Guid teamId, [FromBody] UpdateTeamRequest request)
        {
            if (request == null)
            {
                return BadRequest(new ApiResponse<TeamDTO>
                {
                    Success = false,
                    Message = "Invalid request",
                    StatusCode = 400
                });
            }

            var actorUserId = User.GetUserId();
            var response = await _teamService.UpdateTeamAsync(teamId, request, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function deletes (deactivates) a team
        // Soft delete - team is marked as inactive
        [HttpDelete("{teamId}")]
        public async Task<IActionResult> DeleteTeam(Guid teamId)
        {
            var actorUserId = User.GetUserId();
            var response = await _teamService.DeleteTeamAsync(teamId, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function adds a member to a team
        // Only users with TeamMember role can be added
        // User must be from same organization as project
        [HttpPost("{teamId}/members")]
        public async Task<IActionResult> AddMember(Guid teamId, [FromBody] AddTeamMemberRequest request)
        {
            if (request == null || request.UserId == Guid.Empty)
            {
                return BadRequest(new ApiResponse<TeamMemberDTO>
                {
                    Success = false,
                    Message = "Invalid request. UserId is required.",
                    StatusCode = 400
                });
            }

            var actorUserId = User.GetUserId();
            var response = await _teamService.AddMemberToTeamAsync(teamId, request, actorUserId);
            return StatusCode(response.StatusCode, response);
        }

        // This function removes a member from team
        // Also unassigns them from all tasks in the project
        // Team lead cannot be removed using this - need to update team first
        [HttpDelete("{teamId}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(Guid teamId, Guid userId)
        {
            var actorUserId = User.GetUserId();
            var response = await _teamService.RemoveMemberFromTeamAsync(teamId, userId, actorUserId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
