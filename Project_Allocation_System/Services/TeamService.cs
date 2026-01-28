using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using Project_Allocation_System.Services;

namespace Project_Allocation_System.Services
{
    public class TeamService : ITeamService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITeamRepository _teamRepo;
        private readonly IProjectRepository _projectRepo;
        private readonly IUserRepository _userRepo;
        private readonly ITaskRepository _taskRepo;
        private readonly ILogger<TeamService> _logger;
        private readonly IMapper _mapper;
        private readonly IProjectAllocationRepository _allocationRepo;
        private readonly ServiceBusNotificationService _notificationService;

        public TeamService(
            ApplicationDbContext context,
            ITeamRepository teamRepo,
            IProjectRepository projectRepo,
            IUserRepository userRepo,
            ITaskRepository taskRepo,
            IProjectAllocationRepository allocationRepo,
            ILogger<TeamService> logger,
            IMapper mapper,
            ServiceBusNotificationService notificationService
        )
        {
            _context = context;
            _teamRepo = teamRepo;
            _projectRepo = projectRepo;
            _userRepo = userRepo;
            _taskRepo = taskRepo;
            _allocationRepo = allocationRepo;
            _logger = logger;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        public async Task<ApiResponse<TeamDTO>> GetTeamByIdAsync(Guid teamId, Guid actorUserId)
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (actor == null)
                {
                    return Fail<TeamDTO>("Unauthorized", 401);
                }

                var team = await _teamRepo.GetByIdWithMembersAsync(teamId);
                if (team == null)
                {
                    return Fail<TeamDTO>("Team not found", 404);
                }

                // Check organization match
                var project = await _projectRepo.GetByIdAsync(team.ProjectId);
                if (project == null || actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<TeamDTO>("Access denied", 403);
                }

                var dto = MapTeamToDTO(team);
                return Success(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team. TeamId={TeamId}", teamId);
                return Fail<TeamDTO>("An error occurred", 500);
            }
        }

        public async Task<ApiResponse<ProjectTeamsDTO>> GetProjectTeamsAsync(
            Guid projectId,
            Guid actorUserId
        )
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (actor == null)
                {
                    return Fail<ProjectTeamsDTO>("Unauthorized", 401);
                }

                var project = await _projectRepo.GetByIdAsync(projectId);
                if (project == null)
                {
                    return Fail<ProjectTeamsDTO>("Project not found", 404);
                }

                if (actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<ProjectTeamsDTO>("Access denied", 403);
                }

                var teams = await _teamRepo.GetByProjectIdWithMembersAsync(projectId);

                var dto = new ProjectTeamsDTO
                {
                    ProjectId = project.ProjectId,
                    ProjectName = project.Name,
                    ProjectCode = project.Code,
                    ProjectManagerName = project.ProjectManager?.DisplayName ?? string.Empty,
                    TotalTeams = teams.Count,
                    TotalMembers = teams.Sum(t => t.Members.Count(m => m.IsActive)) + teams.Count, // +teams.Count for team leads
                    Teams = teams.Select(MapTeamToDTO).ToList(),
                };

                return Success(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting project teams. ProjectId={ProjectId}",
                    projectId
                );
                return Fail<ProjectTeamsDTO>("An error occurred", 500);
            }
        }

        public async Task<ApiResponse<TeamDTO>> CreateTeamAsync(
            CreateTeamRequest request,
            Guid actorUserId
        )
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (
                    actor == null
                    || (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                )
                {
                    return Fail<TeamDTO>("Forbidden: Only Project Managers can create teams", 403);
                }

                var project = await _projectRepo.GetByIdAsync(request.ProjectId);
                if (project == null)
                {
                    return Fail<TeamDTO>("Project not found", 404);
                }

                if (actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<TeamDTO>("Organization mismatch", 403);
                }

                // Only the assigned PM or Admin can create teams for this project
                if (
                    actor.Role == UserRole.ProjectManager
                    && project.ProjectManagerId != actorUserId
                )
                {
                    return Fail<TeamDTO>("You can only manage teams for your own projects", 403);
                }

                // Validate team name uniqueness
                if (await _teamRepo.ExistsAsync(request.ProjectId, request.Name))
                {
                    return Fail<TeamDTO>(
                        "A team with this name already exists in the project",
                        409
                    );
                }

                // Validate team lead
                var teamLead = await _userRepo.GetByIdAsync(request.TeamLeadId);
                if (teamLead == null || teamLead.OrganizationId != project.OrganizationId)
                {
                    return Fail<TeamDTO>("Invalid team lead", 400);
                }

                if (teamLead.Role != UserRole.TeamLead)
                {
                    return Fail<TeamDTO>("Team lead must have TeamLead role", 400);
                }

                // Check if user is already a team lead in this project
                if (await _teamRepo.IsUserTeamLeadAsync(request.ProjectId, request.TeamLeadId))
                {
                    return Fail<TeamDTO>(
                        "This user is already a team lead in another team of this project",
                        409
                    );
                }

                Team team;
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    team = new Team
                    {
                        TeamId = Guid.NewGuid(),
                        ProjectId = request.ProjectId,
                        Name = request.Name.Trim(),
                        Description = request.Description?.Trim(),
                        TeamLeadId = request.TeamLeadId,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow,
                        CreatedBy = actor.Email ?? "system",
                    };

                    await _teamRepo.CreateAsync(team);

                    // Create ProjectAllocation for the team lead if not already allocated
                    var existingAllocation = await _allocationRepo.ExistsAsync(
                        request.ProjectId,
                        request.TeamLeadId
                    );
                    if (!existingAllocation)
                    {
                        var allocation = new ProjectAllocation
                        {
                            AllocationId = Guid.NewGuid(),
                            ProjectId = request.ProjectId,
                            UserId = request.TeamLeadId,
                            TeamName = request.Name.Trim(),
                            AllocationPercentage = 100,
                            StartDate = DateTime.UtcNow,
                            IsActive = true,
                            CreatedDate = DateTime.UtcNow,
                            CreatedBy = actor.Email ?? "system",
                            UpdatedBy = actor.Email ?? "system",
                        };
                        await _allocationRepo.CreateAsync(allocation);
                        _logger.LogInformation(
                            "Project allocation created for team lead. ProjectId={ProjectId}, UserId={UserId}",
                            request.ProjectId,
                            request.TeamLeadId
                        );
                    }

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }

                // Reload with navigation properties
                team = await _teamRepo.GetByIdWithMembersAsync(team.TeamId);

                _logger.LogInformation(
                    "Team created. TeamId={TeamId}, ProjectId={ProjectId}, ActorUserId={ActorUserId}",
                    team!.TeamId,
                    request.ProjectId,
                    actorUserId
                );

                // Send email notification to team lead
                if (!string.IsNullOrWhiteSpace(teamLead.Email))
                {
                    try
                    {
                        var templateData = new Dictionary<string, object>
                        {
                            ["RecipientName"] = teamLead.DisplayName,
                            ["TeamName"] = team.Name,
                            ["ProjectName"] = project.Name,
                            ["ProjectCode"] = project.Code,
                            ["AddedByName"] = actor.DisplayName,
                            ["ProjectUrl"] = $"https://yourapp.com/projects/{request.ProjectId}",
                        };

                        _logger.LogInformation(
                            "Sending email notification to team lead for team creation. TeamLeadEmail: {Email}, TeamId: {TeamId}",
                            teamLead.Email,
                            team.TeamId
                        );

                        await _notificationService.SendEmailNotificationAsync(
                            "TeamLeadAssigned",
                            "team-lead-assigned",
                            teamLead.UserId,
                            teamLead.Email,
                            templateData,
                            $"You've been assigned as Team Lead for {team.Name}"
                        );

                        _logger.LogInformation(
                            "Email notification sent to team lead. TeamLeadEmail: {Email}, TeamId: {TeamId}",
                            teamLead.Email,
                            team.TeamId
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(
                            emailEx,
                            "ERROR sending email notification to team lead. TeamLeadEmail: {Email}, TeamId: {TeamId}, Error: {ErrorMessage}",
                            teamLead.Email,
                            team.TeamId,
                            emailEx.Message
                        );
                        // Don't throw - email failure shouldn't break team creation
                    }
                }

                return Success(MapTeamToDTO(team));
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error creating team. ProjectId={ProjectId}, Error: {Error}",
                    request.ProjectId,
                    ex.Message
                );
                return Fail<TeamDTO>($"An error occurred while creating team: {ex.Message}", 500);
            }
        }

        public async Task<ApiResponse<TeamDTO>> UpdateTeamAsync(
            Guid teamId,
            UpdateTeamRequest request,
            Guid actorUserId
        )
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (
                    actor == null
                    || (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                )
                {
                    return Fail<TeamDTO>("Forbidden", 403);
                }

                var team = await _teamRepo.GetByIdAsync(teamId);
                if (team == null)
                {
                    return Fail<TeamDTO>("Team not found", 404);
                }

                var project = await _projectRepo.GetByIdAsync(team.ProjectId);
                if (project == null || actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<TeamDTO>("Access denied", 403);
                }

                if (
                    actor.Role == UserRole.ProjectManager
                    && project.ProjectManagerId != actorUserId
                )
                {
                    return Fail<TeamDTO>("You can only manage teams for your own projects", 403);
                }

                // Update name if provided
                if (!string.IsNullOrWhiteSpace(request.Name) && request.Name != team.Name)
                {
                    if (await _teamRepo.ExistsAsync(team.ProjectId, request.Name))
                    {
                        return Fail<TeamDTO>("A team with this name already exists", 409);
                    }
                    team.Name = request.Name.Trim();
                }

                // Update description
                if (request.Description != null)
                {
                    team.Description = request.Description.Trim();
                }

                // Update team lead if provided
                Guid? oldTeamLeadId = null;
                if (request.TeamLeadId.HasValue && request.TeamLeadId.Value != team.TeamLeadId)
                {
                    var newLead = await _userRepo.GetByIdAsync(request.TeamLeadId.Value);
                    if (newLead == null || newLead.OrganizationId != project.OrganizationId)
                    {
                        return Fail<TeamDTO>("Invalid team lead", 400);
                    }

                    if (newLead.Role != UserRole.TeamLead)
                    {
                        return Fail<TeamDTO>("Team lead must have TeamLead role", 400);
                    }

                    // Check if new lead is already leading another team in this project
                    var existingTeams = await _teamRepo.GetByProjectIdAsync(team.ProjectId);
                    if (
                        existingTeams.Any(t =>
                            t.TeamId != teamId && t.TeamLeadId == request.TeamLeadId.Value
                        )
                    )
                    {
                        return Fail<TeamDTO>(
                            "This user is already a team lead in another team",
                            409
                        );
                    }

                    oldTeamLeadId = team.TeamLeadId;
                    team.TeamLeadId = request.TeamLeadId.Value;

                    // Create ProjectAllocation for the new team lead if not already allocated
                    var existingAllocation = await _allocationRepo.ExistsAsync(
                        team.ProjectId,
                        request.TeamLeadId.Value
                    );
                    if (!existingAllocation)
                    {
                        var allocation = new ProjectAllocation
                        {
                            AllocationId = Guid.NewGuid(),
                            ProjectId = team.ProjectId,
                            UserId = request.TeamLeadId.Value,
                            TeamName = team.Name,
                            AllocationPercentage = 100,
                            StartDate = DateTime.UtcNow,
                            IsActive = true,
                            CreatedDate = DateTime.UtcNow,
                            CreatedBy = actor.Email ?? "system",
                            UpdatedBy = actor.Email ?? "system",
                        };
                        await _allocationRepo.CreateAsync(allocation);
                        _logger.LogInformation(
                            "Project allocation created for new team lead. ProjectId={ProjectId}, UserId={UserId}",
                            team.ProjectId,
                            request.TeamLeadId.Value
                        );
                    }

                    // Send email notification to new team lead
                    if (!string.IsNullOrWhiteSpace(newLead.Email))
                    {
                        try
                        {
                            var templateData = new Dictionary<string, object>
                            {
                                ["RecipientName"] = newLead.DisplayName,
                                ["TeamName"] = team.Name,
                                ["ProjectName"] = project.Name,
                                ["ProjectCode"] = project.Code,
                                ["AddedByName"] = actor.DisplayName,
                                ["ProjectUrl"] = $"https://yourapp.com/projects/{team.ProjectId}",
                            };

                            _logger.LogInformation(
                                "Sending email notification to new team lead for team reassignment. NewTeamLeadEmail: {Email}, TeamId: {TeamId}",
                                newLead.Email,
                                teamId
                            );

                            await _notificationService.SendEmailNotificationAsync(
                                "TeamLeadReassigned",
                                "team-lead-reassigned",
                                newLead.UserId,
                                newLead.Email,
                                templateData,
                                $"You've been assigned as Team Lead for {team.Name}"
                            );

                            _logger.LogInformation(
                                "Email notification sent to new team lead. NewTeamLeadEmail: {Email}, TeamId: {TeamId}",
                                newLead.Email,
                                teamId
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError(
                                emailEx,
                                "ERROR sending email notification to new team lead. NewTeamLeadEmail: {Email}, TeamId: {TeamId}, Error: {ErrorMessage}",
                                newLead.Email,
                                teamId,
                                emailEx.Message
                            );
                            // Don't throw - email failure shouldn't break the update
                        }
                    }

                    // Optionally send email to old team lead if they exist
                    if (oldTeamLeadId.HasValue)
                    {
                        var oldLead = await _userRepo.GetByIdAsync(oldTeamLeadId.Value);
                        if (oldLead != null && !string.IsNullOrWhiteSpace(oldLead.Email) && oldLead.UserId != newLead.UserId)
                        {
                            try
                            {
                                var templateData = new Dictionary<string, object>
                                {
                                    ["RecipientName"] = oldLead.DisplayName,
                                    ["TeamName"] = team.Name,
                                    ["ProjectName"] = project.Name,
                                    ["ProjectCode"] = project.Code,
                                    ["NewTeamLeadName"] = newLead.DisplayName,
                                    ["ProjectUrl"] = $"https://yourapp.com/projects/{team.ProjectId}",
                                };

                                _logger.LogInformation(
                                    "Sending email notification to old team lead for team reassignment. OldTeamLeadEmail: {Email}, TeamId: {TeamId}",
                                    oldLead.Email,
                                    teamId
                                );

                                await _notificationService.SendEmailNotificationAsync(
                                    "TeamLeadReassignedFrom",
                                    "team-lead-reassigned-from",
                                    oldLead.UserId,
                                    oldLead.Email,
                                    templateData,
                                    $"Team {team.Name} has been reassigned"
                                );

                                _logger.LogInformation(
                                    "Email notification sent to old team lead. OldTeamLeadEmail: {Email}, TeamId: {TeamId}",
                                    oldLead.Email,
                                    teamId
                                );
                            }
                            catch (Exception emailEx)
                            {
                                _logger.LogError(
                                    emailEx,
                                    "ERROR sending email notification to old team lead. OldTeamLeadEmail: {Email}, TeamId: {TeamId}, Error: {ErrorMessage}",
                                    oldLead.Email,
                                    teamId,
                                    emailEx.Message
                                );
                                // Don't throw - email failure shouldn't break the update
                            }
                        }
                    }
                }

                team.UpdatedDate = DateTime.UtcNow;
                team.UpdatedBy = actor.Email;

                await _teamRepo.UpdateAsync(team);

                // If team lead changed, unassign old team lead from tasks and remove as reviewer
                if (oldTeamLeadId.HasValue)
                {
                    var unassignedCount = await _taskRepo.UnassignUserFromProjectTasksAsync(
                        team.ProjectId,
                        oldTeamLeadId.Value
                    );
                    var reviewerRemovedCount =
                        await _taskRepo.RemoveUserAsReviewerFromProjectTasksAsync(
                            team.ProjectId,
                            oldTeamLeadId.Value
                        );
                    _logger.LogInformation(
                        "Old team lead removed from tasks. Unassigned from {UnassignedCount} tasks, removed as reviewer from {ReviewerCount} tasks. TeamId={TeamId}, OldTeamLeadId={OldTeamLeadId}",
                        unassignedCount,
                        reviewerRemovedCount,
                        teamId,
                        oldTeamLeadId.Value
                    );
                }

                team = await _teamRepo.GetByIdWithMembersAsync(teamId);

                _logger.LogInformation(
                    "Team updated. TeamId={TeamId}, ActorUserId={ActorUserId}",
                    teamId,
                    actorUserId
                );

                return Success(MapTeamToDTO(team!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating team. TeamId={TeamId}", teamId);
                return Fail<TeamDTO>("An error occurred while updating team", 500);
            }
        }

        public async Task<ApiResponse<bool>> DeleteTeamAsync(Guid teamId, Guid actorUserId)
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (
                    actor == null
                    || (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                )
                {
                    return Fail<bool>("Forbidden", 403);
                }

                var team = await _teamRepo.GetByIdAsync(teamId);
                if (team == null)
                {
                    return Fail<bool>("Team not found", 404);
                }

                var project = await _projectRepo.GetByIdAsync(team.ProjectId);
                if (project == null || actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<bool>("Access denied", 403);
                }

                if (
                    actor.Role == UserRole.ProjectManager
                    && project.ProjectManagerId != actorUserId
                )
                {
                    return Fail<bool>("You can only manage teams for your own projects", 403);
                }

                await _teamRepo.DeleteAsync(teamId);

                _logger.LogInformation(
                    "Team deleted. TeamId={TeamId}, ActorUserId={ActorUserId}",
                    teamId,
                    actorUserId
                );

                return Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting team. TeamId={TeamId}", teamId);
                return Fail<bool>("An error occurred while deleting team", 500);
            }
        }

        public async Task<ApiResponse<TeamMemberDTO>> AddMemberToTeamAsync(
            Guid teamId,
            AddTeamMemberRequest request,
            Guid actorUserId
        )
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (
                    actor == null
                    || (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                )
                {
                    return Fail<TeamMemberDTO>(
                        "Forbidden: Only Project Managers can add team members",
                        403
                    );
                }

                var team = await _teamRepo.GetByIdAsync(teamId);
                if (team == null)
                {
                    return Fail<TeamMemberDTO>("Team not found", 404);
                }

                var project = await _projectRepo.GetByIdAsync(team.ProjectId);
                if (project == null || actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<TeamMemberDTO>("Access denied", 403);
                }

                if (
                    actor.Role == UserRole.ProjectManager
                    && project.ProjectManagerId != actorUserId
                )
                {
                    return Fail<TeamMemberDTO>(
                        "You can only manage teams for your own projects",
                        403
                    );
                }

                // Validate user to add
                var userToAdd = await _userRepo.GetByIdAsync(request.UserId);
                if (userToAdd == null || userToAdd.OrganizationId != project.OrganizationId)
                {
                    return Fail<TeamMemberDTO>("Invalid user", 400);
                }

                if (userToAdd.Role != UserRole.TeamMember)
                {
                    return Fail<TeamMemberDTO>(
                        "Only users with TeamMember role can be added as team members",
                        400
                    );
                }

                // Check if user is the team lead
                if (team.TeamLeadId == request.UserId)
                {
                    return Fail<TeamMemberDTO>("This user is already the team lead", 409);
                }

                // Check if already a member (including inactive ones due to unique index)
                var existingMember = await _context.TeamMembers
                    .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == request.UserId);
                
                if (existingMember != null && existingMember.IsActive)
                {
                    return Fail<TeamMemberDTO>("User is already a member of this team", 409);
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                TeamMember? member = null;
                try
                {
                    if (existingMember != null && !existingMember.IsActive)
                    {
                        // Member exists but is inactive - reactivate it
                        existingMember.IsActive = true;
                        existingMember.JoinedDate = DateTime.UtcNow;
                        existingMember.UpdatedDate = DateTime.UtcNow;
                        existingMember.UpdatedBy = actor.Email ?? "system";
                        await _context.SaveChangesAsync();
                        member = existingMember;
                        _logger.LogInformation("Reactivated existing team member. TeamId={TeamId}, UserId={UserId}", teamId, request.UserId);
                    }
                    else
                    {
                        // Create new member
                        member = new TeamMember
                        {
                            TeamMemberId = Guid.NewGuid(),
                            TeamId = teamId,
                            UserId = request.UserId,
                            JoinedDate = DateTime.UtcNow,
                            IsActive = true,
                            CreatedDate = DateTime.UtcNow,
                            CreatedBy = actor.Email ?? "system",
                        };

                        await _teamRepo.AddMemberAsync(member);
                    }
                    
                    _logger.LogInformation("TeamMember created successfully. TeamMemberId={TeamMemberId}, TeamId={TeamId}, UserId={UserId}", 
                        member.TeamMemberId, teamId, request.UserId);

                    // Create ProjectAllocation for the member if not already allocated
                    var existingAllocation = await _allocationRepo.ExistsAsync(
                        team.ProjectId,
                        request.UserId
                    );
                    if (!existingAllocation)
                    {
                        var allocation = new ProjectAllocation
                        {
                            AllocationId = Guid.NewGuid(),
                            ProjectId = team.ProjectId,
                            UserId = request.UserId,
                            TeamName = team.Name,
                            AllocationPercentage = 100,
                            StartDate = DateTime.UtcNow,
                            IsActive = true,
                            CreatedDate = DateTime.UtcNow,
                            CreatedBy = actor.Email ?? "system",
                            UpdatedBy = actor.Email ?? "system",
                        };
                        await _allocationRepo.CreateAsync(allocation);
                        _logger.LogInformation(
                            "Project allocation created for team member. ProjectId={ProjectId}, UserId={UserId}",
                            team.ProjectId,
                            request.UserId
                        );
                    }

                    await transaction.CommitAsync();
                }
                catch (Exception txEx)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        txEx,
                        "Transaction failed while adding member to team. TeamId={TeamId}, UserId={UserId}, ExceptionType={ExceptionType}, Message={Message}, InnerException={InnerException}",
                        teamId,
                        request.UserId,
                        txEx.GetType().Name,
                        txEx.Message,
                        txEx.InnerException?.Message ?? "None"
                    );
                    throw;
                }
                
                if (member == null)
                {
                    _logger.LogError("CRITICAL: Member is null after transaction commit. TeamId={TeamId}, UserId={UserId}", teamId, request.UserId);
                    return Fail<TeamMemberDTO>("Failed to create team member", 500);
                }

                _logger.LogInformation(
                    "Member added to team. TeamId={TeamId}, UserId={UserId}, ActorUserId={ActorUserId}",
                    teamId,
                    request.UserId,
                    actorUserId
                );

                // Reload with user info - use the member we just created if reload fails
                TeamMember? reloadedMember = null;
                try
                {
                    reloadedMember = await _teamRepo.GetTeamMemberAsync(teamId, request.UserId);
                }
                catch (Exception reloadEx)
                {
                    _logger.LogWarning(
                        reloadEx,
                        "Could not reload team member after adding (this is usually fine). TeamId={TeamId}, UserId={UserId}, Error: {ErrorMessage}. Using member from transaction.",
                        teamId,
                        request.UserId,
                        reloadEx.Message
                    );
                }

                // Use reloaded member if available, otherwise use the one we just created
                var finalMember = reloadedMember ?? member;
                
                if (finalMember == null)
                {
                    _logger.LogError("CRITICAL: Both reloadedMember and member are null after adding team member. TeamId={TeamId}, UserId={UserId}", teamId, request.UserId);
                    return Fail<TeamMemberDTO>("Failed to create team member", 500);
                }

                // Send email notification
                try
                {
                    if (!string.IsNullOrWhiteSpace(userToAdd.Email))
                    {
                        _logger.LogInformation(
                            "Preparing to send 'user-added-to-project' email notification. TargetUserId: {TargetUserId}, TargetEmail: {TargetEmail}, ProjectId: {ProjectId}",
                            request.UserId,
                            userToAdd.Email,
                            team.ProjectId
                        );

                        var templateData = new Dictionary<string, object>
                        {
                            ["RecipientName"] = userToAdd.DisplayName,
                            ["ProjectName"] = project.Name,
                            ["TeamName"] = team.Name,
                            ["AddedByName"] = actor.DisplayName,
                            ["ProjectUrl"] = $"https://yourapp.com/projects/{team.ProjectId}",
                        };

                        await _notificationService.SendEmailNotificationAsync(
                            "UserAddedToProject",
                            "user-added-to-project",
                            request.UserId,
                            userToAdd.Email,
                            templateData
                        );

                        _logger.LogInformation(
                            "Email notification sent for 'user-added-to-project'. TargetEmail: {TargetEmail}",
                            userToAdd.Email
                        );
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Cannot send email notification: User email is null or empty. UserId: {UserId}",
                            request.UserId
                        );
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(
                        emailEx,
                        "ERROR sending 'user-added-to-project' email notification. UserId: {UserId}, ProjectId: {ProjectId}, Error: {ErrorMessage}",
                        request.UserId,
                        team.ProjectId,
                        emailEx.Message
                    );
                    // Don't throw - email failure shouldn't break the team member addition
                }

                // Create DTO - use userToAdd for user info since we already have it loaded
                TeamMemberDTO dto;
                try
                {
                    dto = new TeamMemberDTO
                    {
                        TeamMemberId = finalMember.TeamMemberId,
                        UserId = finalMember.UserId,
                        UserName = userToAdd.DisplayName ?? string.Empty,
                        Email = userToAdd.Email ?? string.Empty,
                        Department = userToAdd.Department,
                        Designation = userToAdd.Designation,
                        Role = userToAdd.Role,
                        JoinedDate = finalMember.JoinedDate,
                        IsActive = finalMember.IsActive,
                    };
                }
                catch (Exception dtoEx)
                {
                    _logger.LogError(dtoEx, "Error creating TeamMemberDTO. TeamId={TeamId}, UserId={UserId}, Error: {ErrorMessage}", teamId, request.UserId, dtoEx.Message);
                    // Fallback DTO with minimal data
                    dto = new TeamMemberDTO
                    {
                        TeamMemberId = finalMember.TeamMemberId,
                        UserId = finalMember.UserId,
                        UserName = userToAdd?.DisplayName ?? "Unknown",
                        Email = userToAdd?.Email ?? string.Empty,
                        Department = userToAdd?.Department,
                        Designation = userToAdd?.Designation,
                        Role = userToAdd?.Role ?? UserRole.TeamMember,
                        JoinedDate = finalMember.JoinedDate,
                        IsActive = finalMember.IsActive,
                    };
                }

                return Success(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error adding member to team. TeamId={TeamId}, UserId={UserId}, ExceptionType={ExceptionType}, Message={Message}, StackTrace={StackTrace}",
                    teamId,
                    request.UserId,
                    ex.GetType().Name,
                    ex.Message,
                    ex.StackTrace
                );
                return Fail<TeamMemberDTO>($"An error occurred while adding member: {ex.Message}", 500);
            }
        }

        public async Task<ApiResponse<bool>> RemoveMemberFromTeamAsync(
            Guid teamId,
            Guid userId,
            Guid actorUserId
        )
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (
                    actor == null
                    || (actor.Role != UserRole.ProjectManager && actor.Role != UserRole.Admin)
                )
                {
                    return Fail<bool>("Forbidden", 403);
                }

                var team = await _teamRepo.GetByIdAsync(teamId);
                if (team == null)
                {
                    return Fail<bool>("Team not found", 404);
                }

                var project = await _projectRepo.GetByIdAsync(team.ProjectId);
                if (project == null || actor.OrganizationId != project.OrganizationId)
                {
                    return Fail<bool>("Access denied", 403);
                }

                if (
                    actor.Role == UserRole.ProjectManager
                    && project.ProjectManagerId != actorUserId
                )
                {
                    return Fail<bool>("You can only manage teams for your own projects", 403);
                }

                // Cannot remove team lead via this method
                if (team.TeamLeadId == userId)
                {
                    return Fail<bool>(
                        "Cannot remove team lead. Update the team to change the team lead.",
                        400
                    );
                }

                if (!await _teamRepo.IsUserInTeamAsync(teamId, userId))
                {
                    return Fail<bool>("User is not a member of this team", 404);
                }

                await _teamRepo.RemoveMemberAsync(teamId, userId);

                // Unassign the user from all tasks in this project and remove as reviewer
                var unassignedCount = await _taskRepo.UnassignUserFromProjectTasksAsync(
                    team.ProjectId,
                    userId
                );
                var reviewerRemovedCount =
                    await _taskRepo.RemoveUserAsReviewerFromProjectTasksAsync(
                        team.ProjectId,
                        userId
                    );

                _logger.LogInformation(
                    "Member removed from team. Unassigned from {UnassignedCount} tasks, removed as reviewer from {ReviewerCount} tasks. TeamId={TeamId}, UserId={UserId}, ActorUserId={ActorUserId}",
                    unassignedCount,
                    reviewerRemovedCount,
                    teamId,
                    userId,
                    actorUserId
                );

                return Success(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error removing member from team. TeamId={TeamId}, UserId={UserId}",
                    teamId,
                    userId
                );
                return Fail<bool>("An error occurred while removing member", 500);
            }
        }

        public async Task<ApiResponse<List<ProjectTeamsDTO>>> SearchProjectsWithTeamsAsync(
            string? searchTerm,
            Guid actorUserId
        )
        {
            try
            {
                var actor = await _userRepo.GetByIdAsync(actorUserId);
                if (actor == null)
                {
                    return Fail<List<ProjectTeamsDTO>>("Unauthorized", 401);
                }

                // Get projects for this PM in their organization
                var projectsQuery = _context
                    .Projects.Include(p => p.ProjectManager)
                    .Where(p => p.OrganizationId == actor.OrganizationId);

                // If PM, only show their projects
                if (actor.Role == UserRole.ProjectManager)
                {
                    projectsQuery = projectsQuery.Where(p => p.ProjectManagerId == actorUserId);
                }

                // Apply search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.ToLower();
                    projectsQuery = projectsQuery.Where(p =>
                        p.Name.ToLower().Contains(term) || p.Code.ToLower().Contains(term)
                    );
                }

                var projects = await projectsQuery.OrderBy(p => p.Name).Take(20).ToListAsync();

                var result = new List<ProjectTeamsDTO>();

                foreach (var project in projects)
                {
                    var teams = await _teamRepo.GetByProjectIdWithMembersAsync(project.ProjectId);

                    result.Add(
                        new ProjectTeamsDTO
                        {
                            ProjectId = project.ProjectId,
                            ProjectName = project.Name,
                            ProjectCode = project.Code,
                            ProjectManagerName =
                                project.ProjectManager?.DisplayName ?? string.Empty,
                            TotalTeams = teams.Count,
                            TotalMembers =
                                teams.Sum(t => t.Members.Count(m => m.IsActive)) + teams.Count,
                            Teams = teams.Select(MapTeamToDTO).ToList(),
                        }
                    );
                }

                return Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error searching projects with teams. SearchTerm={SearchTerm}",
                    searchTerm
                );
                return Fail<List<ProjectTeamsDTO>>("An error occurred", 500);
            }
        }

        private TeamDTO MapTeamToDTO(Team team)
        {
            return new TeamDTO
            {
                TeamId = team.TeamId,
                ProjectId = team.ProjectId,
                ProjectName = team.Project?.Name ?? string.Empty,
                Name = team.Name,
                Description = team.Description,
                TeamLeadId = team.TeamLeadId,
                TeamLeadName = team.TeamLead?.DisplayName ?? string.Empty,
                TeamLeadEmail = team.TeamLead?.Email ?? string.Empty,
                MemberCount = team.Members?.Count(m => m.IsActive) ?? 0,
                IsActive = team.IsActive,
                CreatedDate = team.CreatedDate,
                Members =
                    team.Members?.Where(m => m.IsActive)
                        .Select(m => new TeamMemberDTO
                        {
                            TeamMemberId = m.TeamMemberId,
                            UserId = m.UserId,
                            UserName = m.User?.DisplayName ?? string.Empty,
                            Email = m.User?.Email ?? string.Empty,
                            Department = m.User?.Department,
                            Designation = m.User?.Designation,
                            Role = m.User?.Role ?? UserRole.TeamMember,
                            JoinedDate = m.JoinedDate,
                            IsActive = m.IsActive,
                        })
                        .ToList()
                    ?? new List<TeamMemberDTO>(),
            };
        }

        private ApiResponse<T> Success<T>(T data) =>
            new()
            {
                Success = true,
                Data = data,
                StatusCode = 200,
            };

        private ApiResponse<T> Fail<T>(string message, int statusCode) =>
            new()
            {
                Success = false,
                Message = message,
                StatusCode = statusCode,
            };
    }
}
