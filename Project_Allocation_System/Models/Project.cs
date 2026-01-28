using System;
using System.Collections.Generic;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Models
{

    public class Project
    {
        public Guid ProjectId { get; set; }
        public Guid OrganizationId { get; set; }

        public string Code { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        public Guid ProjectManagerId { get; set; }

        public ProjectStatus Status { get; set; } = ProjectStatus.Planned;
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        public decimal Budget { get; set; }
        public decimal SpentBudget { get; set; } = 0;
        public int MaxAllocations { get; set; } = 0;

        public int ProgressPercentage { get; set; } = 0;

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }

        public virtual Organization Organization { get; set; }
        public virtual User ProjectManager { get; set; }
        public virtual ICollection<ProjectAllocation> Allocations { get; set; }
        public virtual ICollection<WorkTask> Tasks { get; set; }
    }
}