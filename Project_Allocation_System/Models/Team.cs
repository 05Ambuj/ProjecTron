using System;
using System.Collections.Generic;

namespace Project_Allocation_System.Models
{
    public class Team
    {
        public Guid TeamId { get; set; }
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        // Each team has exactly one team lead
        public Guid TeamLeadId { get; set; }
        
        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? UpdatedBy { get; set; }

        // Navigation Properties
        public virtual Project Project { get; set; } = null!;
        public virtual User TeamLead { get; set; } = null!;
        public virtual ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    }

    public class TeamMember
    {
        public Guid TeamMemberId { get; set; }
        public Guid TeamId { get; set; }
        public Guid UserId { get; set; }
        
        public DateTime JoinedDate { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? UpdatedBy { get; set; }

        // Navigation Properties
        public virtual Team Team { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
