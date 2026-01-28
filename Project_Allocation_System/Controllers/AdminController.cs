using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling admin specific operations like audit logs
    // Only admin role users can access these endpoints
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        // Constructor - injecting audit log service dependency
        public AdminController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        // This function is used to get audit logs with pagination and filtering
        // Admin can filter by entity type, action, user email, date range etc
        // Returns paginated list of audit log entries
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? entityType = null,
            [FromQuery] string? action = null,
            [FromQuery] string? userEmail = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? searchTerm = null)
        {
            // Validate pagination parameters
            if (pageNumber <= 0 || pageSize <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid paging parameters. PageNumber and PageSize must be greater than 0.",
                    Data = null,
                    StatusCode = StatusCodes.Status400BadRequest
                });
            }

            var filter = new AuditLogFilterRequest
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                EntityType = entityType,
                Action = action,
                UserEmail = userEmail,
                StartDate = startDate,
                EndDate = endDate,
                SearchTerm = searchTerm
            };

            var (logs, totalCount) = await _auditLogService.GetAuditLogsAsync(filter);

            return Ok(new ApiResponse<PagedResponse<AuditLogDto>>
            {
                Success = true,
                Message = "Audit logs fetched successfully",
                Data = new PagedResponse<AuditLogDto>
                {
                    Items = logs,
                    TotalCount = totalCount,
                    Page = pageNumber,
                    PageSize = pageSize
                },
                StatusCode = StatusCodes.Status200OK
            });
        }

        // This function fetches the most recent audit logs
        // By default it will return last 5 logs, can be changed using limit parameter
        // Useful for showing recent activity on dashboard
        [HttpGet("audit-logs/recent")]
        public async Task<IActionResult> GetRecentAuditLogs([FromQuery] int limit = 5)
        {
            if (limit <= 0 || limit > 100)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Limit must be between 1 and 100.",
                    Data = null,
                    StatusCode = StatusCodes.Status400BadRequest
                });
            }

            var logs = await    _auditLogService.GetRecentAuditLogsAsync(limit);

            return Ok(new ApiResponse<List<AuditLogDto>>
            {
                Success = true,
                Message = "Recent audit logs fetched successfully",
                Data = logs,
                StatusCode = StatusCodes.Status200OK
            });
        }
    }
}
