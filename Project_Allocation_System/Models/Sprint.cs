using System;
using System.Collections.Generic;

namespace Project_Allocation_System.Models
{
    public class Sprint
    {
        public Guid SprintId { get; set; }
        public Guid ProjectId { get; set; }

        public string Name { get; set; }
        public string Goals { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }

        public SprintStatus Status { get; set; } = SprintStatus.Planned;

        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        public string Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }

        // Navigation Properties
        public virtual Project Project { get; set; }
        public virtual ICollection<WorkTask> Tasks { get; set; }
        public virtual ICollection<SprintMember> SprintMembers { get; set; }
    }

    public class SprintMember
    {
        public Guid SprintMemberId { get; set; }
        public Guid SprintId { get; set; }
        public Guid UserId { get; set; }

        public int AvailableHoursPerWeek { get; set; }
        public int AllocatedStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }

        public DateTime CreatedDate { get; set; }

        // Navigation Properties
        public virtual Sprint Sprint { get; set; }
        public virtual User User { get; set; }
    }

    public static class SprintStatusExtensions
    {
        public static string GetDisplayName(this SprintStatus status)
        {
            return status switch
            {
                SprintStatus.Planned => "Planned",
                SprintStatus.Active => "Active",
                SprintStatus.Completed => "Completed",
                SprintStatus.Cancelled => "Cancelled",
                _ => "Unknown"
            };
        }
    }
}