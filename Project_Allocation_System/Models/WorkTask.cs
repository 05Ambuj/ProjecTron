using System;
using System.Collections.Generic;

namespace Project_Allocation_System.Models
{
    public class WorkTask
    {
        public Guid TaskId { get; set; }
        public Guid ProjectId { get; set; }
        public Guid? SprintId { get; set; }

        // Task Identification
        public string TaskCode { get; set; } // e.g., PROJ-101
        public string Title { get; set; }
        public string Description { get; set; }

        // Task Classification
        public TaskType TaskType { get; set; } = TaskType.Feature;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public TaskStatuses Status { get; set; } = TaskStatuses.NotStarted;
        public ComplexityLevel Complexity { get; set; } = ComplexityLevel.Medium;
        public RiskLevel RiskLevel { get; set; } = RiskLevel.Low;

        // Estimation & Tracking
        public int StoryPoints { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal ActualHours { get; set; } = 0;
        public int ProgressPercentage { get; set; } = 0;

        // Assignment
        public Guid? AssignedToUserId { get; set; }
        public Guid AssignedByUserId { get; set; }
        public Guid? ReviewerId { get; set; }

        // Dates
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? CompletedDate { get; set; }

        // Acceptance Criteria & Attachments
        public string AcceptanceCriteria { get; set; } // JSON or delimited string
        public string Attachments { get; set; } // JSON array of file paths/URLs

        // Custom Fields
        public string EffortCategory { get; set; }
        public string SkillsRequired { get; set; }

        // Metadata
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }

        // Navigation Properties
        public virtual Project Project { get; set; }
        public virtual Sprint Sprint { get; set; }
        public virtual User AssignedToUser { get; set; }
        public virtual User AssignedByUser { get; set; }
        public virtual User Reviewer { get; set; }
        public virtual ICollection<TaskComment> Comments { get; set; }
        public virtual ICollection<TaskTimeLog> TimeLogs { get; set; }
        public virtual ICollection<TaskDependency> Dependencies { get; set; }
        public virtual ICollection<WorkItemLink> SourceLinks { get; set; }
        public virtual ICollection<WorkItemLink> TargetLinks { get; set; }
    }

    public class TaskDependency
    {
        public Guid TaskDependencyId { get; set; }
        public Guid TaskId { get; set; }
        public Guid DependsOnTaskId { get; set; }

        public DependencyType DependencyType { get; set; }

        public DateTime CreatedDate { get; set; }

        public virtual WorkTask Task { get; set; }
        public virtual WorkTask DependsOnTask { get; set; }
    }

    public class TaskTimeLog
    {
        public Guid TimeLogId { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }

        public decimal HoursLogged { get; set; }
        public DateTime LogDate { get; set; }
        public string Description { get; set; }

        public DateTime CreatedDate { get; set; }

        public virtual WorkTask Task { get; set; }
        public virtual User User { get; set; }
    }

    public class TaskComment
    {
        public Guid CommentId { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }

        public string Text { get; set; }
        public CommentType CommentType { get; set; } = CommentType.General;

        public bool IsBlocking { get; set; } = false;
        public bool IsResolved { get; set; } = false;

        public Guid? TaggedUserId { get; set; }
        public string CodeSnippet { get; set; }
        public string Attachments { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }

        public virtual WorkTask Task { get; set; }
        public virtual User User { get; set; }
        public virtual User TaggedUser { get; set; }
    }

}