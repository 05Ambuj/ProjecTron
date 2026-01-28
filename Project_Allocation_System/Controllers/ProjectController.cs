using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling all project related CRUD operations
    // Projects are the main work items where teams collaborate
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly IUserRepository _userRepository;
        private readonly IAuditLogService _auditLogService;
        private readonly IProjectAllocationRepository _projectAllocationRepository;

        // Constructor - injecting required services and repositories
        public ProjectsController(
            IProjectService projectService,
            IUserRepository userRepository,
            IAuditLogService auditLogService,
            IProjectAllocationRepository projectAllocationRepository
        )
        {
            _projectService = projectService;
            _userRepository = userRepository;
            _auditLogService = auditLogService;
            _projectAllocationRepository = projectAllocationRepository;
        }

        // This function creates a new project
        // Only users with CanManageProjects permission can create projects
        // Also logs the action in audit log for tracking
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCreateRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out var userId))
                return Unauthorized();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            if (!user.Role.CanManageProjects())
                return Forbid();

            var response = await _projectService.CreateAsync(userId, request);

            // Log audit entry if project was created successfully
            if (response.Success && response.Data != null)
            {
                await _auditLogService.LogAsync(
                    entityType: "Project",
                    entityId: response.Data.ProjectId,
                    action: "Created",
                    userId: userId,
                    userEmail: user.Email,
                    fieldName: null,
                    oldValue: null,
                    newValue: null,
                    description: $"Project '{request.Name}' ({request.Code}) created",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                );
            }

            return response.Success ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        // This function fetches single project details by id
        // TL and TM can only view projects they are allocated to
        // Admin and PM can view all projects in their org
        [HttpGet("{projectId}")]
        public async Task<IActionResult> GetProject(Guid projectId)
        {
            // TL/TM are read-only and can only view projects they are allocated to
            if (User.IsInRole("TeamLead") || User.IsInRole("TeamMember"))
            {
                var userId = User.GetUserId();
                var isAllocated = await _projectAllocationRepository.ExistsAsync(projectId, userId);
                if (!isAllocated)
                {
                    return Forbid();
                }
            }

            var response = await _projectService.GetByIdAsync(projectId);
            return response.Success ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        // This function gets all projects assigned to the current user
        // Mainly for TL and TM to see their allocated projects
        [HttpGet("assigned")]
        [Authorize(Roles = "TeamLead,TeamMember")]
        public async Task<IActionResult> GetAssignedProjects()
        {
            var userId = User.GetUserId();
            var projectIds = await _projectAllocationRepository.GetProjectIdsForUserAsync(userId);

            var response = await _projectService.GetByIdsAsync(projectIds);
            return StatusCode(response.StatusCode, response);
        }

        // This function fetches all projects with pagination, filtering and sorting
        // PM will only see projects from their organization
        // Admin can see all projects in the system
        // Can filter by status, priority, project manager etc
        [HttpGet]
        [Authorize(Roles = "Admin,ProjectManager")]
        public async Task<IActionResult> GetProjects(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? status = null,
            [FromQuery] int? priority = null,
            [FromQuery] Guid? projectManagerId = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = null
        )
        {
            // Validate pagination parameters
            if (pageNumber <= 0 || pageSize <= 0)
            {
                return BadRequest(
                    new ApiResponse<object>
                    {
                        Success = false,
                        Message =
                            "Invalid paging parameters. PageNumber and PageSize must be greater than 0.",
                        Data = null,
                        StatusCode = 400,
                    }
                );
            }

            Guid? organizationId = null;

            // Restrict Project Manager to their org
            if (User.IsInRole("ProjectManager"))
            {
                organizationId = User.GetOrganizationId();
            }

            // Parse status from int to ProjectStatus enum
            ProjectStatus? statusEnum = null;
            if (status.HasValue && Enum.IsDefined(typeof(ProjectStatus), status.Value))
            {
                statusEnum = (ProjectStatus)status.Value;
            }

            // Parse priority from int to ProjectPriority enum
            ProjectPriority? priorityEnum = null;
            if (priority.HasValue && Enum.IsDefined(typeof(ProjectPriority), priority.Value))
            {
                priorityEnum = (ProjectPriority)priority.Value;
            }

            // Always use filtered endpoint for consistency
            var filter = new ProjectFilterRequest
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                Status = statusEnum,
                Priority = priorityEnum,
                OrganizationId = organizationId,
                ProjectManagerId = projectManagerId,
                SortBy = sortBy,
                SortOrder = sortOrder,
            };

            var response = await _projectService.GetFilteredAsync(filter);
            return StatusCode(response.StatusCode, response);
        }

        // This function updates an existing project
        // Can update name, description, status, priority, dates, budget etc
        // Also logs status and priority changes in audit log for tracking
        [HttpPut("{projectId}")]
        [Authorize(Roles = "Admin,ProjectManager")]
        public async Task<IActionResult> UpdateProject(
            Guid projectId,
            [FromBody] ProjectUpdateRequest request
        )
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out var userId))
                return Unauthorized();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            if (!user.Role.CanManageProjects())
                return Forbid();

            // Get project before update to compare changes
            var beforeUpdate = await _projectService.GetByIdAsync(projectId);

            var response = await _projectService.UpdateAsync(projectId, request, userId);

            // Log audit entry if project was updated successfully
            if (
                response.Success
                && response.Data != null
                && beforeUpdate.Success
                && beforeUpdate.Data != null
            )
            {
                var before = beforeUpdate.Data;
                var after = response.Data;

                // Log status change if it changed
                if (request.Status.HasValue && before.Status != (ProjectStatus)request.Status.Value)
                {
                    await _auditLogService.LogAsync(
                        entityType: "Project",
                        entityId: projectId,
                        action: "StatusChanged",
                        userId: userId,
                        userEmail: user.Email,
                        fieldName: "Status",
                        oldValue: before.Status.ToString(),
                        newValue: ((ProjectStatus)request.Status.Value).ToString(),
                        description: $"Project status changed from {before.Status} to {(ProjectStatus)request.Status.Value}",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                    );
                }

                // Log priority change if it changed
                if (
                    request.Priority.HasValue
                    && before.Priority != (ProjectPriority)request.Priority.Value
                )
                {
                    await _auditLogService.LogAsync(
                        entityType: "Project",
                        entityId: projectId,
                        action: "PriorityChanged",
                        userId: userId,
                        userEmail: user.Email,
                        fieldName: "Priority",
                        oldValue: before.Priority.ToString(),
                        newValue: ((ProjectPriority)request.Priority.Value).ToString(),
                        description: $"Project priority changed from {before.Priority} to {(ProjectPriority)request.Priority.Value}",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                    );
                }

                // Log project manager reassignment if it changed
                if (
                    request.ProjectManagerId.HasValue
                    && before.ProjectManagerId != after.ProjectManagerId
                )
                {
                    await _auditLogService.LogAsync(
                        entityType: "Project",
                        entityId: projectId,
                        action: "ProjectManagerReassigned",
                        userId: userId,
                        userEmail: user.Email,
                        fieldName: "ProjectManagerId",
                        oldValue: before.ProjectManagerId.ToString(),
                        newValue: after.ProjectManagerId.ToString(),
                        description: $"Project Manager reassigned from {before.ProjectManagerName ?? "N/A"} to {after.ProjectManagerName ?? "N/A"}",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                    );
                }

                // Log general update if other fields changed
                if (request.Name != null || request.Description != null || request.Budget.HasValue)
                {
                    await _auditLogService.LogAsync(
                        entityType: "Project",
                        entityId: projectId,
                        action: "Updated",
                        userId: userId,
                        userEmail: user.Email,
                        fieldName: null,
                        oldValue: null,
                        newValue: null,
                        description: $"Project '{after.Name}' updated",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                    );
                }
            }

            return response.Success ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        // This function deletes a project
        // Only Admin can delete projects
        // Logs the deletion in audit log before removing
        [HttpDelete("{projectId}")]
        public async Task<IActionResult> DeleteProject(Guid projectId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out var userId))
                return Unauthorized();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            if (user.Role != UserRole.Admin)
                return Forbid();

            // Get project before deletion for audit log
            var project = await _projectService.GetByIdAsync(projectId);

            var response = await _projectService.DeleteAsync(projectId);

            // Log audit entry if project was deleted successfully
            if (response.Success && project.Success && project.Data != null)
            {
                await _auditLogService.LogAsync(
                    entityType: "Project",
                    entityId: projectId,
                    action: "Deleted",
                    userId: userId,
                    userEmail: user.Email,
                    fieldName: null,
                    oldValue: null,
                    newValue: null,
                    description: $"Project '{project.Data.Name}' ({project.Data.Code}) deleted",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                );
            }

            return response.Success ? Ok(response) : StatusCode(response.StatusCode, response);
        }

        //[HttpGet("{projectId}/user-count")]
        //[Authorize(Roles = "Admin,ProjectManager")]
        //public async Task<IActionResult> GetProjectUserCount(Guid projectId)
        //{
        //    var project = await _projectService.GetByIdAsync(projectId);
        //    if (!project.Success)
        //        return NotFound();

        //    return Ok(new
        //    {
        //        ProjectId = projectId,
        //        TotalUsers = await _projectRepository.GetUserCountAsync(projectId)
        //    });
        //}
    }
}
