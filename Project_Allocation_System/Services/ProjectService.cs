using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using Project_Allocation_System.Repos;

namespace Project_Allocation_System.Services
{
    // Service for handling all project related business logic
    // CRUD operations for projects along with validations
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;
        private readonly IOrganizationRepository _organizationRepository;
        private readonly ILogger<ProjectService> _logger;
        private readonly IMapper _mapper;
        private readonly ServiceBusNotificationService _notificationService;

        // Constructor - injecting required dependencies
        public ProjectService(
            IProjectRepository projectRepository,
            IUserRepository userRepository,
            IOrganizationRepository organizationRepository,
            ILogger<ProjectService> logger,
            IMapper mapper,
            ServiceBusNotificationService notificationService
        )
        {
            _projectRepository = projectRepository;
            _userRepository = userRepository;
            _organizationRepository = organizationRepository;
            _logger = logger;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        // This function creates a new project
        // Only Admin can create projects
        // Validates that PM is valid and from same organization
        public async Task<ApiResponse<ProjectDTO>> CreateAsync(
            Guid userId,
            ProjectCreateRequest request
        )
        {
            try
            {
                var admin = await _userRepository.GetByIdAsync(userId);
                if (admin == null)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                if (admin.Role != UserRole.Admin)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Only Admin can create projects",
                        StatusCode = 403,
                    };
                }

                // 🔒 Validate Organization
                if (request.OrganizationId == Guid.Empty)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Organization is required",
                        StatusCode = 400,
                    };
                }

                var organization =
                    await _organizationRepository.GetByIdAsync(request.OrganizationId);
                if (organization == null || !organization.IsActive)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Organization not found or inactive",
                        StatusCode = 404,
                    };
                }

                // 🔒 Validate Project Manager
                var projectManager = await _userRepository.GetByIdAsync(request.ProjectManagerId);
                if (projectManager == null)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Project Manager not found",
                        StatusCode = 404,
                    };
                }

                if (projectManager.OrganizationId != request.OrganizationId)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Project Manager must belong to the selected organization",
                        StatusCode = 400,
                    };
                }

                if (projectManager.Role != UserRole.ProjectManager)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Selected user is not a Project Manager",
                        StatusCode = 400,
                    };
                }

                var project = new Project
                {
                    ProjectId = Guid.NewGuid(),
                    OrganizationId = request.OrganizationId,
                    Code = request.Code,
                    Name = request.Name,
                    Description = request.Description,
                    ProjectManagerId = projectManager.UserId,
                    Status = request.Status,
                    Priority = request.Priority,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Budget = request.Budget,
                    MaxAllocations = request.MaxAllocations,
                    CreatedBy = admin.Email,
                    UpdatedBy = admin.Email,
                };

                await _projectRepository.CreateAsync(project);

                _logger.LogInformation(
                    "Project created: {ProjectCode} with PM {PMEmail} by Admin {AdminEmail}",
                    project.Code,
                    projectManager.Email,
                    admin.Email
                );

                // Send email notification to Project Manager when project is created
                if (!string.IsNullOrWhiteSpace(projectManager.Email))
                {
                    try
                    {
                        var templateData = new Dictionary<string, object>
                        {
                            ["RecipientName"] = projectManager.DisplayName,
                            ["ProjectName"] = project.Name,
                            ["ProjectCode"] = project.Code,
                            ["ProjectUrl"] = $"https://yourapp.com/projects/{project.ProjectId}",
                        };

                        _logger.LogInformation(
                            "Sending email notification to PM for new project. PMEmail: {Email}, ProjectId: {ProjectId}",
                            projectManager.Email,
                            project.ProjectId
                        );

                        await _notificationService.SendEmailNotificationAsync(
                            "ProjectAssigned",
                            "project-assigned",
                            projectManager.UserId,
                            projectManager.Email,
                            templateData,
                            $"You've been assigned as Project Manager for {project.Name}"
                        );

                        _logger.LogInformation(
                            "Email notification sent to PM. PMEmail: {Email}, ProjectId: {ProjectId}",
                            projectManager.Email,
                            project.ProjectId
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(
                            emailEx,
                            "ERROR sending email notification to PM. PMEmail: {Email}, ProjectId: {ProjectId}, Error: {ErrorMessage}",
                            projectManager.Email,
                            project.ProjectId,
                            emailEx.Message
                        );
                        // Don't throw - email failure shouldn't break project creation
                    }
                }

                return new ApiResponse<ProjectDTO>
                {
                    Success = true,
                    Message = "Project created successfully",
                    Data = MapToDTO(project),
                    StatusCode = 201,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error creating project. AdminId={AdminId}, Code={Code}",
                    userId,
                    request.Code
                );

                return new ApiResponse<ProjectDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        // This function fetches single project by id
        // Returns full project details with PM and org info
        public async Task<ApiResponse<ProjectDTO>> GetByIdAsync(Guid projectId)
        {
            try
            {
                var project = await _projectRepository.GetByIdAsync(projectId);
                if (project == null)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Project not found",
                        StatusCode = 404,
                    };
                }

                return new ApiResponse<ProjectDTO>
                {
                    Success = true,
                    Data = MapToDTO(project),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error retriving the project. projectId={projectId}",
                    projectId
                );

                return new ApiResponse<ProjectDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<List<ProjectDTO>>> GetByIdsAsync(List<Guid> projectIds)
        {
            try
            {
                var projects = await _projectRepository.GetByIdsAsync(projectIds);
                var dtos = projects.ConvertAll(MapToDTO);

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects by IDs");
                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<List<ProjectDTO>>> GetAllAsync(
            int pageNumber = 1,
            int pageSize = 10,
            Guid? organizationId = null
        )
        {
            try
            {
                var projects = await _projectRepository.GetAllAsync(
                    pageNumber,
                    pageSize,
                    organizationId
                );
                var dtos = projects.ConvertAll(MapToDTO);

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting projects. PageNumber={PageNumber}, PageSize={PageSize}",
                    pageNumber,
                    pageSize
                );

                return new ApiResponse<List<ProjectDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<PagedResponse<ProjectDTO>>> GetFilteredAsync(
            ProjectFilterRequest filter
        )
        {
            try
            {
                _logger.LogInformation(
                    "Fetching filtered projects: Page={Page}, PageSize={PageSize}, SearchTerm={SearchTerm}, Status={Status}, Priority={Priority}, OrganizationId={OrganizationId}, ProjectManagerId={ProjectManagerId}, SortBy={SortBy}, SortOrder={SortOrder}",
                    filter.PageNumber,
                    filter.PageSize,
                    filter.SearchTerm,
                    filter.Status,
                    filter.Priority,
                    filter.OrganizationId,
                    filter.ProjectManagerId,
                    filter.SortBy,
                    filter.SortOrder
                );

                // All filtering, pagination, searching, and sorting is done at repository layer
                var (projects, totalCount) = await _projectRepository.GetFilteredAsync(filter);

                return new ApiResponse<PagedResponse<ProjectDTO>>
                {
                    Success = true,
                    Message = "Projects retrieved successfully",
                    Data = new PagedResponse<ProjectDTO>
                    {
                        Items = projects.ConvertAll(MapToDTO),
                        TotalCount = totalCount,
                        Page = filter.PageNumber,
                        PageSize = filter.PageSize,
                    },
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered projects");
                throw;
            }
        }

        public async Task<ApiResponse<ProjectDTO>> UpdateAsync(
            Guid projectId,
            ProjectUpdateRequest request,
            Guid userId
        )
        {
            try
            {
                var project = await _projectRepository.GetByIdAsync(projectId);
                if (project == null)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "Project not found",
                        StatusCode = 404,
                    };
                }

                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new ApiResponse<ProjectDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                // 🔄 Optional Project Manager reassignment
                if (
                    request.ProjectManagerId.HasValue
                    && request.ProjectManagerId.Value != project.ProjectManagerId
                )
                {
                    var newPm = await _userRepository.GetByIdAsync(request.ProjectManagerId.Value);
                    if (newPm == null)
                    {
                        return new ApiResponse<ProjectDTO>
                        {
                            Success = false,
                            Message = "Project Manager not found",
                            StatusCode = 404,
                        };
                    }

                    if (newPm.OrganizationId != project.OrganizationId)
                    {
                        return new ApiResponse<ProjectDTO>
                        {
                            Success = false,
                            Message = "Project Manager must belong to the same organization",
                            StatusCode = 400,
                        };
                    }

                    if (newPm.Role != UserRole.ProjectManager)
                    {
                        return new ApiResponse<ProjectDTO>
                        {
                            Success = false,
                            Message = "Selected user is not a Project Manager",
                            StatusCode = 400,
                        };
                    }

                    // Get old PM before reassignment
                    var oldPm =
                        project.ProjectManagerId != Guid.Empty
                            ? await _userRepository.GetByIdAsync(project.ProjectManagerId)
                            : null;

                    project.ProjectManagerId = newPm.UserId;

                    // Send email notification to new PM
                    if (!string.IsNullOrWhiteSpace(newPm.Email))
                    {
                        try
                        {
                            var templateData = new Dictionary<string, object>
                            {
                                ["RecipientName"] = newPm.DisplayName,
                                ["ProjectName"] = project.Name,
                                ["ProjectCode"] = project.Code,
                                ["ProjectUrl"] = $"https://yourapp.com/projects/{projectId}",
                            };

                            _logger.LogInformation(
                                "Sending email notification to new PM for project reassignment. NewPMEmail: {Email}, ProjectId: {ProjectId}",
                                newPm.Email,
                                projectId
                            );

                            await _notificationService.SendEmailNotificationAsync(
                                "ProjectReassigned",
                                "project-reassigned",
                                newPm.UserId,
                                newPm.Email,
                                templateData,
                                $"You've been assigned as Project Manager for {project.Name}"
                            );

                            _logger.LogInformation(
                                "Email notification sent to new PM. NewPMEmail: {Email}, ProjectId: {ProjectId}",
                                newPm.Email,
                                projectId
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError(
                                emailEx,
                                "ERROR sending email notification to new PM. NewPMEmail: {Email}, ProjectId: {ProjectId}, Error: {ErrorMessage}",
                                newPm.Email,
                                projectId,
                                emailEx.Message
                            );
                            // Don't throw - email failure shouldn't break the update
                        }
                    }

                    // Optionally send email to old PM if they exist
                    if (
                        oldPm != null
                        && !string.IsNullOrWhiteSpace(oldPm.Email)
                        && oldPm.UserId != newPm.UserId
                    )
                    {
                        try
                        {
                            var templateData = new Dictionary<string, object>
                            {
                                ["RecipientName"] = oldPm.DisplayName,
                                ["ProjectName"] = project.Name,
                                ["ProjectCode"] = project.Code,
                                ["NewPMName"] = newPm.DisplayName,
                            };

                            _logger.LogInformation(
                                "Sending email notification to old PM for project reassignment. OldPMEmail: {Email}, ProjectId: {ProjectId}",
                                oldPm.Email,
                                projectId
                            );

                            await _notificationService.SendEmailNotificationAsync(
                                "ProjectReassignedFrom",
                                "project-reassigned-from",
                                oldPm.UserId,
                                oldPm.Email,
                                templateData,
                                $"Project {project.Name} has been reassigned"
                            );

                            _logger.LogInformation(
                                "Email notification sent to old PM. OldPMEmail: {Email}, ProjectId: {ProjectId}",
                                oldPm.Email,
                                projectId
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError(
                                emailEx,
                                "ERROR sending email notification to old PM. OldPMEmail: {Email}, ProjectId: {ProjectId}, Error: {ErrorMessage}",
                                oldPm.Email,
                                projectId,
                                emailEx.Message
                            );
                            // Don't throw - email failure shouldn't break the update
                        }
                    }
                }

                if (request.Name != null)
                    project.Name = request.Name;

                if (request.Description != null)
                    project.Description = request.Description;

                if (request.Status.HasValue)
                    project.Status = request.Status.Value;

                if (request.Priority.HasValue)
                    project.Priority = request.Priority.Value;

                if (request.StartDate.HasValue)
                    project.StartDate = request.StartDate.Value;

                if (request.EndDate.HasValue)
                    project.EndDate = request.EndDate.Value;

                if (request.Budget.HasValue)
                    project.Budget = request.Budget.Value;

                if (request.ProgressPercentage.HasValue)
                    project.ProgressPercentage = request.ProgressPercentage.Value;

                if (request.MaxAllocations.HasValue)
                {
                    project.MaxAllocations = Math.Max(0, request.MaxAllocations.Value);
                }

                project.UpdatedDate = DateTime.UtcNow;
                project.UpdatedBy = user.Email;

                await _projectRepository.UpdateAsync(project);

                return new ApiResponse<ProjectDTO>
                {
                    Success = true,
                    Message = "Project updated successfully",
                    Data = MapToDTO(project),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project. ProjectId={ProjectId}", projectId);

                return new ApiResponse<ProjectDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteAsync(Guid projectId)
        {
            try
            {
                var project = await _projectRepository.GetByIdAsync(projectId);
                if (project == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Project not found",
                        StatusCode = 404,
                    };
                }

                await _projectRepository.DeleteAsync(projectId);

                _logger.LogInformation("Project deleted: {ProjectId}", projectId);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Project deleted successfully",
                    Data = true,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error deleting project with projectId={projectId}",
                    projectId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500,
                };
            }
        }

        /// <summary>
        /// Maps a Project to ProjectDTO using AutoMapper.
        /// </summary>
        private ProjectDTO MapToDTO(Project project)
        {
            return _mapper.Map<ProjectDTO>(project);
        }
    }
}
