using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

// Controller for project manager dashboard statistics
// Shows PM specific stats like their projects count, active sprints, tasks etc
[ApiController]
[Route("api/project-manager/dashboard")]
[Authorize(Roles = "ProjectManager")]
public class ProjectManagerDashboardController : ControllerBase
{
    private readonly IProjectManagerDashboardService _service;

    // Constructor - injecting dashboard service
    public ProjectManagerDashboardController(IProjectManagerDashboardService service)
    {
        _service = service;
    }

    // This function returns dashboard stats for project manager
    // Fetches count of projects they manage, active sprints, open and overdue tasks
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = User.GetUserId();
        var result = await _service.GetDashboardAsync(userId);
        return StatusCode(result.StatusCode, result);
    }
}
