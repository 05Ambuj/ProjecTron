using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Mapping;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly IProjectRepository _projectRepository;
        private readonly ISprintRepository _sprintRepository;
        private readonly IProjectAllocationRepository _projectAllocationRepository;
        private readonly ILogger<TaskService> _logger;
        private readonly IMapper _mapper;
        private readonly ServiceBusNotificationService _notificationService;

        public TaskService(
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            IProjectRepository projectRepository,
            ISprintRepository sprintRepository,
            IProjectAllocationRepository projectAllocationRepository,
            ILogger<TaskService> logger,
            IMapper mapper,
            ServiceBusNotificationService notificationService
        )
        {
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _projectRepository = projectRepository;
            _sprintRepository = sprintRepository;
            _projectAllocationRepository = projectAllocationRepository;
            _logger = logger;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        public async Task<ApiResponse<TaskDTO>> CreateTaskAsync(
            Guid userId,
            TaskCreateRequest request
        )
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Only Team Lead and above can create tasks
                if (user.Role != UserRole.TeamLead && user.Role != UserRole.ProjectManager)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Only Team Leads and Project Managers can create tasks",
                        StatusCode = 403,
                    };
                }

                var project = await _projectRepository.GetByIdAsync(request.ProjectId);
                if (project == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Project not found",
                        StatusCode = 404,
                    };
                }

                // Verify user has access to this project's organization
                if (user.Role != UserRole.Admin && project.OrganizationId != user.OrganizationId)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "You don't have access to this project",
                        StatusCode = 403,
                    };
                }

                // Validate sprint (required)
                var sprint = await _sprintRepository.GetByIdAsync(request.SprintId);
                if (sprint == null)
                {
                    _logger.LogWarning(
                        "Sprint not found. SprintId={SprintId}, ProjectId={ProjectId}",
                        request.SprintId,
                        request.ProjectId
                    );
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = $"Sprint with ID {request.SprintId} not found",
                        StatusCode = 400,
                    };
                }

                if (sprint.ProjectId != request.ProjectId)
                {
                    _logger.LogWarning(
                        "Sprint does not belong to project. SprintId={SprintId}, SprintProjectId={SprintProjectId}, RequestProjectId={RequestProjectId}",
                        request.SprintId,
                        sprint.ProjectId,
                        request.ProjectId
                    );
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "The selected sprint does not belong to the selected project",
                        StatusCode = 400,
                    };
                }

                // Validate assigned user if provided
                if (request.AssignedToUserId.HasValue)
                {
                    var assignedUser = await _userRepository.GetByIdAsync(
                        request.AssignedToUserId.Value
                    );
                    if (assignedUser == null || !assignedUser.IsActive)
                    {
                        return new ApiResponse<TaskDTO>
                        {
                            Success = false,
                            Message = "Assigned user not found or inactive",
                            StatusCode = 400,
                        };
                    }

                    // Verify assigned user is in same organization
                    if (assignedUser.OrganizationId != project.OrganizationId)
                    {
                        return new ApiResponse<TaskDTO>
                        {
                            Success = false,
                            Message = "Cannot assign task to user from different organization",
                            StatusCode = 400,
                        };
                    }
                }

                var taskCode = await _taskRepository.GenerateTaskCodeAsync(request.ProjectId);

                var task = new WorkTask
                {
                    TaskId = Guid.NewGuid(),
                    ProjectId = request.ProjectId,
                    SprintId = request.SprintId,
                    TaskCode = taskCode,
                    Title = request.Title,
                    Description = request.Description,
                    TaskType = request.TaskType,
                    Priority = request.Priority,
                    Status = TaskStatuses.NotStarted,
                    Complexity = request.Complexity,
                    RiskLevel = request.RiskLevel,
                    StoryPoints = request.StoryPoints,
                    EstimatedHours = request.EstimatedHours,
                    AssignedToUserId = request.AssignedToUserId,
                    AssignedByUserId = userId,
                    ReviewerId = request.ReviewerId,
                    StartDate = request.StartDate,
                    DueDate = request.DueDate,
                    AcceptanceCriteria = request.AcceptanceCriteria ?? string.Empty,
                    EffortCategory = request.EffortCategory ?? string.Empty,
                    Attachments = string.Empty,
                    SkillsRequired = string.Empty,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = user.Email ?? user.DisplayName ?? "System",
                    UpdatedBy = string.Empty,
                };

                // Validate sprint capacity
                if (sprint != null)
                {
                    // Calculate current sprint capacity
                    var sprintMembers = await _sprintRepository.GetSprintMembersAsync(
                        sprint.SprintId
                    );
                    var totalCapacity = sprintMembers.Sum(sm => sm.AllocatedStoryPoints);
                    var currentStoryPoints = await _taskRepository.GetSprintTotalStoryPointsAsync(
                        sprint.SprintId
                    );
                    var newTotal = currentStoryPoints + request.StoryPoints;

                    // Check if adding this task would exceed sprint capacity
                    if (newTotal > totalCapacity && totalCapacity > 0)
                    {
                        return new ApiResponse<TaskDTO>
                        {
                            Success = false,
                            Message =
                                $"Adding this task would exceed sprint capacity. Current: {currentStoryPoints}, Capacity: {totalCapacity}, New Total: {newTotal}",
                            StatusCode = 400,
                        };
                    }

                    // Check individual member capacity if task is assigned
                    if (request.AssignedToUserId.HasValue)
                    {
                        var member = sprintMembers.FirstOrDefault(sm =>
                            sm.UserId == request.AssignedToUserId.Value
                        );
                        if (member != null)
                        {
                            var memberTasks = await _taskRepository.GetBySprintIdAsync(
                                sprint.SprintId
                            );
                            var memberCurrentPoints = memberTasks
                                .Where(t =>
                                    t.AssignedToUserId == request.AssignedToUserId.Value
                                    && t.Status != TaskStatuses.Cancelled
                                )
                                .Sum(t => t.StoryPoints);
                            var memberNewTotal = memberCurrentPoints + request.StoryPoints;

                            if (
                                memberNewTotal > member.AllocatedStoryPoints
                                && member.AllocatedStoryPoints > 0
                            )
                            {
                                return new ApiResponse<TaskDTO>
                                {
                                    Success = false,
                                    Message =
                                        $"Adding this task would exceed member capacity. Current: {memberCurrentPoints}, Allocated: {member.AllocatedStoryPoints}, New Total: {memberNewTotal}",
                                    StatusCode = 400,
                                };
                            }
                        }
                    }
                }

                // Log task details before saving
                _logger.LogInformation(
                    "Creating task. TaskId={TaskId}, ProjectId={ProjectId}, SprintId={SprintId}, TaskCode={TaskCode}, Title={Title}",
                    task.TaskId,
                    task.ProjectId,
                    task.SprintId,
                    task.TaskCode,
                    task.Title
                );

                await _taskRepository.CreateAsync(task);

                _logger.LogInformation("Task saved successfully. TaskId={TaskId}", task.TaskId);

                // Auto-calculate sprint story points
                await RecalculateSprintStoryPointsAsync(request.SprintId);

                // Add dependencies if provided
                if (request.DependsOnTaskIds != null && request.DependsOnTaskIds.Any())
                {
                    foreach (var dependsOnTaskId in request.DependsOnTaskIds)
                    {
                        var dependency = new TaskDependency
                        {
                            TaskDependencyId = Guid.NewGuid(),
                            TaskId = task.TaskId,
                            DependsOnTaskId = dependsOnTaskId,
                            DependencyType = DependencyType.FinishToStart,
                            CreatedDate = DateTime.UtcNow,
                        };
                        await _taskRepository.AddDependencyAsync(dependency);
                    }
                }

                _logger.LogInformation(
                    "Task created: {TaskCode} by {UserEmail} for Project {ProjectId}",
                    taskCode,
                    user.Email,
                    request.ProjectId
                );

                // Send email notification if task is assigned
                if (request.AssignedToUserId.HasValue)
                {
                    var assignedUser = await _userRepository.GetByIdAsync(request.AssignedToUserId.Value);
                    if (assignedUser != null && !string.IsNullOrWhiteSpace(assignedUser.Email))
                    {
                        try
                        {
                            var templateData = new Dictionary<string, object>
                            {
                                ["AssignedToName"] = assignedUser.DisplayName,
                                ["TaskTitle"] = task.Title,
                                ["TaskCode"] = task.TaskCode,
                                ["ProjectName"] = project.Name,
                                ["Priority"] = task.Priority.ToString(),
                                ["DueDate"] = task.DueDate?.ToString("yyyy-MM-dd") ?? "Not set",
                                ["AssignerName"] = user.DisplayName,
                                ["PriorityClass"] =
                                    task.Priority == TaskPriority.Critical ? "priority-critical"
                                    : task.Priority == TaskPriority.High ? "priority-high"
                                    : "",
                                ["TaskUrl"] = $"https://yourapp.com/tasks/{task.TaskId}"
                            };

                            _logger.LogInformation(
                                "Sending email notification for new task assignment. TaskId: {TaskId}, AssignedToEmail: {Email}",
                                task.TaskId,
                                assignedUser.Email
                            );

                            await _notificationService.SendEmailNotificationAsync(
                                "TaskAssigned",
                                "task-assigned",
                                request.AssignedToUserId.Value,
                                assignedUser.Email,
                                templateData,
                                $"Task {task.TaskCode} assigned to you"
                            );

                            _logger.LogInformation(
                                "Email notification sent for new task assignment. TaskId: {TaskId}, AssignedToEmail: {Email}",
                                task.TaskId,
                                assignedUser.Email
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError(
                                emailEx,
                                "ERROR sending email notification for new task assignment. TaskId: {TaskId}, Error: {ErrorMessage}",
                                task.TaskId,
                                emailEx.Message
                            );
                            // Don't throw - email failure shouldn't break task creation
                        }
                    }
                }

                var createdTask = await _taskRepository.GetByIdAsync(task.TaskId);
                if (createdTask == null)
                {
                    _logger.LogError(
                        "Task was created but could not be retrieved. TaskId={TaskId}",
                        task.TaskId
                    );
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Task was created but could not be retrieved",
                        StatusCode = 500,
                    };
                }

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Message = "Task created successfully",
                    Data = MapToDTO(createdTask),
                    StatusCode = 201,
                };
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                // Extract inner exception message for database constraint violations
                var innerException = dbEx.InnerException?.Message ?? dbEx.Message;
                _logger.LogError(
                    dbEx,
                    "Database error creating task. UserId={UserId}, ProjectId={ProjectId}, SprintId={SprintId}, InnerException={InnerException}",
                    userId,
                    request.ProjectId,
                    request.SprintId,
                    innerException
                );

                // Check for common constraint violations
                string userMessage = "An error occurred while saving the task";
                if (
                    innerException.Contains("FOREIGN KEY") || innerException.Contains("foreign key")
                )
                {
                    if (innerException.Contains("SprintId") || innerException.Contains("Sprint"))
                    {
                        userMessage =
                            "Invalid sprint selected. Please select a valid sprint for this project.";
                    }
                    else if (
                        innerException.Contains("ProjectId") || innerException.Contains("Project")
                    )
                    {
                        userMessage = "Invalid project selected. Please select a valid project.";
                    }
                    else if (
                        innerException.Contains("AssignedToUserId")
                        || innerException.Contains("User")
                    )
                    {
                        userMessage =
                            "Invalid user assignment. The selected user may not exist or be inactive.";
                    }
                }
                else if (innerException.Contains("UNIQUE") || innerException.Contains("unique"))
                {
                    userMessage = "A task with this code already exists. Please try again.";
                }
                else if (innerException.Contains("NOT NULL") || innerException.Contains("required"))
                {
                    userMessage =
                        "Required fields are missing. Please check all required fields are filled.";
                }

                return new ApiResponse<TaskDTO>
                {
                    Success = false,
                    Message = $"{userMessage}. Details: {innerException}",
                    StatusCode = 400,
                };
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? ex.Message;
                _logger.LogError(
                    ex,
                    "Error creating task. UserId={UserId}, ProjectId={ProjectId}, SprintId={SprintId}, Exception={ExceptionMessage}, InnerException={InnerException}, StackTrace={StackTrace}",
                    userId,
                    request.ProjectId,
                    request.SprintId,
                    ex.Message,
                    innerException,
                    ex.StackTrace
                );
                return new ApiResponse<TaskDTO>
                {
                    Success = false,
                    Message = $"An error occurred while creating the task: {innerException}",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<TaskDTO>> GetTaskByIdAsync(Guid taskId)
        {
            try
            {
                var task = await _taskRepository.GetByIdWithDetailsAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Task not found",
                        StatusCode = 404,
                    };
                }

                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Data = MapToDTO(task),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task. TaskId={TaskId}", taskId);
                return new ApiResponse<TaskDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<PagedResponse<TaskDTO>>> GetTasksAsync(
            TaskFilterRequest filter,
            Guid userId,
            UserRole userRole,
            Guid? organizationId,
            List<Guid>? allowedProjectIds = null
        )
        {
            try
            {
                _logger.LogInformation(
                    "GetTasksAsync called for user {UserId} with role {UserRole}, organization {OrganizationId}",
                    userId,
                    userRole,
                    organizationId
                );
                _logger.LogInformation(
                    "Filter: ProjectId={ProjectId}, ProjectIds={ProjectIdsCount}, Status={Status}, Priority={Priority}",
                    filter.ProjectId,
                    filter.ProjectIds?.Count ?? 0,
                    filter.Status,
                    filter.Priority
                );

                if (userRole == UserRole.Admin)
                {
                    var (tasks, count) = await _taskRepository.GetPagedAsync(filter);
                    return BuildPagedResponse(tasks, count, filter);
                }

                if (userRole == UserRole.ProjectManager)
                {
                    var projectIds =
                        allowedProjectIds
                        ?? await _projectAllocationRepository.GetProjectIdsForUserAsync(userId);

                    _logger.LogInformation(
                        "PM {UserId} has access to {Count} allocated projects and checking managed projects",
                        userId,
                        projectIds.Count
                    );

                    // Get all accessible projects for PM (allocated + managed)
                    var allAccessibleProjects = await GetProjectIdsForProjectManagerAsync(userId);
                    _logger.LogInformation(
                        "PM {UserId} has access to {TotalCount} total projects: {ProjectIds}",
                        userId,
                        allAccessibleProjects.Count,
                        string.Join(", ", allAccessibleProjects)
                    );

                    if (!allAccessibleProjects.Any())
                    {
                        _logger.LogInformation(
                            "PM {UserId} has no project access, returning empty",
                            userId
                        );
                        return BuildPagedResponse(new List<WorkTask>(), 0, filter);
                    }

                    // If no specific project requested, show tasks from all allowed projects
                    if (!filter.ProjectId.HasValue)
                    {
                        filter.ProjectIds = allAccessibleProjects;
                        _logger.LogInformation(
                            "PM {UserId} requesting all projects, setting ProjectIds filter",
                            userId
                        );
                    }
                    // If specific project requested, check access and filter by that project
                    else
                    {
                        _logger.LogInformation(
                            "PM {UserId} requesting specific project {ProjectId}",
                            userId,
                            filter.ProjectId.Value
                        );

                        if (!allAccessibleProjects.Contains(filter.ProjectId.Value))
                        {
                            _logger.LogWarning(
                                "PM {UserId} does not have access to project {ProjectId}. Accessible projects: {Accessible}",
                                userId,
                                filter.ProjectId.Value,
                                string.Join(", ", allAccessibleProjects)
                            );
                            return new ApiResponse<PagedResponse<TaskDTO>>
                            {
                                Success = false,
                                Message = "Access denied to this project",
                                StatusCode = 403,
                            };
                        }
                        _logger.LogInformation(
                            "PM {UserId} has access to project {ProjectId}, proceeding with ProjectId filter",
                            userId,
                            filter.ProjectId.Value
                        );
                        // Filter will use ProjectId filter in repository
                    }
                }
                else if (filter.ProjectId.HasValue)
                {
                    var project = await _projectRepository.GetByIdAsync(filter.ProjectId.Value);
                    if (project == null || project.OrganizationId != organizationId)
                    {
                        return new ApiResponse<PagedResponse<TaskDTO>>
                        {
                            Success = false,
                            Message = "Access denied to this project",
                            StatusCode = 403,
                        };
                    }
                }

                var (filteredTasks, filteredCount) = await _taskRepository.GetPagedAsync(filter);
                return BuildPagedResponse(filteredTasks, filteredCount, filter);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tasks");
                return new ApiResponse<PagedResponse<TaskDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        private ApiResponse<PagedResponse<TaskDTO>> BuildPagedResponse(
            List<WorkTask> tasks,
            int totalCount,
            TaskFilterRequest filter
        )
        {
            var dtos = tasks.Select(MapToDTO).ToList();

            return new ApiResponse<PagedResponse<TaskDTO>>
            {
                Success = true,
                Data = new PagedResponse<TaskDTO>
                {
                    Items = dtos,
                    TotalCount = totalCount,
                    Page = filter.PageNumber,
                    PageSize = filter.PageSize,
                },
                StatusCode = 200,
            };
        }

        public async Task<ApiResponse<List<TaskDTO>>> GetMyTasksAsync(Guid userId)
        {
            try
            {
                var tasks = await _taskRepository.GetByUserIdAsync(userId);
                var dtos = tasks.Select(MapToDTO).ToList();

                return new ApiResponse<List<TaskDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user tasks. UserId={UserId}", userId);
                return new ApiResponse<List<TaskDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<TaskDTO>> UpdateTaskAsync(
            Guid taskId,
            TaskUpdateRequest request,
            Guid userId
        )
        {
            try
            {
                var task = await _taskRepository.GetByIdAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Task not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Only task creator, assigned user, team lead, PM, or admin can update
                bool canUpdate =
                    user.Role == UserRole.Admin
                    || user.Role == UserRole.ProjectManager
                    || user.Role.CanAssignWork()
                    || task.AssignedByUserId == userId
                    || task.AssignedToUserId == userId;

                if (!canUpdate)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "You don't have permission to update this task",
                        StatusCode = 403,
                    };
                }

                // Update fields
                if (!string.IsNullOrWhiteSpace(request.Title))
                    task.Title = request.Title;

                if (!string.IsNullOrWhiteSpace(request.Description))
                    task.Description = request.Description;

                if (request.TaskType.HasValue)
                    task.TaskType = request.TaskType.Value;

                if (request.Priority.HasValue)
                    task.Priority = request.Priority.Value;

                if (request.Complexity.HasValue)
                    task.Complexity = request.Complexity.Value;

                if (request.RiskLevel.HasValue)
                    task.RiskLevel = request.RiskLevel.Value;

                if (request.StoryPoints.HasValue)
                    task.StoryPoints = request.StoryPoints.Value;

                if (request.EstimatedHours.HasValue)
                    task.EstimatedHours = request.EstimatedHours.Value;

                // Track if assignee changed for notification
                var oldAssigneeId = task.AssignedToUserId;
                var assigneeChanged = false;

                if (request.AssignedToUserId.HasValue)
                {
                    if (request.AssignedToUserId.Value != task.AssignedToUserId)
                    {
                        assigneeChanged = true;
                        var newAssignee = await _userRepository.GetByIdAsync(request.AssignedToUserId.Value);
                        if (newAssignee == null || !newAssignee.IsActive)
                        {
                            return new ApiResponse<TaskDTO>
                            {
                                Success = false,
                                Message = "Assigned user not found or inactive",
                                StatusCode = 400,
                            };
                        }

                        // Verify assigned user is in same organization
                        var project = await _projectRepository.GetByIdAsync(task.ProjectId);
                        if (project != null && newAssignee.OrganizationId != project.OrganizationId)
                        {
                            return new ApiResponse<TaskDTO>
                            {
                                Success = false,
                                Message = "Cannot assign task to user from different organization",
                                StatusCode = 400,
                            };
                        }
                    }
                    task.AssignedToUserId = request.AssignedToUserId;
                }

                if (request.ReviewerId.HasValue)
                    task.ReviewerId = request.ReviewerId;

                if (request.StartDate.HasValue)
                    task.StartDate = request.StartDate;

                if (request.DueDate.HasValue)
                    task.DueDate = request.DueDate;

                if (request.AcceptanceCriteria != null)
                    task.AcceptanceCriteria = request.AcceptanceCriteria;

                if (request.EffortCategory != null)
                    task.EffortCategory = request.EffortCategory;

                if (request.ActualHours.HasValue)
                    task.ActualHours = request.ActualHours.Value;

                var oldSprintId = task.SprintId;
                var oldStoryPoints = task.StoryPoints;

                task.UpdatedDate = DateTime.UtcNow;
                task.UpdatedBy = user.Email;

                await _taskRepository.UpdateAsync(task);

                // Send notification if assignee changed
                if (assigneeChanged && request.AssignedToUserId.HasValue)
                {
                    var assignedUser = await _userRepository.GetByIdAsync(request.AssignedToUserId.Value);
                    if (assignedUser != null && !string.IsNullOrWhiteSpace(assignedUser.Email))
                    {
                        try
                        {
                            var project = await _projectRepository.GetByIdAsync(task.ProjectId);
                            var templateData = new Dictionary<string, object>
                            {
                                ["AssignedToName"] = assignedUser.DisplayName,
                                ["TaskTitle"] = task.Title,
                                ["TaskCode"] = task.TaskCode,
                                ["ProjectName"] = project?.Name ?? "Unknown",
                                ["Priority"] = task.Priority.ToString(),
                                ["DueDate"] = task.DueDate?.ToString("yyyy-MM-dd") ?? "Not set",
                                ["AssignerName"] = user.DisplayName,
                                ["PriorityClass"] =
                                    task.Priority == TaskPriority.Critical ? "priority-critical"
                                    : task.Priority == TaskPriority.High ? "priority-high"
                                    : "",
                                ["TaskUrl"] = $"https://yourapp.com/tasks/{taskId}"
                            };

                            _logger.LogInformation(
                                "Sending email notification for task reassignment. TaskId: {TaskId}, AssignedToEmail: {Email}",
                                taskId,
                                assignedUser.Email
                            );

                            await _notificationService.SendEmailNotificationAsync(
                                "TaskAssigned",
                                "task-assigned",
                                request.AssignedToUserId.Value,
                                assignedUser.Email,
                                templateData,
                                $"Task {task.TaskCode} assigned to you"
                            );

                            _logger.LogInformation(
                                "Email notification sent for task reassignment. TaskId: {TaskId}, AssignedToEmail: {Email}",
                                taskId,
                                assignedUser.Email
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError(
                                emailEx,
                                "ERROR sending email notification for task reassignment. TaskId: {TaskId}, Error: {ErrorMessage}",
                                taskId,
                                emailEx.Message
                            );
                            // Don't throw - email failure shouldn't break the update
                        }
                    }
                }

                // Recalculate sprint story points if sprint changed or story points changed
                if (oldSprintId.HasValue)
                {
                    await RecalculateSprintStoryPointsAsync(oldSprintId.Value);
                }
                if (
                    task.SprintId.HasValue
                    && (
                        task.SprintId != oldSprintId
                        || (
                            request.StoryPoints.HasValue
                            && request.StoryPoints.Value != oldStoryPoints
                        )
                    )
                )
                {
                    await RecalculateSprintStoryPointsAsync(task.SprintId.Value);
                }

                _logger.LogInformation(
                    "Task updated: {TaskCode} by {UserEmail}",
                    task.TaskCode,
                    user.Email
                );

                var updatedTask = await _taskRepository.GetByIdAsync(taskId);
                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Message = "Task updated successfully",
                    Data = updatedTask != null ? MapToDTO(updatedTask) : null,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task. TaskId={TaskId}", taskId);
                return new ApiResponse<TaskDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteTaskAsync(Guid taskId, Guid userId)
        {
            try
            {
                var task = await _taskRepository.GetByIdAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Task not found",
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

                // Permission logic:
                // - Admin: can delete any task
                // - ProjectManager: can delete any task
                // - TeamLead: can delete any task
                // - TeamMember: can ONLY delete tasks they created
                bool canDelete =
                    user.Role == UserRole.Admin
                    || user.Role == UserRole.ProjectManager
                    || user.Role == UserRole.TeamLead;

                // TeamMember can only delete tasks they created
                if (!canDelete && user.Role == UserRole.TeamMember)
                {
                    canDelete = task.AssignedByUserId == userId;
                }

                if (!canDelete)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message =
                            user.Role == UserRole.TeamMember
                                ? "Team members can only delete tasks they created"
                                : "You don't have permission to delete this task",
                        StatusCode = 403,
                    };
                }

                var sprintId = task.SprintId;
                await _taskRepository.DeleteAsync(taskId);

                // Recalculate sprint story points if task was in a sprint
                if (sprintId.HasValue)
                {
                    await RecalculateSprintStoryPointsAsync(sprintId.Value);
                }

                _logger.LogInformation(
                    "Task deleted: {TaskCode} by {UserEmail}",
                    task.TaskCode,
                    user.Email
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Task deleted successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task. TaskId={TaskId}", taskId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<TaskDTO>> AssignTaskAsync(
            Guid taskId,
            TaskAssignmentRequest request,
            Guid userId
        )
        {
            try
            {
                var task = await _taskRepository.GetByIdAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Task not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Only team lead, PM can assign tasks
                if (user.Role != UserRole.TeamLead && user.Role != UserRole.ProjectManager)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Only Team Leads and Project Managers can create tasks",
                        StatusCode = 403,
                    };
                }

                var assignedUser = await _userRepository.GetByIdAsync(request.AssignedToUserId);
                if (assignedUser == null || !assignedUser.IsActive)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Assigned user not found or inactive",
                        StatusCode = 400,
                    };
                }

                task.AssignedToUserId = request.AssignedToUserId;
                task.ReviewerId = request.ReviewerId;
                task.UpdatedDate = DateTime.UtcNow;
                task.UpdatedBy = user.Email;

                await _taskRepository.UpdateAsync(task);

                // Add assignment comment
                if (!string.IsNullOrWhiteSpace(request.AssignmentNote))
                {
                    var comment = new TaskComment
                    {
                        CommentId = Guid.NewGuid(),
                        TaskId = taskId,
                        UserId = userId,
                        Text =
                            $"Task assigned to {assignedUser.DisplayName}. Note: {request.AssignmentNote}",
                        CommentType = CommentType.StatusUpdate,
                        CreatedDate = DateTime.UtcNow,
                    };
                    await _taskRepository.AddCommentAsync(comment);
                }

                _logger.LogInformation(
                    "Task {TaskCode} assigned to {AssignedUser} by {AssignerEmail}",
                    task.TaskCode,
                    assignedUser.Email,
                    user.Email
                );

                // Send email notification
                _logger.LogInformation(
                    "Preparing to send 'task-assigned' email notification. TaskId: {TaskId}, AssignedToUserId: {AssignedToUserId}, AssignedToEmail: {AssignedToEmail}",
                    taskId,
                    request.AssignedToUserId,
                    assignedUser.Email
                );

                if (string.IsNullOrWhiteSpace(assignedUser.Email))
                {
                    _logger.LogWarning(
                        "Cannot send email notification: Assigned user email is null or empty. TaskId: {TaskId}, AssignedToUserId: {AssignedToUserId}",
                        taskId,
                        request.AssignedToUserId
                    );
                }
                else
                {
                    var project = await _projectRepository.GetByIdAsync(task.ProjectId);
                    var templateData = new Dictionary<string, object>
                    {
                        ["AssignedToName"] = assignedUser.DisplayName,
                        ["TaskTitle"] = task.Title,
                        ["TaskCode"] = task.TaskCode,
                        ["ProjectName"] = project?.Name ?? "Unknown",
                        ["Priority"] = task.Priority.ToString(),
                        ["DueDate"] = task.DueDate?.ToString("yyyy-MM-dd") ?? "Not set",
                        ["AssignerName"] = user.DisplayName,
                        ["PriorityClass"] =
                            task.Priority == TaskPriority.Critical ? "priority-critical"
                            : task.Priority == TaskPriority.High ? "priority-high"
                            : "",
                        ["TaskUrl"] = $"https://yourapp.com/tasks/{taskId}" // Update with your actual URL
                    };
                    _logger.LogInformation(
                        "Calling SendEmailNotificationAsync for 'task-assigned'. AssignedToEmail: {AssignedToEmail}, TemplateDataKeys: {Keys}",
                        assignedUser.Email,
                        string.Join(", ", templateData.Keys)
                    );
                    await _notificationService.SendEmailNotificationAsync(
                        "TaskAssigned",
                        "task-assigned",
                        request.AssignedToUserId,
                        assignedUser.Email,
                        templateData
                    );
                    _logger.LogInformation(
                        "SendEmailNotificationAsync completed for 'task-assigned'. AssignedToEmail: {AssignedToEmail}",
                        assignedUser.Email
                    );
                }

                var updatedTask = await _taskRepository.GetByIdAsync(taskId);
                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Message = "Task assigned successfully",
                    Data = updatedTask != null ? MapToDTO(updatedTask) : null,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning task. TaskId={TaskId}", taskId);
                return new ApiResponse<TaskDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<List<Guid>> GetProjectIdsForProjectManagerAsync(Guid userId)
        {
            // Get projects where PM has allocations
            var allocatedProjectIds = await _projectAllocationRepository.GetProjectIdsForUserAsync(
                userId
            );

            // Also get projects where PM is assigned as project manager
            var managedProjectIds = await _projectRepository.GetProjectIdsByProjectManagerIdAsync(
                userId
            );

            // Combine and deduplicate
            var allProjectIds = allocatedProjectIds.Union(managedProjectIds).ToList();

            _logger.LogInformation(
                "PM {UserId} has access to {AllocatedCount} allocated projects and {ManagedCount} managed projects, total {TotalCount}",
                userId,
                allocatedProjectIds.Count,
                managedProjectIds.Count,
                allProjectIds.Count
            );

            return allProjectIds;
        }

        public async Task<ApiResponse<TaskDTO>> UpdateTaskStatusAsync(
            Guid taskId,
            TaskStatusUpdateRequest request,
            Guid userId
        )
        {
            try
            {
                var task = await _taskRepository.GetByIdAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "Task not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Don't allow transitioning to the same status
                if (task.Status == request.NewStatus)
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = true,
                        Message = "Task is already in this status",
                        Data = MapToDTO(task),
                        StatusCode = 200,
                    };
                }

                // Validate status transition
                if (!task.Status.CanTransitionTo(request.NewStatus))
                {
                    return new ApiResponse<TaskDTO>
                    {
                        Success = false,
                        Message =
                            $"Cannot transition from {task.Status.GetDisplayName()} to {request.NewStatus.GetDisplayName()}",
                        StatusCode = 400,
                    };
                }

                // Validate dependencies before allowing status changes
                if (
                    request.NewStatus == TaskStatuses.InProgress
                    || request.NewStatus == TaskStatuses.Done
                )
                {
                    var dependencies = await _taskRepository.GetDependenciesAsync(taskId);
                    var blockingDependencies = new List<string>();

                    foreach (var dependency in dependencies)
                    {
                        var dependsOnTask = await _taskRepository.GetByIdAsync(
                            dependency.DependsOnTaskId
                        );
                        if (dependsOnTask == null)
                            continue;

                        bool isBlocked = false;
                        switch (dependency.DependencyType)
                        {
                            case DependencyType.FinishToStart:
                                // Can't start until dependency is done
                                if (
                                    request.NewStatus == TaskStatuses.InProgress
                                    && dependsOnTask.Status != TaskStatuses.Done
                                )
                                    isBlocked = true;
                                // Can't finish until dependency is done
                                if (
                                    request.NewStatus == TaskStatuses.Done
                                    && dependsOnTask.Status != TaskStatuses.Done
                                )
                                    isBlocked = true;
                                break;
                            case DependencyType.StartToStart:
                                // Can't start until dependency starts
                                if (
                                    request.NewStatus == TaskStatuses.InProgress
                                    && dependsOnTask.Status != TaskStatuses.InProgress
                                    && dependsOnTask.Status != TaskStatuses.Approved
                                    && dependsOnTask.Status != TaskStatuses.Done
                                )
                                    isBlocked = true;
                                break;
                            case DependencyType.FinishToFinish:
                                // Can't finish until dependency finishes
                                if (
                                    request.NewStatus == TaskStatuses.Done
                                    && dependsOnTask.Status != TaskStatuses.Done
                                )
                                    isBlocked = true;
                                break;
                            case DependencyType.StartToFinish:
                                // Can't finish until dependency starts
                                if (
                                    request.NewStatus == TaskStatuses.Done
                                    && dependsOnTask.Status == TaskStatuses.NotStarted
                                )
                                    isBlocked = true;
                                break;
                        }

                        if (isBlocked)
                        {
                            blockingDependencies.Add(
                                $"{dependsOnTask.TaskCode} ({dependsOnTask.Status.GetDisplayName()})"
                            );
                        }
                    }

                    if (blockingDependencies.Any())
                    {
                        return new ApiResponse<TaskDTO>
                        {
                            Success = false,
                            Message =
                                $"Cannot change status due to unresolved dependencies: {string.Join(", ", blockingDependencies)}",
                            StatusCode = 400,
                        };
                    }
                }

                // Special validations for certain status changes
                if (request.NewStatus == TaskStatuses.Approved)
                {
                    // Only reviewer or team lead can approve
                    if (task.ReviewerId != userId && !user.Role.CanAssignWork())
                    {
                        return new ApiResponse<TaskDTO>
                        {
                            Success = false,
                            Message = "Only the reviewer or team lead can approve",
                            StatusCode = 403,
                        };
                    }
                }

                var oldStatus = task.Status;
                task.Status = request.NewStatus;

                // Update timestamps based on status
                if (request.NewStatus == TaskStatuses.InProgress && !task.ActualStartDate.HasValue)
                {
                    task.ActualStartDate = DateTime.UtcNow;
                }
                else if (request.NewStatus == TaskStatuses.Done)
                {
                    task.CompletedDate = DateTime.UtcNow;
                    task.ProgressPercentage = 100;
                }

                if (request.ProgressPercentage.HasValue)
                {
                    task.ProgressPercentage = request.ProgressPercentage.Value;
                }

                task.UpdatedDate = DateTime.UtcNow;
                task.UpdatedBy = user.Email;

                await _taskRepository.UpdateAsync(task);

                // Add status change comment
                var statusComment = new TaskComment
                {
                    CommentId = Guid.NewGuid(),
                    TaskId = taskId,
                    UserId = userId,
                    Text =
                        $"Status changed from {oldStatus.GetDisplayName()} to {request.NewStatus.GetDisplayName()}"
                        + (
                            string.IsNullOrWhiteSpace(request.Comment)
                                ? ""
                                : $". Comment: {request.Comment}"
                        ),
                    CommentType = CommentType.StatusUpdate,
                    CreatedDate = DateTime.UtcNow,
                };
                await _taskRepository.AddCommentAsync(statusComment);

                // Log time if provided
                if (request.HoursLogged.HasValue && request.HoursLogged.Value > 0)
                {
                    var timeLog = new TaskTimeLog
                    {
                        TimeLogId = Guid.NewGuid(),
                        TaskId = taskId,
                        UserId = userId,
                        HoursLogged = request.HoursLogged.Value,
                        LogDate = DateTime.UtcNow,
                        Description =
                            $"Time logged during status update to {request.NewStatus.GetDisplayName()}",
                        CreatedDate = DateTime.UtcNow,
                    };
                    await _taskRepository.AddTimeLogAsync(timeLog);

                    task.ActualHours = await _taskRepository.GetTotalHoursLoggedAsync(taskId);
                    await _taskRepository.UpdateAsync(task);
                }

                _logger.LogInformation(
                    "Task {TaskCode} status changed from {OldStatus} to {NewStatus} by {UserEmail}",
                    task.TaskCode,
                    oldStatus,
                    request.NewStatus,
                    user.Email
                );

                // TODO: Send email notification based on status
                // await _emailService.SendTaskStatusChangeEmail(task, oldStatus, request.NewStatus);

                var updatedTask = await _taskRepository.GetByIdAsync(taskId);
                return new ApiResponse<TaskDTO>
                {
                    Success = true,
                    Message = "Task status updated successfully",
                    Data = updatedTask != null ? MapToDTO(updatedTask) : null,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error updating task status. TaskId={TaskId}, NewStatus={NewStatus}, UserId={UserId}",
                    taskId,
                    request.NewStatus,
                    userId
                );

                // Try to reload the task to see if it was actually updated
                try
                {
                    var currentTask = await _taskRepository.GetByIdAsync(taskId);
                    if (currentTask != null && currentTask.Status == request.NewStatus)
                    {
                        // Task was updated but an error occurred afterward (e.g., comment creation)
                        _logger.LogWarning(
                            "Task status was updated but error occurred during post-processing. TaskId={TaskId}",
                            taskId
                        );
                        return new ApiResponse<TaskDTO>
                        {
                            Success = true,
                            Message =
                                "Task status updated successfully (some post-processing may have failed)",
                            Data = MapToDTO(currentTask),
                            StatusCode = 200,
                        };
                    }
                }
                catch (Exception reloadEx)
                {
                    _logger.LogError(
                        reloadEx,
                        "Error reloading task after status update failure. TaskId={TaskId}",
                        taskId
                    );
                }

                return new ApiResponse<TaskDTO>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> LogTimeAsync(
            Guid taskId,
            TaskTimeLogRequest request,
            Guid userId
        )
        {
            try
            {
                var task = await _taskRepository.GetByIdAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Task not found",
                        StatusCode = 404,
                    };
                }
                // Only the user who is assigned to the task can log time of the task
                if (task.AssignedToUserId != userId)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only the assigned user can log time",
                        StatusCode = 403,
                    };
                }

                var timeLog = new TaskTimeLog
                {
                    TimeLogId = Guid.NewGuid(),
                    TaskId = taskId,
                    UserId = userId,
                    HoursLogged = request.HoursLogged,
                    LogDate = request.LogDate,
                    Description = request.Description,
                    CreatedDate = DateTime.UtcNow,
                };

                await _taskRepository.AddTimeLogAsync(timeLog);

                // Update task's actual hours
                task.ActualHours = await _taskRepository.GetTotalHoursLoggedAsync(taskId);
                task.UpdatedDate = DateTime.UtcNow;
                await _taskRepository.UpdateAsync(task);

                _logger.LogInformation(
                    "Time logged for task {TaskCode}: {Hours} hours by user {UserId}",
                    task.TaskCode,
                    request.HoursLogged,
                    userId
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Time logged successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging time. TaskId={TaskId}", taskId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<TaskCommentDTO>> AddCommentAsync(
            Guid taskId,
            TaskCommentRequest request,
            Guid userId
        )
        {
            try
            {
                var task = await _taskRepository.GetByIdAsync(taskId);
                if (task == null)
                {
                    return new ApiResponse<TaskCommentDTO>
                    {
                        Success = false,
                        Message = "Task not found",
                        StatusCode = 404,
                    };
                }

                // Check permissions: Assigned user, Team Lead, Project Manager, or Admin can add comments
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<TaskCommentDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                bool canComment =
                    user.Role == UserRole.Admin
                    || user.Role == UserRole.ProjectManager
                    || user.Role == UserRole.TeamLead
                    || task.AssignedToUserId == userId;

                if (!canComment)
                {
                    return new ApiResponse<TaskCommentDTO>
                    {
                        Success = false,
                        Message = "You don't have permission to add comments to this task",
                        StatusCode = 403,
                    };
                }

                var comment = new TaskComment
                {
                    CommentId = Guid.NewGuid(),
                    TaskId = taskId,
                    UserId = userId,
                    Text = request.Text,
                    CommentType = request.CommentType,
                    IsBlocking = request.IsBlocking,
                    TaggedUserId = request.TaggedUserId,
                    CodeSnippet = request.CodeSnippet ?? string.Empty, // Handle null
                    Attachments = string.Empty, // Initialize non-nullable field
                    UpdatedBy = string.Empty, // Initialize non-nullable field
                    CreatedDate = DateTime.UtcNow,
                };

                await _taskRepository.AddCommentAsync(comment);

                _logger.LogInformation(
                    "Comment added to task {TaskCode} by user {UserId}",
                    task.TaskCode,
                    userId
                );

                // TODO: Send email notification if user is tagged
                // if (request.TaggedUserId.HasValue)
                // {
                //     await _emailService.SendCommentNotificationEmail(task, comment);
                // }
                var commentDto = new TaskCommentDTO
                {
                    CommentId = comment.CommentId,
                    TaskId = taskId,
                    UserId = userId,
                    UserName = user.DisplayName,
                    Text = comment.Text,
                    CommentType = comment.CommentType,
                    IsBlocking = comment.IsBlocking,
                    IsResolved = comment.IsResolved,
                    TaggedUserId = comment.TaggedUserId,
                    CodeSnippet = comment.CodeSnippet,
                    CreatedDate = comment.CreatedDate,
                };

                return new ApiResponse<TaskCommentDTO>
                {
                    Success = true,
                    Message = "Comment added successfully",
                    Data = commentDto,
                    StatusCode = 201,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment. TaskId={TaskId}", taskId);
                return new ApiResponse<TaskCommentDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<TaskCommentDTO>> UpdateCommentAsync(
            Guid commentId,
            TaskCommentRequest request,
            Guid userId
        )
        {
            try
            {
                var comment = await _taskRepository.GetCommentByIdAsync(commentId);
                if (comment == null)
                {
                    return new ApiResponse<TaskCommentDTO>
                    {
                        Success = false,
                        Message = "Comment not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<TaskCommentDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // Only comment author, Admin, Project Manager, or Team Lead can edit
                bool canEdit =
                    comment.UserId == userId
                    || user.Role == UserRole.Admin
                    || user.Role == UserRole.ProjectManager
                    || user.Role == UserRole.TeamLead;

                if (!canEdit)
                {
                    return new ApiResponse<TaskCommentDTO>
                    {
                        Success = false,
                        Message = "You don't have permission to edit this comment",
                        StatusCode = 403,
                    };
                }

                comment.Text = request.Text;
                comment.CommentType = request.CommentType;
                comment.IsBlocking = request.IsBlocking;
                comment.TaggedUserId = request.TaggedUserId;
                comment.CodeSnippet = request.CodeSnippet ?? string.Empty;
                comment.UpdatedDate = DateTime.UtcNow;
                comment.UpdatedBy = user.Email ?? user.DisplayName ?? "System";

                await _taskRepository.UpdateCommentAsync(comment);

                _logger.LogInformation(
                    "Comment {CommentId} updated by user {UserId}",
                    commentId,
                    userId
                );

                var commentDto = new TaskCommentDTO
                {
                    CommentId = comment.CommentId,
                    TaskId = comment.TaskId,
                    UserId = comment.UserId,
                    UserName = comment.User?.DisplayName ?? string.Empty,
                    Text = comment.Text,
                    CommentType = comment.CommentType,
                    IsBlocking = comment.IsBlocking,
                    IsResolved = comment.IsResolved,
                    TaggedUserId = comment.TaggedUserId,
                    TaggedUserName = comment.TaggedUser?.DisplayName ?? string.Empty,
                    CodeSnippet = comment.CodeSnippet,
                    CreatedDate = comment.CreatedDate,
                    UpdatedDate = comment.UpdatedDate,
                };

                return new ApiResponse<TaskCommentDTO>
                {
                    Success = true,
                    Message = "Comment updated successfully",
                    Data = commentDto,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating comment. CommentId={CommentId}", commentId);
                return new ApiResponse<TaskCommentDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteCommentAsync(Guid commentId, Guid userId)
        {
            try
            {
                var comment = await _taskRepository.GetCommentByIdAsync(commentId);
                if (comment == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Comment not found",
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

                // Only comment author, Admin, Project Manager, or Team Lead can delete
                bool canDelete =
                    comment.UserId == userId
                    || user.Role == UserRole.Admin
                    || user.Role == UserRole.ProjectManager
                    || user.Role == UserRole.TeamLead;

                if (!canDelete)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "You don't have permission to delete this comment",
                        StatusCode = 403,
                    };
                }

                await _taskRepository.DeleteCommentAsync(commentId);

                _logger.LogInformation(
                    "Comment {CommentId} deleted by user {UserId}",
                    commentId,
                    userId
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Comment deleted successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment. CommentId={CommentId}", commentId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<List<TaskCommentDTO>>> GetTaskCommentsAsync(Guid taskId)
        {
            try
            {
                var comments = await _taskRepository.GetCommentsByTaskIdAsync(taskId);
                var dtos = comments
                    .Select(c => new TaskCommentDTO
                    {
                        CommentId = c.CommentId,
                        TaskId = c.TaskId,
                        UserId = c.UserId,
                        UserName = c.User?.DisplayName ?? string.Empty,
                        Text = c.Text,
                        CommentType = c.CommentType,
                        IsBlocking = c.IsBlocking,
                        IsResolved = c.IsResolved,
                        TaggedUserId = c.TaggedUserId,
                        TaggedUserName = c.TaggedUser?.DisplayName ?? string.Empty,
                        CodeSnippet = c.CodeSnippet ?? string.Empty,
                        CreatedDate = c.CreatedDate,
                        UpdatedDate = c.UpdatedDate,
                    })
                    .ToList();

                return new ApiResponse<List<TaskCommentDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments. TaskId={TaskId}", taskId);
                return new ApiResponse<List<TaskCommentDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<List<TaskDTO>>> GetOverdueTasksAsync(
            Guid? projectId,
            Guid? userId
        )
        {
            try
            {
                var tasks = await _taskRepository.GetOverdueTasksAsync(projectId, userId);
                var dtos = tasks.Select(MapToDTO).ToList();

                return new ApiResponse<List<TaskDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting overdue tasks");
                return new ApiResponse<List<TaskDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<TaskBoardDto>> GetTaskBoardAsync(
            Guid projectId,
            Guid userId,
            UserRole role,
            Guid? assignedToUserId = null
        )
        {
            if (role == UserRole.ProjectManager)
            {
                // Project Managers are assigned via ProjectManagerId, not ProjectAllocations
                var allowedProjects = await _projectRepository.GetProjectIdsByProjectManagerIdAsync(
                    userId
                );

                if (!allowedProjects.Contains(projectId))
                {
                    return new ApiResponse<TaskBoardDto>
                    {
                        Success = false,
                        Message = "Access denied",
                        StatusCode = 403,
                    };
                }
            }
            else if (role == UserRole.TeamLead || role == UserRole.TeamMember)
            {
                // Team Leads and Team Members are assigned via ProjectAllocations
                var allowedProjects = await _projectAllocationRepository.GetProjectIdsForUserAsync(
                    userId
                );

                if (!allowedProjects.Contains(projectId))
                {
                    return new ApiResponse<TaskBoardDto>
                    {
                        Success = false,
                        Message = "Access denied",
                        StatusCode = 403,
                    };
                }
            }

            var tasks = await _taskRepository.GetByProjectIdAsync(projectId);

            if (assignedToUserId.HasValue)
            {
                tasks = tasks.Where(t => t.AssignedToUserId == assignedToUserId.Value).ToList();
            }

            var board = new TaskBoardDto
            {
                ProjectId = projectId,
                Columns = new List<TaskBoardColumnDto>
                {
                    new TaskBoardColumnDto
                    {
                        Status = TaskStatuses.NotStarted,
                        StatusName = "Not Started",
                        Tasks = tasks
                            .Where(t => t.Status == TaskStatuses.NotStarted)
                            .Select(MapToDTO)
                            .ToList(),
                    },
                    new TaskBoardColumnDto
                    {
                        Status = TaskStatuses.InProgress,
                        StatusName = "In Progress",
                        Tasks = tasks
                            .Where(t => t.Status == TaskStatuses.InProgress)
                            .Select(MapToDTO)
                            .ToList(),
                    },
                    new TaskBoardColumnDto
                    {
                        Status = TaskStatuses.Approved,
                        StatusName = "Approved",
                        Tasks = tasks
                            .Where(t => t.Status == TaskStatuses.Approved)
                            .Select(MapToDTO)
                            .ToList(),
                    },
                    new TaskBoardColumnDto
                    {
                        Status = TaskStatuses.Done,
                        StatusName = "Done",
                        Tasks = tasks
                            .Where(t => t.Status == TaskStatuses.Done)
                            .Select(MapToDTO)
                            .ToList(),
                    },
                },
            };

            return new ApiResponse<TaskBoardDto>
            {
                Success = true,
                Data = board,
                StatusCode = 200,
            };
        }

        public async Task<ApiResponse<List<TaskDTO>>> GetNotStartedTasksAsync(
            Guid? projectId,
            int daysUntilDue
        )
        {
            try
            {
                var tasks = await _taskRepository.GetNotStartedTasksAsync(projectId, daysUntilDue);
                var dtos = tasks.Select(MapToDTO).ToList();

                return new ApiResponse<List<TaskDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting not started tasks");
                return new ApiResponse<List<TaskDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        private async Task RecalculateSprintStoryPointsAsync(Guid sprintId)
        {
            try
            {
                var sprint = await _sprintRepository.GetByIdAsync(sprintId);
                if (sprint != null)
                {
                    sprint.TotalStoryPoints = await _taskRepository.GetSprintTotalStoryPointsAsync(
                        sprintId
                    );
                    sprint.CompletedStoryPoints =
                        await _taskRepository.GetSprintCompletedStoryPointsAsync(sprintId);
                    sprint.UpdatedDate = DateTime.UtcNow;
                    await _sprintRepository.UpdateAsync(sprint);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error recalculating sprint story points. SprintId={SprintId}",
                    sprintId
                );
            }
        }

        private TaskDTO MapToDTO(WorkTask task)
        {
            return task.ToTaskDTO(_mapper);
        }
    }
}
