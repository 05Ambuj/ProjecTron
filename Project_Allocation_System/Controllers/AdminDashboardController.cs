using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Interfaces;

namespace Project_Allocation_System.Controllers
{
    // Controller for admin dashboard statistics
    // Shows overall system stats like total users, projects, organizations etc
    [ApiController]
    [Route("api/admin/dashboard-stats")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _service;

        // Constructor - injecting dashboard service
        public AdminDashboardController(IAdminDashboardService service)
        {
            _service = service;
        }

        // This function returns all the dashboard statistics for admin
        // Basically fetches total counts of orgs, users, projects and open tasks
        [HttpGet]
        public async Task<IActionResult> GetStats()
        {
            var result = await _service.GetStatsAsync();
            return StatusCode(result.StatusCode, result);
        }
    }
}
