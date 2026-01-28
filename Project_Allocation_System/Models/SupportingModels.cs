using System;

namespace Project_Allocation_System.Models
{
    public class AuditLog
    {
        public Guid AuditLogId { get; set; }
        public string EntityType { get; set; } = string.Empty; // "Task", "Sprint", "Project", etc.
        public Guid EntityId { get; set; }
        public string Action { get; set; } = string.Empty; // "Created", "Updated", "Deleted", "StatusChanged", etc.
        public string? FieldName { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public Guid UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? IpAddress { get; set; }
    }

    public enum WorkItemLinkType
    {
        Related = 1,
        Duplicate = 2,
        Parent = 3,
        Child = 4,
        Predecessor = 5,
        Successor = 6,
        TestedBy = 7,
        Tests = 8,
        ConsumesFrom = 9,
        ProducesFor = 10
    }

    public class WorkItemLink
    {
        public Guid WorkItemLinkId { get; set; }
        public Guid SourceTaskId { get; set; }
        public Guid TargetTaskId { get; set; }
        public WorkItemLinkType LinkType { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedDate { get; set; }
        public Guid CreatedByUserId { get; set; }

        // Navigation Properties
        public virtual WorkTask? SourceTask { get; set; }
        public virtual WorkTask? TargetTask { get; set; }
        public virtual User? CreatedByUser { get; set; }
    }
}
