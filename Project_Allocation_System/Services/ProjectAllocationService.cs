using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using Project_Allocation_System.Repos;

namespace Project_Allocation_System.Services
{
    // Service for managing project allocations
    // Handles assigning and removing users from projects
    public class ProjectAllocationService : IProjectAllocationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProjectRepository _projectRepo;
        private readonly IUserRepository _userRepo;
        private readonly IProjectAllocationRepository _allocationRepo;
        private readonly ITaskRepository _taskRepo;
        private readonly ILogger<ProjectAllocationService> _logger;
        private readonly IMapper _mapper;
        private readonly ServiceBusNotificationService _notificationService;

        // Constructor - injecting all required dependencies
        public ProjectAllocationService(
            ApplicationDbContext context,
            IProjectRepository projectRepo,
            IUserRepository userRepo,
            IProjectAllocationRepository allocationRepo,
            ITaskRepository taskRepo,
            ILogger<ProjectAllocationService> logger,
            IMapper mapper,
            ServiceBusNotificationService notificationService
        )
        {
            _context = context;
            _projectRepo = projectRepo;
            _userRepo = userRepo;
            _allocationRepo = allocationRepo;
            _taskRepo = taskRepo;
            _logger = logger;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        // This function assigns a user to a project
        // Validates that actor has permission (PM or Admin)
        // Checks org match, role validity, existing allocation and max limit
        // Only TL and TM roles can be allocated to projects
        public async Task<ApiResponse<bool>> AssignUserAsync(
            Guid projectId,
            Guid targetUserId,
            Guid actorUserId,
            string teamName
        )
        {
            try
            {
                var project = await _projectRepo.GetByIdAsync(projectId);
                if (project == null)
                {
                    _logger.LogWarning(
                        "Project not found. ProjectId={ProjectId}, ActorUserId={ActorUserId}",
                        projectId,
                        actorUserId
                    );
                    return Fail("Project not found", 404);
                }

                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (
                    actor == null
                    || (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                )
                {
                    _logger.LogWarning(
                        "Unauthorized attempt to assign user. ActorUserId={ActorUserId}, ProjectId={ProjectId}",
                        actorUserId,
                        projectId
                    );
                    return Fail("Forbidden", 403);
                }

                if (actor.OrganizationId != project.OrganizationId)
                {
                    _logger.LogWarning(
                        "Organization mismatch. ActorOrgId={ActorOrgId}, ProjectOrgId={ProjectOrgId}",
                        actor.OrganizationId,
                        project.OrganizationId
                    );
                    return Fail("Organization mismatch", 403);
                }

                var target = await _userRepo.GetByIdAsync(targetUserId);
                if (target == null || target.OrganizationId != project.OrganizationId)
                {
                    _logger.LogWarning(
                        "Invalid user for assignment. TargetUserId={TargetUserId}, ProjectId={ProjectId}",
                        targetUserId,
                        projectId
                    );
                    return Fail("Invalid user", 400);
                }

                if (target.Role != UserRole.TeamLead && target.Role != UserRole.TeamMember)
                {
                    _logger.LogWarning(
                        "Invalid role for assignment. TargetUserId={TargetUserId}, Role={Role}",
                        targetUserId,
                        target.Role
                    );
                    return Fail("Invalid role", 400);
                }

                if (await _allocationRepo.ExistsAsync(projectId, targetUserId))
                {
                    _logger.LogWarning(
                        "User already assigned. ProjectId={ProjectId}, TargetUserId={TargetUserId}",
                        projectId,
                        targetUserId
                    );
                    return Fail("User already assigned", 409);
                }

                var currentCount = await _allocationRepo.GetCountAsync(projectId);
                if (currentCount >= project.MaxAllocations)
                {
                    _logger.LogWarning(
                        "Max allocations reached. ProjectId={ProjectId}, CurrentCount={Count}, Max={Max}",
                        projectId,
                        currentCount,
                        project.MaxAllocations
                    );
                    return Fail("Max allocations reached", 400);
                }

                var normalizedTeamName = string.IsNullOrWhiteSpace(teamName)
                    ? (string.IsNullOrWhiteSpace(project.Name) ? "Team" : $"{project.Name} Team")
                    : teamName.Trim();

                var actorEmail = string.IsNullOrWhiteSpace(actor.Email) ? "system" : actor.Email;

                await _allocationRepo.CreateAsync(
                    new ProjectAllocation
                    {
                        AllocationId = Guid.NewGuid(),
                        ProjectId = projectId,
                        UserId = targetUserId,
                        TeamName = normalizedTeamName,
                        AllocationPercentage = 100,
                        StartDate = DateTime.UtcNow,
                        IsActive = true,
                        CreatedBy = actorEmail,
                        UpdatedBy = actorEmail,
                        CreatedDate = DateTime.UtcNow,
                        UpdatedDate = DateTime.UtcNow,
                    }
                );

                _logger.LogInformation(
                    "User assigned to project. ProjectId={ProjectId}, TargetUserId={TargetUserId}, ActorUserId={ActorUserId}",
                    projectId,
                    targetUserId,
                    actorUserId
                );

                // Send email notification
                _logger.LogInformation(
                    "Preparing to send 'user-added-to-project' email notification. TargetUserId: {TargetUserId}, TargetEmail: {TargetEmail}, ProjectId: {ProjectId}",
                    targetUserId,
                    target.Email,
                    projectId
                );

                if (string.IsNullOrWhiteSpace(target.Email))
                {
                    _logger.LogWarning(
                        "Cannot send email notification: Target user email is null or empty. TargetUserId: {TargetUserId}, ProjectId: {ProjectId}",
                        targetUserId,
                        projectId
                    );
                }
                else
                {
                    try
                    {
                        var templateData = new Dictionary<string, object>
                        {
                            ["RecipientName"] = target.DisplayName,
                            ["ProjectName"] = project.Name,
                            ["TeamName"] = normalizedTeamName,
                            ["AddedByName"] = actor.DisplayName,
                            ["ProjectUrl"] = $"https://yourapp.com/projects/{projectId}" // Update with your actual URL
                        };
                        _logger.LogInformation(
                            "Calling SendEmailNotificationAsync for 'user-added-to-project'. TargetEmail: {TargetEmail}, TemplateDataKeys: {Keys}",
                            target.Email,
                            string.Join(", ", templateData.Keys)
                        );
                        await _notificationService.SendEmailNotificationAsync(
                            "UserAddedToProject",
                            "user-added-to-project",
                            targetUserId,
                            target.Email,
                            templateData
                        );
                        _logger.LogInformation(
                            "SendEmailNotificationAsync completed for 'user-added-to-project'. TargetEmail: {TargetEmail}",
                            target.Email
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(
                            emailEx,
                            "ERROR sending 'user-added-to-project' email notification. TargetUserId: {TargetUserId}, TargetEmail: {TargetEmail}, ProjectId: {ProjectId}, Error: {ErrorMessage}",
                            targetUserId,
                            target.Email,
                            projectId,
                            emailEx.Message
                        );
                        // Don't throw - email failure shouldn't break the allocation
                    }
                }

                return Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error assigning user to project. ProjectId={ProjectId}, TargetUserId={TargetUserId}, ActorUserId={ActorUserId}",
                    projectId,
                    targetUserId,
                    actorUserId
                );
                return Fail("An error occurred while assigning user", 500);
            }
        }

        // This function removes a user from project allocation
        // Also unassigns them from all tasks in that project
        // And removes them as reviewer from tasks
        public async Task<ApiResponse<bool>> RemoveUserAsync(
            Guid projectId,
            Guid targetUserId,
            Guid actorUserId
        )
        {
            try
            {
                var project = await _projectRepo.GetByIdAsync(projectId);
                var actor = await _userRepo.GetByIdAsync(actorUserId);

                if (project == null || actor == null)
                {
                    _logger.LogWarning(
                        "Invalid request to remove user. ProjectId={ProjectId}, TargetUserId={TargetUserId}, ActorUserId={ActorUserId}",
                        projectId,
                        targetUserId,
                        actorUserId
                    );
                    return Fail("Invalid request", 400);
                }

                if (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                {
                    _logger.LogWarning(
                        "Unauthorized attempt to remove user. ActorUserId={ActorUserId}, ProjectId={ProjectId}",
                        actorUserId,
                        projectId
                    );
                    return Fail("Forbidden", 403);
                }

                if (actor.OrganizationId != project.OrganizationId)
                {
                    _logger.LogWarning(
                        "Organization mismatch when removing user. ActorOrgId={ActorOrgId}, ProjectOrgId={ProjectOrgId}",
                        actor.OrganizationId,
                        project.OrganizationId
                    );
                    return Fail("Organization mismatch", 403);
                }

                await _allocationRepo.RemoveAsync(projectId, targetUserId);

                // Unassign the user from all tasks in this project and remove as reviewer
                var unassignedCount = await _taskRepo.UnassignUserFromProjectTasksAsync(
                    projectId,
                    targetUserId
                );
                var reviewerRemovedCount =
                    await _taskRepo.RemoveUserAsReviewerFromProjectTasksAsync(
                        projectId,
                        targetUserId
                    );

                _logger.LogInformation(
                    "User removed from project. Unassigned from {UnassignedCount} tasks, removed as reviewer from {ReviewerCount} tasks. ProjectId={ProjectId}, TargetUserId={TargetUserId}, ActorUserId={ActorUserId}",
                    unassignedCount,
                    reviewerRemovedCount,
                    projectId,
                    targetUserId,
                    actorUserId
                );

                return Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error removing user from project. ProjectId={ProjectId}, TargetUserId={TargetUserId}, ActorUserId={ActorUserId}",
                    projectId,
                    targetUserId,
                    actorUserId
                );
                return Fail("An error occurred while removing user", 500);
            }
        }

        // This function gets all users allocated to a project
        // Validates that actor has access to the project's organization
        // Returns allocation details with user info
        public async Task<ApiResponse<List<ProjectAllocationDTO>>> GetProjectAllocationsAsync(
            Guid projectId,
            Guid actorUserId
        )
        {
            try
            {
                var project = await _projectRepo.GetByIdAsync(projectId);
                var actor = await _userRepo.GetByIdAsync(actorUserId);

                if (project == null || actor == null)
                {
                    _logger.LogWarning(
                        "Invalid request to get allocations. ProjectId={ProjectId}, ActorUserId={ActorUserId}",
                        projectId,
                        actorUserId
                    );
                    return new ApiResponse<List<ProjectAllocationDTO>>
                    {
                        Success = false,
                        Message = "Invalid request",
                        StatusCode = 400,
                    };
                }

                // Organization check - ensure user and project are in same organization
                // Handle null organization IDs (shouldn't happen, but defensive programming)
                if (actor.OrganizationId == Guid.Empty || project.OrganizationId == Guid.Empty)
                {
                    _logger.LogWarning(
                        "Empty organization ID detected. ActorOrgId={ActorOrgId}, ProjectOrgId={ProjectOrgId}, ActorRole={ActorRole}",
                        actor.OrganizationId,
                        project.OrganizationId,
                        actor.Role
                    );
                    return new ApiResponse<List<ProjectAllocationDTO>>
                    {
                        Success = false,
                        Message = "Invalid organization configuration",
                        StatusCode = 400,
                    };
                }

                if (actor.OrganizationId != project.OrganizationId)
                {
                    _logger.LogWarning(
                        "Organization mismatch when getting allocations. ActorOrgId={ActorOrgId}, ProjectOrgId={ProjectOrgId}, ActorRole={ActorRole}, ActorEmail={ActorEmail}",
                        actor.OrganizationId,
                        project.OrganizationId,
                        actor.Role,
                        actor.Email
                    );
                    return new ApiResponse<List<ProjectAllocationDTO>>
                    {
                        Success = false,
                        Message = "You don't have access to this project",
                        StatusCode = 403,
                    };
                }

                // At this point, Admin, ProjectManager, or TeamLead from same org can see allocations
                // Organization check is sufficient - if they're from the same org and have TeamLead role,
                // they should be able to see allocations for projects in their organization
                var allocations = await _allocationRepo.GetByProjectIdAsync(projectId);

                var data = _mapper.Map<List<ProjectAllocationDTO>>(allocations);

                return Success(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting project allocations. ProjectId={ProjectId}, ActorUserId={ActorUserId}",
                    projectId,
                    actorUserId
                );
                return new ApiResponse<List<ProjectAllocationDTO>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving allocations",
                    StatusCode = 500,
                };
            }
        }

        // This function gets all project ids that a user is allocated to
        // Useful for filtering tasks and sprints by user's accessible projects
        public async Task<List<Guid>> GetProjectIdsForUserAsync(Guid userId)
        {
            try
            {
                return await _context
                    .ProjectAllocations.Where(a => a.UserId == userId)
                    .Select(a => a.ProjectId)
                    .Distinct()
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project IDs for user. UserId={UserId}", userId);
                throw;
            }
        }

        // Helper method to create success response with data
        private ApiResponse<T> Success<T>(T data) =>
            new()
            {
                Success = true,
                Data = data,
                StatusCode = 200,
            };

        // Helper method to create failure response with error message
        private ApiResponse<bool> Fail(string message, int statusCode) =>
            new()
            {
                Success = false,
                Message = message,
                StatusCode = statusCode,
            };
    }
}
