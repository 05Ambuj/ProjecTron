using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Auth;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling project allocations - assigning/removing users from projects
    // This is how we manage which team members are working on which project
    [ApiController]
    [Route("api/projects/{projectId}/allocations")]
    [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
    public class ProjectAllocationsController : ControllerBase
    {
        private readonly IProjectAllocationService _service;

        // Constructor - injecting allocation service
        public ProjectAllocationsController(IProjectAllocationService service)
        {
            _service = service;
        }

        // This function assigns a user to a project
        // User will be added to the project team with given team name
        // Only PM and Admin can assign users to projects
        [HttpPost]
        public async Task<IActionResult> AssignUser(
            Guid projectId,
            [FromBody] AssignUserToProjectRequest request)
        {
            if (request == null || request.UserId == Guid.Empty)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Invalid request payload",
                    StatusCode = 400
                });
            }

            var actorUserId = User.GetUserId();

            var response = await _service.AssignUserAsync(
                projectId,
                request.UserId,
                actorUserId,
                request.TeamName
            );

            return StatusCode(response.StatusCode, response);
        }


        // This function removes a user from project allocation
        // Also unassigns them from all tasks in that project
        [HttpDelete("{userId}")]
        public async Task<IActionResult> RemoveUser(
            Guid projectId,
            Guid userId)
        {
            var actorUserId = User.GetUserId();

            var response = await _service.RemoveUserAsync(
                projectId,
                userId,
                actorUserId
            );

            return StatusCode(response.StatusCode, response);
        }

        // This function gets all users allocated to a specific project
        // Returns list of users with their allocation details
        [HttpGet]
        public async Task<IActionResult> GetProjectAllocations(Guid projectId)
        {
            var actorUserId = User.GetUserId();

            var response = await _service.GetProjectAllocationsAsync(
                projectId,
                actorUserId
            );

            return StatusCode(response.StatusCode, response);
        }
    }
}
