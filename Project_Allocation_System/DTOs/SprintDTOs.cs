using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.DTOs
{
    public class SprintDTO
    {
        public Guid SprintId { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; }

        public string Name { get; set; }
        public string Goals { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int ProgressPercentage { get; set; }

        public SprintStatus Status { get; set; }
        public string StatusDisplay { get; set; }

        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TeamMemberCount { get; set; }

        public int DaysRemaining { get; set; }
        public int DurationInDays { get; set; }

        public string Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }

        public List<SprintMemberDTO> Members { get; set; }
        public SprintTimeSummaryDTO? TimeSummary { get; set; }

    }

    public class SprintMemberDTO
    {
        public Guid SprintMemberId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public UserRole Role { get; set; }

        public int AvailableHoursPerWeek { get; set; }
        public int AllocatedStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int UtilizationPercentage { get; set; }
    }

    public class SprintCreateRequest
    {
        [Required]
        public Guid ProjectId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        [Required]
        public string Goals { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Range(1, 1000)]
        public int TotalStoryPoints { get; set; } = 50;

        public string Notes { get; set; }

        public List<SprintMemberCreateRequest> Members { get; set; } = new List<SprintMemberCreateRequest>();
    }

    public class SprintMemberCreateRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Range(1, 80)]
        public int AvailableHoursPerWeek { get; set; } = 40;

        [Range(0, 100)]
        public int AllocatedStoryPoints { get; set; } = 0;
    }

    public class SprintUpdateRequest
    {
        [MaxLength(200)]
        public string Name { get; set; }

        public string Goals { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Range(1, 1000)]
        public int? TotalStoryPoints { get; set; }

        public SprintStatus? Status { get; set; }

        public string Notes { get; set; }
    }

    public class SprintStatsDTO
    {
        public Guid SprintId { get; set; }
        public string SprintName { get; set; }

        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int RemainingStoryPoints { get; set; }

        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }

        public decimal TeamVelocity { get; set; }
        public decimal AverageTaskCompletionTime { get; set; }

        public Dictionary<string, int> TasksByStatus { get; set; }
        public Dictionary<string, int> TasksByPriority { get; set; }

        public List<TeamMemberProgressDTO> MemberProgress { get; set; }
    }

    public class TeamMemberProgressDTO
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public int AssignedTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int AllocatedStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public decimal CompletionPercentage { get; set; }
    }

    public class SprintBurndownDTO
    {
        public Guid SprintId { get; set; }
        public string SprintName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalStoryPoints { get; set; }
        public List<BurndownDataPoint> DataPoints { get; set; }
        public int IdealBurndownRate { get; set; } // Story points per day
        public decimal ActualBurndownRate { get; set; }
        public bool IsOnTrack { get; set; }
    }

    public class BurndownDataPoint
    {
        public DateTime Date { get; set; }
        public int RemainingStoryPoints { get; set; }
        public int IdealRemainingStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
        public int TasksCompleted { get; set; }
    }

    public class SprintTimeSummaryDTO
    {
        public int DurationDays { get; set; }
        public decimal TotalPlannedHours { get; set; }

        public decimal LoggedHours { get; set; }
        public decimal RemainingHours { get; set; }

        public decimal TimeUtilizationPercentage { get; set; }

        public bool IsOverAllocated { get; set; }

        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        public TimeSpan? ElapsedTime { get; set; }
        public TimeSpan? RemainingTime { get; set; }
    }
}