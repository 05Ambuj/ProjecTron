using System;

namespace Project_Allocation_System.Models
{
    public class ProjectAllocation
    {
        public Guid AllocationId { get; set; }
        public Guid ProjectId { get; set; }
        public Guid UserId { get; set; }

        public string TeamName { get; set; }
        public int AllocationPercentage { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }

        public virtual Project Project { get; set; }
        public virtual User User { get; set; }
    }
}