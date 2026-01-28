using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.DTOs
{
    public class TaskDTO
    {
        public Guid TaskId { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; }
        public Guid? SprintId { get; set; }
        public string SprintName { get; set; }
        public string TaskCode { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public TaskType TaskType { get; set; }
        public string TaskTypeDisplay { get; set; }
        public TaskPriority Priority { get; set; }
        public string PriorityDisplay { get; set; }
        public TaskStatuses Status { get; set; }
        public string StatusDisplay { get; set; }
        public ComplexityLevel Complexity { get; set; }
        public RiskLevel RiskLevel { get; set; }
        public int StoryPoints { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal ActualHours { get; set; }
        public int ProgressPercentage { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string AssignedToUserName { get; set; }
        public Guid AssignedByUserId { get; set; }
        public string AssignedByUserName { get; set; }
        public Guid? ReviewerId { get; set; }
        public string ReviewerName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string AcceptanceCriteria { get; set; }
        public string EffortCategory { get; set; }
        public string SkillsRequired { get; set; }
        public int CommentCount { get; set; }
        public bool IsOverdue { get; set; }
        public int DaysUntilDue { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; }
    }

    public class TaskCreateRequest
    {
        [Required]
        public Guid ProjectId { get; set; }
        [Required]
        public Guid SprintId { get; set; }
        [Required]
        [MaxLength(255)]
        public string Title { get; set; }
        [Required]
        public string Description { get; set; }
        public TaskType TaskType { get; set; } = TaskType.Feature;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public ComplexityLevel Complexity { get; set; } = ComplexityLevel.Medium;
        public RiskLevel RiskLevel { get; set; } = RiskLevel.Low;
        [Range(1, 100)]
        public int StoryPoints { get; set; } = 5;
        [Range(0.5, 1000)]
        public decimal EstimatedHours { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public Guid? ReviewerId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string? AcceptanceCriteria { get; set; }
        public string? EffortCategory { get; set; }
        public List<Guid> DependsOnTaskIds { get; set; } = new List<Guid>();
    }

    public class TaskUpdateRequest
    {
        [MaxLength(255)]
        public string? Title { get; set; } // Made nullable since it's optional for updates

        public string? Description { get; set; }
        public TaskType? TaskType { get; set; }
        public TaskPriority? Priority { get; set; }
        public ComplexityLevel? Complexity { get; set; }
        public RiskLevel? RiskLevel { get; set; }
        [Range(1, 100)]
        public int? StoryPoints { get; set; }
        [Range(0.5, 1000)]
        public decimal? EstimatedHours { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public Guid? ReviewerId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string? AcceptanceCriteria { get; set; }
        public string? EffortCategory { get; set; }
        [Range(0, 10000)]
        public decimal? ActualHours { get; set; }
    }

    public class TaskStatusUpdateRequest
    {
        [Required]
        public TaskStatuses NewStatus { get; set; }
        public string Comment { get; set; }
        [Range(0, 100)]
        public int? ProgressPercentage { get; set; }
        public decimal? HoursLogged { get; set; }
    }

    public class TaskAssignmentRequest
    {
        [Required]
        public Guid AssignedToUserId { get; set; }
        public Guid? ReviewerId { get; set; }
        public string AssignmentNote { get; set; }
    }

    public class TaskTimeLogRequest
    {
        [Required]
        [Range(0.1, 24)]
        public decimal HoursLogged { get; set; }
        [Required]
        public DateTime LogDate { get; set; }
        [MaxLength(500)]
        public string Description { get; set; }
    }

    public class TaskCommentRequest
    {
        [Required]
        public string Text { get; set; }
        public CommentType CommentType { get; set; } = CommentType.General;
        public bool IsBlocking { get; set; } = false;
        public Guid? TaggedUserId { get; set; }
        public string? CodeSnippet { get; set; } // Made nullable since it's optional
    }

    public class TaskCommentDTO
    {
        public Guid CommentId { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string Text { get; set; }
        public CommentType CommentType { get; set; }
        public bool IsBlocking { get; set; }
        public bool IsResolved { get; set; }
        public Guid? TaggedUserId { get; set; }
        public string TaggedUserName { get; set; }
        public string CodeSnippet { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }

    public class TaskFilterRequest
    {
        public Guid? ProjectId { get; set; }
        public Guid? SprintId { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public TaskStatuses? Status { get; set; }
        public TaskPriority? Priority { get; set; }
        public bool? IsOverdue { get; set; }
        public string? SearchTerm { get; set; } // Made nullable since it's optional
        public List<Guid>? ProjectIds { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class TaskBoardColumnDto
    {
        public TaskStatuses Status { get; set; }
        public string StatusName { get; set; }
        public List<TaskDTO> Tasks { get; set; } = new();
    }

    public class TaskBoardDto
    {
        public Guid ProjectId { get; set; }
        public List<TaskBoardColumnDto> Columns { get; set; } = new();
    }

    public class WorkItemLinkDTO
    {
        public Guid WorkItemLinkId { get; set; }
        public Guid SourceTaskId { get; set; }
        public string SourceTaskCode { get; set; }
        public string SourceTaskTitle { get; set; }
        public Guid TargetTaskId { get; set; }
        public string TargetTaskCode { get; set; }
        public string TargetTaskTitle { get; set; }
        public WorkItemLinkType LinkType { get; set; }
        public string LinkTypeDisplay { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedDate { get; set; }
        public Guid CreatedByUserId { get; set; }
        public string CreatedByUserEmail { get; set; }
    }

    public class CreateWorkItemLinkRequest
    {
        [Required]
        public Guid SourceTaskId { get; set; }

        [Required]
        public Guid TargetTaskId { get; set; }

        [Required]
        public WorkItemLinkType LinkType { get; set; }

        public string Comment { get; set; }
    }
}