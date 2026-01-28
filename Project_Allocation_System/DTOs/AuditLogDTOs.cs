using System;

namespace Project_Allocation_System.DTOs
{
    public class AuditLogDto
    {
        public string AuditLogId { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? FieldName { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string CreatedDate { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
    }

    public class AuditLogFilterRequest
    {
        public string? EntityType { get; set; }
        public string? Action { get; set; }
        public string? UserEmail { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
