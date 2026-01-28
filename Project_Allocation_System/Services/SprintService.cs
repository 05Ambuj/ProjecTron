using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Mapping;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Services
{
    public class SprintService : ISprintService
    {
        private readonly ISprintRepository _sprintRepository;
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly IProjectAllocationRepository _projectAllocationRepository;
        private readonly ILogger<SprintService> _logger;
        private readonly IMapper _mapper;

        public SprintService(
            ISprintRepository sprintRepository,
            IProjectRepository projectRepository,
            IUserRepository userRepository,
            ITaskRepository taskRepository,
            IProjectAllocationRepository projectAllocationRepository,
            ILogger<SprintService> logger,
            IMapper mapper
        )
        {
            _sprintRepository = sprintRepository;
            _projectRepository = projectRepository;
            _userRepository = userRepository;
            _taskRepository = taskRepository;
            _projectAllocationRepository = projectAllocationRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponse<SprintDTO>> CreateSprintAsync(
            Guid userId,
            SprintCreateRequest request
        )
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Only Project Manager and Admin can create sprints
                if (!user.Role.CanManageProjects())
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message =
                            "Only Project Managers and Admins can create sprints",
                        StatusCode = 403,
                    };
                }

                var project = await _projectRepository.GetByIdAsync(request.ProjectId);
                if (project == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Project not found",
                        StatusCode = 404,
                    };
                }

                // Verify organization access
                if (user.Role != UserRole.Admin && project.OrganizationId != user.OrganizationId)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "You don't have access to this project",
                        StatusCode = 403,
                    };
                }

                // Validate dates
                if (request.EndDate <= request.StartDate)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "End date must be after start date",
                        StatusCode = 400,
                    };
                }

                // Check for overlapping sprints
                var hasOverlap = await _sprintRepository.HasOverlappingSprintAsync(
                    request.ProjectId,
                    request.StartDate,
                    request.EndDate
                );

                if (hasOverlap)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Sprint dates overlap with an existing sprint",
                        StatusCode = 400,
                    };
                }

                var sprint = new Sprint
                {
                    SprintId = Guid.NewGuid(),
                    ProjectId = request.ProjectId,
                    Name = request.Name,
                    Goals = request.Goals,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalStoryPoints = request.TotalStoryPoints,
                    Status = SprintStatus.Planned,
                    Notes = request.Notes ?? string.Empty,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = user.Email,
                    UpdatedBy = user.Email,
                };

                await _sprintRepository.CreateAsync(sprint);

                // Auto-assign all TL/TM allocated to the project, plus any explicitly provided members
                var sprintMemberIds = new HashSet<Guid>(
                    request.Members?.Select(m => m.UserId) ?? Enumerable.Empty<Guid>()
                );

                var allocations = await _projectAllocationRepository.GetByProjectIdAsync(request.ProjectId);
                var allocatedUserIds = allocations
                    .Where(a => a.IsActive && a.User != null && a.User.IsActive && (a.User.Role == UserRole.TeamLead || a.User.Role == UserRole.TeamMember))
                    .Select(a => a.UserId);

                foreach (var allocatedUserId in allocatedUserIds)
                {
                    sprintMemberIds.Add(allocatedUserId);
                }

                // Create sprint member entries
                if (sprintMemberIds.Count > 0)
                {
                    // map provided member details if present
                    var providedMap = (request.Members ?? Enumerable.Empty<SprintMemberCreateRequest>())
                        .ToDictionary(m => m.UserId, m => m);

                    foreach (var memberUserId in sprintMemberIds)
                    {
                        var provided = providedMap.ContainsKey(memberUserId) ? providedMap[memberUserId] : null;

                        var member = new SprintMember
                        {
                            SprintMemberId = Guid.NewGuid(),
                            SprintId = sprint.SprintId,
                            UserId = memberUserId,
                            AvailableHoursPerWeek = provided?.AvailableHoursPerWeek ?? 40,
                            AllocatedStoryPoints = provided?.AllocatedStoryPoints ?? 0,
                            CreatedDate = DateTime.UtcNow,
                        };

                        await _sprintRepository.AddSprintMemberAsync(member);
                    }
                }

                _logger.LogInformation(
                    "Sprint created: {SprintName} for Project {ProjectId} by {UserEmail}",
                    sprint.Name,
                    request.ProjectId,
                    user.Email
                );

                // TODO: Send email notification to team members
                // await _emailService.SendSprintCreatedEmail(sprint);

                var createdSprint = await _sprintRepository.GetByIdWithDetailsAsync(
                    sprint.SprintId
                );
                if (createdSprint == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Failed to retrieve created sprint",
                        StatusCode = 500,
                    };
                }
                return new ApiResponse<SprintDTO>
                {
                    Success = true,
                    Message = "Sprint created successfully",
                    Data = MapToDTO(createdSprint),
                    StatusCode = 201,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error creating sprint. UserId={UserId}, ProjectId={ProjectId}",
                    userId,
                    request.ProjectId
                );
                return new ApiResponse<SprintDTO>
                {
                    Success = false,
                    Message = "An error occurred while creating the sprint",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<SprintDTO>> GetSprintByIdAsync(Guid sprintId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdWithDetailsAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                return new ApiResponse<SprintDTO>
                {
                    Success = true,
                    Data = MapToDTO(sprint),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sprint. SprintId={SprintId}", sprintId);
                return new ApiResponse<SprintDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<List<SprintDTO>>> GetSprintsByProjectIdAsync(Guid projectId)
        {
            try
            {
                var sprints = await _sprintRepository.GetByProjectIdAsync(projectId);
                var dtos = sprints.Where(s => s != null).Select(MapToDTO).ToList();

                return new ApiResponse<List<SprintDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sprints. ProjectId={ProjectId}", projectId);
                return new ApiResponse<List<SprintDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<SprintDTO>> GetActiveSprintByProjectIdAsync(Guid projectId)
        {
            try
            {
                var sprint = await _sprintRepository.GetActiveSprintByProjectIdAsync(projectId);
                if (sprint == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "No active sprint found for this project",
                        StatusCode = 404,
                    };
                }

                return new ApiResponse<SprintDTO>
                {
                    Success = true,
                    Data = MapToDTO(sprint),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting active sprint. ProjectId={ProjectId}",
                    projectId
                );
                return new ApiResponse<SprintDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<SprintDTO>> UpdateSprintAsync(
            Guid sprintId,
            SprintUpdateRequest request,
            Guid userId
        )
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);

                // Only Project Manager and Admin can update sprints
                if (!user.Role.CanManageProjects())
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Only Project Managers and Admins can update sprints",
                        StatusCode = 403,
                    };
                }

                // Cannot update completed or cancelled sprints
                if (
                    sprint.Status == SprintStatus.Completed
                    || sprint.Status == SprintStatus.Cancelled
                )
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Cannot update completed or cancelled sprints",
                        StatusCode = 400,
                    };
                }

                // Update fields
                if (!string.IsNullOrWhiteSpace(request.Name))
                    sprint.Name = request.Name;

                if (!string.IsNullOrWhiteSpace(request.Goals))
                    sprint.Goals = request.Goals;

                if (request.StartDate.HasValue && request.EndDate.HasValue)
                {
                    if (request.EndDate.Value <= request.StartDate.Value)
                    {
                        return new ApiResponse<SprintDTO>
                        {
                            Success = false,
                            Message = "End date must be after start date",
                            StatusCode = 400,
                        };
                    }

                    // Check for overlapping sprints (excluding current sprint)
                    var hasOverlap = await _sprintRepository.HasOverlappingSprintAsync(
                        sprint.ProjectId,
                        request.StartDate.Value,
                        request.EndDate.Value,
                        sprintId
                    );

                    if (hasOverlap)
                    {
                        return new ApiResponse<SprintDTO>
                        {
                            Success = false,
                            Message = "Updated dates would overlap with another sprint",
                            StatusCode = 400,
                        };
                    }

                    sprint.StartDate = request.StartDate.Value;
                    sprint.EndDate = request.EndDate.Value;
                }

                if (request.TotalStoryPoints.HasValue)
                    sprint.TotalStoryPoints = request.TotalStoryPoints.Value;

                if (request.Status.HasValue)
                    sprint.Status = request.Status.Value;

                if (request.Notes != null)
                    sprint.Notes = request.Notes;

                sprint.UpdatedDate = DateTime.UtcNow;
                sprint.UpdatedBy = user.Email;

                await _sprintRepository.UpdateAsync(sprint);

                _logger.LogInformation(
                    "Sprint updated: {SprintName} by {UserEmail}",
                    sprint.Name,
                    user.Email
                );

                var updatedSprint = await _sprintRepository.GetByIdWithDetailsAsync(sprintId);
                if (updatedSprint == null)
                {
                    return new ApiResponse<SprintDTO>
                    {
                        Success = false,
                        Message = "Failed to retrieve updated sprint",
                        StatusCode = 500,
                    };
                }
                return new ApiResponse<SprintDTO>
                {
                    Success = true,
                    Message = "Sprint updated successfully",
                    Data = MapToDTO(updatedSprint),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating sprint. SprintId={SprintId}", sprintId);
                return new ApiResponse<SprintDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteSprintAsync(Guid sprintId, Guid userId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);

                // Only Project Manager and Admin can delete sprints
                if (!user.Role.CanManageProjects())
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only Project Managers and Admins can delete sprints",
                        StatusCode = 403,
                    };
                }

                await _sprintRepository.DeleteAsync(sprintId);

                _logger.LogInformation(
                    "Sprint deleted: {SprintName} by {UserEmail}",
                    sprint.Name,
                    user.Email
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Sprint cancelled successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting sprint. SprintId={SprintId}", sprintId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> StartSprintAsync(Guid sprintId, Guid userId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);

                // Only Project Manager can start sprints
                if (user.Role != UserRole.ProjectManager)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only Project Managers can start sprints",
                        StatusCode = 403,
                    };
                }

                if (sprint.Status != SprintStatus.Planned)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only planned sprints can be started",
                        StatusCode = 400,
                    };
                }

                // Check if there's already an active sprint for this project
                var activeSprint = await _sprintRepository.GetActiveSprintByProjectIdAsync(
                    sprint.ProjectId
                );
                if (activeSprint != null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "There is already an active sprint for this project",
                        StatusCode = 400,
                    };
                }

                sprint.Status = SprintStatus.Active;
                sprint.ActualStartDate = DateTime.UtcNow;
                sprint.UpdatedDate = DateTime.UtcNow;
                sprint.UpdatedBy = user.Email;

                await _sprintRepository.UpdateAsync(sprint);

                _logger.LogInformation(
                    "Sprint started: {SprintName} by {UserEmail}",
                    sprint.Name,
                    user.Email
                );

                // TODO: Send email notification
                // await _emailService.SendSprintStartedEmail(sprint);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Sprint started successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting sprint. SprintId={SprintId}", sprintId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> CompleteSprintAsync(Guid sprintId, Guid userId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdWithDetailsAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);

                // Only Project Manager and Admin can complete sprints
                if (!user.Role.CanManageProjects())
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only Project Managers and Admins can complete sprints",
                        StatusCode = 403,
                    };
                }

                if (sprint.Status != SprintStatus.Active)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only active sprints can be completed",
                        StatusCode = 400,
                    };
                }

                // Calculate completed story points from tasks
                var completedPoints =
                    sprint.Tasks?.Where(t => t.Status == TaskStatuses.Done).Sum(t => t.StoryPoints)
                    ?? 0;

                sprint.Status = SprintStatus.Completed;
                sprint.ActualEndDate = DateTime.UtcNow;
                sprint.CompletedStoryPoints = completedPoints;
                sprint.UpdatedDate = DateTime.UtcNow;
                sprint.UpdatedBy = user.Email;

                await _sprintRepository.UpdateAsync(sprint);

                _logger.LogInformation(
                    "Sprint completed: {SprintName} by {UserEmail}",
                    sprint.Name,
                    user.Email
                );

                // TODO: Send email notification
                // await _emailService.SendSprintCompletedEmail(sprint);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Sprint completed successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing sprint. SprintId={SprintId}", sprintId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<SprintStatsDTO>> GetSprintStatsAsync(Guid sprintId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdWithDetailsAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<SprintStatsDTO>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var tasks = sprint.Tasks?.ToList() ?? new List<WorkTask>();

                var totalTasks = tasks.Count;
                var completedTasks = tasks.Count(t => t.Status == TaskStatuses.Done);
                var inProgressTasks = tasks.Count(t => t.Status == TaskStatuses.InProgress);

                var completedStoryPoints = tasks
                    .Where(t => t.Status == TaskStatuses.Done)
                    .Sum(t => t.StoryPoints);

                var tasksByStatus = tasks
                    .GroupBy(t => t.Status.GetDisplayName())
                    .ToDictionary(g => g.Key, g => g.Count());

                var tasksByPriority = tasks
                    .GroupBy(t => t.Priority.ToString())
                    .ToDictionary(g => g.Key, g => g.Count());

                var memberProgress =
                    sprint
                        .SprintMembers?.Select(sm =>
                        {
                            var memberTasks = tasks
                                .Where(t => t.AssignedToUserId == sm.UserId)
                                .ToList();
                            var completed = memberTasks.Count(t => t.Status == TaskStatuses.Done);
                            var completedPoints = memberTasks
                                .Where(t => t.Status == TaskStatuses.Done)
                                .Sum(t => t.StoryPoints);

                            return new TeamMemberProgressDTO
                            {
                                UserId = sm.UserId,
                                UserName = sm.User?.DisplayName,
                                AssignedTasks = memberTasks.Count,
                                CompletedTasks = completed,
                                AllocatedStoryPoints = sm.AllocatedStoryPoints,
                                CompletedStoryPoints = completedPoints,
                                CompletionPercentage =
                                    sm.AllocatedStoryPoints > 0
                                        ? (decimal)completedPoints / sm.AllocatedStoryPoints * 100
                                        : 0,
                            };
                        })
                        .ToList()
                    ?? new List<TeamMemberProgressDTO>();

                var durationDays = Math.Max(
                    1,
                    (int)Math.Ceiling((sprint.EndDate - sprint.StartDate).TotalDays)
                );
                var velocity = durationDays > 0 ? (decimal)completedStoryPoints / durationDays : 0;

                var completedTasksWithTime = tasks.Where(t =>
                    t.Status == TaskStatuses.Done
                    && t.ActualStartDate.HasValue
                    && t.CompletedDate.HasValue
                );

                var avgCompletionTime = completedTasksWithTime.Any()
                    ? (decimal)
                        completedTasksWithTime.Average(t =>
                            (t.CompletedDate.Value - t.ActualStartDate.Value).TotalHours
                        )
                    : 0;

                var stats = new SprintStatsDTO
                {
                    SprintId = sprintId,
                    SprintName = sprint.Name,
                    TotalStoryPoints = sprint.TotalStoryPoints,
                    CompletedStoryPoints = completedStoryPoints,
                    RemainingStoryPoints = sprint.TotalStoryPoints - completedStoryPoints,
                    TotalTasks = totalTasks,
                    CompletedTasks = completedTasks,
                    InProgressTasks = inProgressTasks,
                    TeamVelocity = velocity,
                    AverageTaskCompletionTime = avgCompletionTime,
                    TasksByStatus = tasksByStatus,
                    TasksByPriority = tasksByPriority,
                    MemberProgress = memberProgress,
                };

                return new ApiResponse<SprintStatsDTO>
                {
                    Success = true,
                    Data = stats,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sprint stats. SprintId={SprintId}", sprintId);
                return new ApiResponse<SprintStatsDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> AddSprintMemberAsync(
            Guid sprintId,
            SprintMemberCreateRequest request,
            Guid userId
        )
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Only Project Manager and Admin can add members
                if (!user.Role.CanManageProjects())
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only Project Managers and Admins can add sprint members",
                        StatusCode = 403,
                    };
                }

                // Check if member already exists
                var existingMember = await _sprintRepository.GetSprintMemberAsync(
                    sprintId,
                    request.UserId
                );
                if (existingMember != null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "User is already a member of this sprint",
                        StatusCode = 400,
                    };
                }

                var member = new SprintMember
                {
                    SprintMemberId = Guid.NewGuid(),
                    SprintId = sprintId,
                    UserId = request.UserId,
                    AvailableHoursPerWeek = request.AvailableHoursPerWeek,
                    AllocatedStoryPoints = request.AllocatedStoryPoints,
                    CreatedDate = DateTime.UtcNow,
                };

                await _sprintRepository.AddSprintMemberAsync(member);

                _logger.LogInformation(
                    "Member added to sprint {SprintId}: User {UserId}",
                    sprintId,
                    request.UserId
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Member added to sprint successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding sprint member. SprintId={SprintId}", sprintId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> RemoveSprintMemberAsync(
            Guid sprintId,
            Guid userIdToRemove,
            Guid requestingUserId
        )
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var requestingUser = await _userRepository.GetByIdAsync(requestingUserId);

                // Only Project Manager and Admin can remove members
                if (!requestingUser.Role.CanManageProjects())
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only Project Managers and Admins can remove sprint members",
                        StatusCode = 403,
                    };
                }

                await _sprintRepository.RemoveSprintMemberAsync(sprintId, userIdToRemove);

                _logger.LogInformation(
                    "Member removed from sprint {SprintId}: User {UserId}",
                    sprintId,
                    userIdToRemove
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Member removed from sprint successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing sprint member. SprintId={SprintId}", sprintId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<SprintTimeSummaryDTO>> GetSprintTimeSummaryAsync(
            Guid sprintId,
            Guid userId
        )
        {
            var sprint = await _sprintRepository.GetByIdWithDetailsAsync(sprintId);
            if (sprint == null)
            {
                return new ApiResponse<SprintTimeSummaryDTO>
                {
                    Success = false,
                    Message = "Sprint not found",
                    StatusCode = 404,
                };
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return new ApiResponse<SprintTimeSummaryDTO>
                {
                    Success = false,
                    Message = "User not found",
                    StatusCode = 404,
                };
            }

            if (!user.Role.CanManageProjects())
            {
                return new ApiResponse<SprintTimeSummaryDTO>
                {
                    Success = false,
                    Message = "Access denied",
                    StatusCode = 403,
                };
            }

            return new ApiResponse<SprintTimeSummaryDTO>
            {
                Success = true,
                Data = BuildTimeSummary(sprint),
                StatusCode = 200,
            };
        }

        private static SprintTimeSummaryDTO BuildTimeSummary(Sprint sprint)
        {
            var durationDays = Math.Max(
                1,
                (int)Math.Ceiling((sprint.EndDate - sprint.StartDate).TotalDays)
            );
            var weeks = durationDays / 7m;

            var totalPlannedHours =
                sprint.SprintMembers?.Sum(sm => sm.AvailableHoursPerWeek * weeks) ?? 0;

            var loggedHours =
                sprint
                    .Tasks?.SelectMany(t => t.TimeLogs ?? new List<TaskTimeLog>())
                    .Sum(tl => tl.HoursLogged)
                ?? 0;

            var rawRemainingHours = totalPlannedHours - loggedHours;
            var remainingHours = Math.Max(0, rawRemainingHours);

            var utilization = totalPlannedHours > 0 ? (loggedHours / totalPlannedHours) * 100 : 0;

            TimeSpan? elapsed = sprint.ActualStartDate.HasValue
                ? (sprint.ActualEndDate ?? DateTime.UtcNow) - sprint.ActualStartDate.Value
                : null;

            TimeSpan? remainingTime =
                sprint.Status == SprintStatus.Active
                    ? TimeSpan.FromSeconds(
                        Math.Max(0, (sprint.EndDate - DateTime.UtcNow).TotalSeconds)
                    )
                    : null;

            return new SprintTimeSummaryDTO
            {
                DurationDays = durationDays,
                TotalPlannedHours = totalPlannedHours,
                LoggedHours = loggedHours,
                RemainingHours = remainingHours,
                TimeUtilizationPercentage = Math.Min(utilization, 100),
                IsOverAllocated = rawRemainingHours < 0,
                ActualStartDate = sprint.ActualStartDate,
                ActualEndDate = sprint.ActualEndDate,
                ElapsedTime = elapsed,
                RemainingTime = remainingTime,
            };
        }

        public async Task<ApiResponse<SprintBurndownDTO>> GetSprintBurndownAsync(Guid sprintId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdWithDetailsAsync(sprintId);
                if (sprint == null)
                {
                    return new ApiResponse<SprintBurndownDTO>
                    {
                        Success = false,
                        Message = "Sprint not found",
                        StatusCode = 404,
                    };
                }

                var tasks = sprint.Tasks?.ToList() ?? new List<WorkTask>();
                
                var totalStoryPoints = sprint.TotalStoryPoints;
                var durationDays = Math.Max(1, (int)Math.Ceiling((sprint.EndDate - sprint.StartDate).TotalDays));
                var idealBurndownRate = durationDays > 0 ? (decimal)totalStoryPoints / durationDays : 0;

                var dataPoints = new List<BurndownDataPoint>();
                var startDate = sprint.ActualStartDate ?? sprint.StartDate;
                var endDate = sprint.Status == SprintStatus.Active ? DateTime.UtcNow : (sprint.ActualEndDate ?? sprint.EndDate);

                // Group tasks by completion date
                var completedTasksByDate = tasks
                    .Where(t => t.CompletedDate.HasValue && t.Status == TaskStatuses.Done)
                    .GroupBy(t => t.CompletedDate!.Value.Date)
                    .ToDictionary(g => g.Key, g => g.Sum(t => t.StoryPoints));

                var currentDate = startDate.Date;
                var remainingPoints = totalStoryPoints;
                decimal idealRemaining = totalStoryPoints;

                while (currentDate <= endDate.Date && currentDate <= sprint.EndDate.Date)
                {
                    // Calculate completed points up to this date
                    var completedUpToDate = tasks
                        .Where(t => t.CompletedDate.HasValue && 
                                   t.CompletedDate.Value.Date <= currentDate && 
                                   t.Status == TaskStatuses.Done)
                        .Sum(t => t.StoryPoints);

                    remainingPoints = totalStoryPoints - completedUpToDate;
                    idealRemaining = Math.Max(0, totalStoryPoints - (idealBurndownRate * (currentDate - startDate.Date).Days));

                    var tasksCompletedOnDate = tasks.Count(t => 
                        t.CompletedDate.HasValue && 
                        t.CompletedDate.Value.Date == currentDate && 
                        t.Status == TaskStatuses.Done);

                    dataPoints.Add(new BurndownDataPoint
                    {
                        Date = currentDate,
                        RemainingStoryPoints = remainingPoints,
                        IdealRemainingStoryPoints = (int)Math.Round(idealRemaining, MidpointRounding.AwayFromZero),
                        CompletedStoryPoints = completedUpToDate,
                        TasksCompleted = tasksCompletedOnDate
                    });

                    currentDate = currentDate.AddDays(1);
                }

                // Calculate actual burndown rate
                var actualDays = (endDate.Date - startDate.Date).Days;
                var actualBurndownRate = actualDays > 0 ? (decimal)sprint.CompletedStoryPoints / actualDays : 0;

                // Determine if on track (within 10% of ideal)
                var isOnTrack = Math.Abs(actualBurndownRate - idealBurndownRate) <= (idealBurndownRate * 0.1m);

                var burndown = new SprintBurndownDTO
                {
                    SprintId = sprintId,
                    SprintName = sprint.Name,
                    StartDate = startDate,
                    EndDate = sprint.EndDate,
                    TotalStoryPoints = totalStoryPoints,
                    DataPoints = dataPoints,
                    IdealBurndownRate = (int)Math.Round(idealBurndownRate, MidpointRounding.AwayFromZero),
                    ActualBurndownRate = actualBurndownRate,
                    IsOnTrack = isOnTrack
                };

                return new ApiResponse<SprintBurndownDTO>
                {
                    Success = true,
                    Data = burndown,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sprint burndown. SprintId={SprintId}", sprintId);
                return new ApiResponse<SprintBurndownDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        /// <summary>
        /// Maps a Sprint to SprintDTO using AutoMapper with runtime calculations.
        /// </summary>
        private SprintDTO MapToDTO(Sprint sprint)
        {
            var timeSummary = BuildTimeSummary(sprint);
            return sprint.ToSprintDTO(_mapper, timeSummary);
        }

        /// <summary>
        /// Checks if a user is allocated to the project that contains the specified sprint.
        /// </summary>
        public async Task<bool> IsUserAllocatedToSprintProjectAsync(Guid sprintId, Guid userId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint == null)
                {
                    return false;
                }

                return await _projectAllocationRepository.ExistsAsync(sprint.ProjectId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking user allocation for sprint. SprintId={SprintId}, UserId={UserId}", sprintId, userId);
                return false;
            }
        }
    }
}
