using AutoMapper;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Mapping
{
//AutoMapper profile for the Project Allocation System.
// Contains mappings between Entity models and DTOs.
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ==================== USER MAPPINGS ====================
            CreateMap<User, UserDTO>()
                .ForMember(dest => dest.OrganizationName,
                    opt => opt.MapFrom(src => src.Organization != null ? src.Organization.Name : string.Empty));

            // ==================== PROJECT MAPPINGS ====================
            CreateMap<Project, ProjectDTO>()
                .ForMember(dest => dest.OrganizationName,
                    opt => opt.MapFrom(src => src.Organization != null ? src.Organization.Name : string.Empty))
                .ForMember(dest => dest.ProjectManagerName,
                    opt => opt.MapFrom(src => src.ProjectManager != null ? src.ProjectManager.DisplayName : string.Empty));

            CreateMap<ProjectCreateRequest, Project>()
                .ForMember(dest => dest.ProjectId, opt => opt.Ignore())
                .ForMember(dest => dest.OrganizationId, opt => opt.Ignore())
                .ForMember(dest => dest.SpentBudget, opt => opt.Ignore())
                .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Organization, opt => opt.Ignore())
                .ForMember(dest => dest.ProjectManager, opt => opt.Ignore())
                .ForMember(dest => dest.Allocations, opt => opt.Ignore())
                .ForMember(dest => dest.Tasks, opt => opt.Ignore())
                .ForMember(dest => dest.ActualStartDate, opt => opt.Ignore())
                .ForMember(dest => dest.ActualEndDate, opt => opt.Ignore());

            // ==================== SPRINT MAPPINGS ====================
            CreateMap<Sprint, SprintDTO>()
                .ForMember(dest => dest.ProjectName,
                    opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : string.Empty))
                .ForMember(dest => dest.StatusDisplay,
                    opt => opt.MapFrom(src => src.Status.GetDisplayName()))
                .ForMember(dest => dest.TotalTasks,
                    opt => opt.MapFrom(src => src.Tasks != null ? src.Tasks.Count : 0))
                .ForMember(dest => dest.CompletedTasks,
                    opt => opt.MapFrom(src => src.Tasks != null ? src.Tasks.Count(t => t.Status == TaskStatuses.Done) : 0))
                .ForMember(dest => dest.TeamMemberCount,
                    opt => opt.MapFrom(src => src.SprintMembers != null ? src.SprintMembers.Count : 0))
                .ForMember(dest => dest.DaysRemaining, opt => opt.Ignore()) // Calculated at runtime
                .ForMember(dest => dest.DurationInDays, opt => opt.Ignore()) // Calculated at runtime
                .ForMember(dest => dest.ProgressPercentage, opt => opt.Ignore()) // Calculated at runtime
                .ForMember(dest => dest.Members, opt => opt.Ignore()) // Mapped separately with calculation
                .ForMember(dest => dest.TimeSummary, opt => opt.Ignore()); // Mapped separately

            CreateMap<SprintMember, SprintMemberDTO>()
                .ForMember(dest => dest.UserName,
                    opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : string.Empty))
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
                .ForMember(dest => dest.Role,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Role : UserRole.TeamMember))
                .ForMember(dest => dest.UtilizationPercentage, opt => opt.Ignore()); // Calculated at runtime

            CreateMap<SprintCreateRequest, Sprint>()
                .ForMember(dest => dest.SprintId, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedStoryPoints, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => SprintStatus.Planned))
                .ForMember(dest => dest.ActualStartDate, opt => opt.Ignore())
                .ForMember(dest => dest.ActualEndDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Project, opt => opt.Ignore())
                .ForMember(dest => dest.Tasks, opt => opt.Ignore())
                .ForMember(dest => dest.SprintMembers, opt => opt.Ignore());

            // ==================== TASK MAPPINGS ====================
            CreateMap<WorkTask, TaskDTO>()
                .ForMember(dest => dest.ProjectName,
                    opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : string.Empty))
                .ForMember(dest => dest.SprintName,
                    opt => opt.MapFrom(src => src.Sprint != null ? src.Sprint.Name : string.Empty))
                .ForMember(dest => dest.TaskTypeDisplay,
                    opt => opt.MapFrom(src => src.TaskType.ToString()))
                .ForMember(dest => dest.PriorityDisplay,
                    opt => opt.MapFrom(src => src.Priority.ToString()))
                .ForMember(dest => dest.StatusDisplay,
                    opt => opt.MapFrom(src => src.Status.GetDisplayName()))
                .ForMember(dest => dest.AssignedToUserName,
                    opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.DisplayName : string.Empty))
                .ForMember(dest => dest.AssignedByUserName,
                    opt => opt.MapFrom(src => src.AssignedByUser != null ? src.AssignedByUser.DisplayName : string.Empty))
                .ForMember(dest => dest.ReviewerName,
                    opt => opt.MapFrom(src => src.Reviewer != null ? src.Reviewer.DisplayName : string.Empty))
                .ForMember(dest => dest.AcceptanceCriteria,
                    opt => opt.MapFrom(src => src.AcceptanceCriteria ?? string.Empty))
                .ForMember(dest => dest.EffortCategory,
                    opt => opt.MapFrom(src => src.EffortCategory ?? string.Empty))
                .ForMember(dest => dest.CommentCount,
                    opt => opt.MapFrom(src => src.Comments != null ? src.Comments.Count : 0))
                .ForMember(dest => dest.IsOverdue, opt => opt.Ignore()) // Calculated at runtime
                .ForMember(dest => dest.DaysUntilDue, opt => opt.Ignore()) // Calculated at runtime
                .ForMember(dest => dest.SkillsRequired,
                    opt => opt.MapFrom(src => src.SkillsRequired ?? string.Empty));

            CreateMap<TaskCreateRequest, WorkTask>()
                .ForMember(dest => dest.TaskId, opt => opt.Ignore())
                .ForMember(dest => dest.TaskCode, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => TaskStatuses.NotStarted))
                .ForMember(dest => dest.ActualHours, opt => opt.MapFrom(src => 0m))
                .ForMember(dest => dest.ProgressPercentage, opt => opt.MapFrom(src => 0))
                .ForMember(dest => dest.AssignedByUserId, opt => opt.Ignore())
                .ForMember(dest => dest.ActualStartDate, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedDate, opt => opt.Ignore())
                .ForMember(dest => dest.Attachments, opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.SkillsRequired, opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.AcceptanceCriteria,
                    opt => opt.MapFrom(src => src.AcceptanceCriteria ?? string.Empty))
                .ForMember(dest => dest.EffortCategory,
                    opt => opt.MapFrom(src => src.EffortCategory ?? string.Empty))
                .ForMember(dest => dest.Project, opt => opt.Ignore())
                .ForMember(dest => dest.Sprint, opt => opt.Ignore())
                .ForMember(dest => dest.AssignedToUser, opt => opt.Ignore())
                .ForMember(dest => dest.AssignedByUser, opt => opt.Ignore())
                .ForMember(dest => dest.Reviewer, opt => opt.Ignore())
                .ForMember(dest => dest.Comments, opt => opt.Ignore())
                .ForMember(dest => dest.TimeLogs, opt => opt.Ignore())
                .ForMember(dest => dest.Dependencies, opt => opt.Ignore())
                .ForMember(dest => dest.SourceLinks, opt => opt.Ignore())
                .ForMember(dest => dest.TargetLinks, opt => opt.Ignore());

            CreateMap<TaskComment, TaskCommentDTO>()
                .ForMember(dest => dest.UserName,
                    opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : string.Empty))
                .ForMember(dest => dest.TaggedUserName,
                    opt => opt.MapFrom(src => src.TaggedUser != null ? src.TaggedUser.DisplayName : string.Empty));

            CreateMap<TaskCommentRequest, TaskComment>()
                .ForMember(dest => dest.CommentId, opt => opt.Ignore())
                .ForMember(dest => dest.TaskId, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.IsResolved, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.CodeSnippet,
                    opt => opt.MapFrom(src => src.CodeSnippet ?? string.Empty))
                .ForMember(dest => dest.Attachments, opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.Task, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.TaggedUser, opt => opt.Ignore());

            // ==================== PROJECT ALLOCATION MAPPINGS ====================
            CreateMap<ProjectAllocation, ProjectAllocationDTO>()
                .ForMember(dest => dest.UserName,
                    opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : string.Empty))
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
                .ForMember(dest => dest.Role,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Role : UserRole.TeamMember))
                .ForMember(dest => dest.TeamName,
                    opt => opt.MapFrom(src => src.TeamName ?? string.Empty));

            // ==================== WORK ITEM LINK MAPPINGS ====================
            CreateMap<WorkItemLink, WorkItemLinkDTO>()
                .ForMember(dest => dest.SourceTaskCode,
                    opt => opt.MapFrom(src => src.SourceTask != null ? src.SourceTask.TaskCode : string.Empty))
                .ForMember(dest => dest.SourceTaskTitle,
                    opt => opt.MapFrom(src => src.SourceTask != null ? src.SourceTask.Title : string.Empty))
                .ForMember(dest => dest.TargetTaskCode,
                    opt => opt.MapFrom(src => src.TargetTask != null ? src.TargetTask.TaskCode : string.Empty))
                .ForMember(dest => dest.TargetTaskTitle,
                    opt => opt.MapFrom(src => src.TargetTask != null ? src.TargetTask.Title : string.Empty))
                .ForMember(dest => dest.LinkTypeDisplay,
                    opt => opt.MapFrom(src => src.LinkType.ToString()))
                .ForMember(dest => dest.CreatedByUserEmail,
                    opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.Email : string.Empty))
                .ForMember(dest => dest.Comment,
                    opt => opt.MapFrom(src => src.Comment ?? string.Empty));

            CreateMap<CreateWorkItemLinkRequest, WorkItemLink>()
                .ForMember(dest => dest.WorkItemLinkId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
                .ForMember(dest => dest.SourceTask, opt => opt.Ignore())
                .ForMember(dest => dest.TargetTask, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore());

            // ==================== AUDIT LOG MAPPINGS ====================
            CreateMap<AuditLog, AuditLogDto>()
                .ForMember(dest => dest.AuditLogId,
                    opt => opt.MapFrom(src => src.AuditLogId.ToString()))
                .ForMember(dest => dest.EntityId,
                    opt => opt.MapFrom(src => src.EntityId.ToString()))
                .ForMember(dest => dest.UserId,
                    opt => opt.MapFrom(src => src.UserId.ToString()))
                .ForMember(dest => dest.CreatedDate,
                    opt => opt.MapFrom(src => src.CreatedDate.ToString("yyyy-MM-dd HH:mm:ss")));

            // ==================== TEAM MAPPINGS ====================
            CreateMap<Team, TeamDTO>()
                .ForMember(dest => dest.ProjectName,
                    opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : string.Empty))
                .ForMember(dest => dest.TeamLeadName,
                    opt => opt.MapFrom(src => src.TeamLead != null ? src.TeamLead.DisplayName : string.Empty))
                .ForMember(dest => dest.TeamLeadEmail,
                    opt => opt.MapFrom(src => src.TeamLead != null ? src.TeamLead.Email : string.Empty))
                .ForMember(dest => dest.MemberCount,
                    opt => opt.MapFrom(src => src.Members != null ? src.Members.Count(m => m.IsActive) : 0))
                .ForMember(dest => dest.Members, opt => opt.Ignore()); // Mapped separately

            CreateMap<TeamMember, TeamMemberDTO>()
                .ForMember(dest => dest.UserName,
                    opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : string.Empty))
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
                .ForMember(dest => dest.Department,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Department : string.Empty))
                .ForMember(dest => dest.Designation,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Designation : string.Empty))
                .ForMember(dest => dest.Role,
                    opt => opt.MapFrom(src => src.User != null ? src.User.Role : UserRole.TeamMember));
        }
    }
}
