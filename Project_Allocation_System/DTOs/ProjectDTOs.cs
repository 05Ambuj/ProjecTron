using System;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.DTOs
{
    public class ProjectDTO
    {
        public Guid ProjectId { get; set; }
        public Guid OrganizationId { get; set; }
        public string OrganizationName { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid ProjectManagerId { get; set; }
        public string ProjectManagerName { get; set; }
        public ProjectStatus Status { get; set; }
        public ProjectPriority Priority { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }
        public decimal Budget { get; set; }
        public decimal SpentBudget { get; set; }
        public int ProgressPercentage { get; set; }
        public int MaxAllocations { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }
    }

    public class ProjectCreateRequest
    {
        public Guid OrganizationId { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        public Guid ProjectManagerId { get; set; }
        public string? ProjectManagerName { get; set; } // Optional - resolved from ProjectManagerId
        public ProjectStatus Status { get; set; } = ProjectStatus.Planned;
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Budget { get; set; }
        public int MaxAllocations { get; set; }
    }

    public class ProjectUpdateRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public Guid? ProjectManagerId { get; set; }
        public string? ProjectManagerName { get; set; }
        public ProjectStatus? Status { get; set; }
        public ProjectPriority? Priority { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Budget { get; set; }
        public int? ProgressPercentage { get; set; }
        public int? MaxAllocations { get; set; }
    }

    public class ProjectManagerDashboardDto
    {
        public int ProjectsCount { get; set; }
        public int ActiveSprints { get; set; }
        public int OpenTasks { get; set; }
        public int OverdueTasks { get; set; }
    }

    public class ProjectFilterRequest
    {
        public string? SearchTerm { get; set; }
        public ProjectStatus? Status { get; set; }
        public ProjectPriority? Priority { get; set; }
        public Guid? OrganizationId { get; set; }
        public Guid? ProjectManagerId { get; set; }
        public string? SortBy { get; set; } // "name", "code", "status", "priority", "createdDate", "progressPercentage"
        public string? SortOrder { get; set; } // "asc", "desc"
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
