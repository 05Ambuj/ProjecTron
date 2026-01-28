using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.Interfaces;

namespace Project_Allocation_System.Controllers
{
    // Controller for team member dashboard statistics
    // Shows personal work stats like my tasks, completed tasks, hours logged etc
    [ApiController]
    [Route("api/team-member/dashboard")]
    [Authorize(Roles = "TeamMember")]
    public class TeamMemberDashboardController : ControllerBase
    {
        private readonly ITeamMemberDashboardService _service;

        // Constructor - injecting dashboard service
        public TeamMemberDashboardController(ITeamMemberDashboardService service)
        {
            _service = service;
        }

        // This function returns dashboard stats for team member
        // Shows my tasks count, in progress, completed, overdue and hours logged
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var userId = User.GetUserId();
            var result = await _service.GetDashboardAsync(userId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
