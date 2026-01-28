using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using System;
using System.Threading.Tasks;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling work item links between tasks
    // Links can be of types like Related, Blocked By, Duplicate etc
    // Useful for showing task dependencies and relationships
    [ApiController]
    [Route("api/tasks/{taskId}/links")]
    [Authorize]
    public class WorkItemLinkController : ControllerBase
    {
        private readonly IWorkItemLinkService _linkService;

        // Constructor - injecting link service
        public WorkItemLinkController(IWorkItemLinkService linkService)
        {
            _linkService = linkService;
        }

        // This function creates a link between two tasks
        // Validates both tasks exist and prevents self-linking
        [HttpPost]
        public async Task<IActionResult> CreateLink(Guid taskId, [FromBody] CreateWorkItemLinkRequest request)
        {
            // Ensure source task matches the route parameter
            request.SourceTaskId = taskId;

            var userId = User.GetUserId();
            var response = await _linkService.CreateLinkAsync(userId, request);
            return StatusCode(response.StatusCode, response);
        }

        // This function gets all links for a task
        // Returns links where task is either source or target
        [HttpGet]
        public async Task<IActionResult> GetLinks(Guid taskId)
        {
            var response = await _linkService.GetLinksByTaskIdAsync(taskId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpDelete("{linkId}")]
        public async Task<IActionResult> DeleteLink(Guid taskId, Guid linkId)
        {
            var userId = User.GetUserId();
            var response = await _linkService.DeleteLinkAsync(linkId, userId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
