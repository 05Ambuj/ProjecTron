using System;
using System.Collections.Generic;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.DTOs
{
    public class TeamDTO
    {
        public Guid TeamId { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        // Team Lead info
        public Guid TeamLeadId { get; set; }
        public string TeamLeadName { get; set; } = string.Empty;
        public string TeamLeadEmail { get; set; } = string.Empty;
        
        public int MemberCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        
        public List<TeamMemberDTO> Members { get; set; } = new();
    }

    public class TeamMemberDTO
    {
        public Guid TeamMemberId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? Designation { get; set; }
        public UserRole Role { get; set; }
        public DateTime JoinedDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTeamRequest
    {
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid TeamLeadId { get; set; }
    }

    public class UpdateTeamRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public Guid? TeamLeadId { get; set; }
    }

    public class AddTeamMemberRequest
    {
        public Guid UserId { get; set; }
    }

    public class TeamSummaryDTO
    {
        public Guid TeamId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string TeamLeadName { get; set; } = string.Empty;
        public int MemberCount { get; set; }
    }

    public class ProjectTeamsDTO
    {
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectManagerName { get; set; } = string.Empty;
        public int TotalTeams { get; set; }
        public int TotalMembers { get; set; }
        public List<TeamDTO> Teams { get; set; } = new();
    }
}
