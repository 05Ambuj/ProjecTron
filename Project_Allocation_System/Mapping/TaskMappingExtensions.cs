using AutoMapper;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Mapping
{
    /// <summary>
    /// Extension methods for mapping tasks with runtime calculations.
    /// Use these methods when you need calculated fields like IsOverdue and DaysUntilDue.
    /// </summary>
    public static class TaskMappingExtensions
    {
        /// <summary>
        /// Maps a WorkTask to TaskDTO with runtime calculated fields.
        /// </summary>
        public static TaskDTO ToTaskDTO(this WorkTask task, IMapper mapper)
        {
            var dto = mapper.Map<TaskDTO>(task);
            ApplyRuntimeCalculations(dto, task);
            return dto;
        }

        /// <summary>
        /// Maps a list of WorkTasks to TaskDTOs with runtime calculated fields.
        /// </summary>
        public static List<TaskDTO> ToTaskDTOs(this IEnumerable<WorkTask> tasks, IMapper mapper)
        {
            return tasks.Select(t => t.ToTaskDTO(mapper)).ToList();
        }

        /// <summary>
        /// Applies runtime calculations to a TaskDTO based on the source WorkTask.
        /// </summary>
        private static void ApplyRuntimeCalculations(TaskDTO dto, WorkTask task)
        {
            var now = DateTime.UtcNow;

            // Calculate IsOverdue
            dto.IsOverdue = task.DueDate.HasValue &&
                           task.DueDate.Value < now &&
                           task.Status != TaskStatuses.Done &&
                           task.Status != TaskStatuses.Cancelled;

            // Calculate DaysUntilDue
            dto.DaysUntilDue = task.DueDate.HasValue
                ? (int)(task.DueDate.Value - now).TotalDays
                : 0;
        }
    }

    /// <summary>
    /// Extension methods for mapping sprints with runtime calculations.
    /// </summary>
    public static class SprintMappingExtensions
    {
        /// <summary>
        /// Maps a Sprint to SprintDTO with runtime calculated fields.
        /// </summary>
        public static SprintDTO ToSprintDTO(this Sprint sprint, IMapper mapper, SprintTimeSummaryDTO? timeSummary = null)
        {
            var dto = mapper.Map<SprintDTO>(sprint);
            ApplyRuntimeCalculations(dto, sprint, mapper, timeSummary);
            return dto;
        }

        /// <summary>
        /// Maps a list of Sprints to SprintDTOs with runtime calculated fields.
        /// </summary>
        public static List<SprintDTO> ToSprintDTOs(this IEnumerable<Sprint> sprints, IMapper mapper)
        {
            return sprints.Select(s => s.ToSprintDTO(mapper)).ToList();
        }

        /// <summary>
        /// Applies runtime calculations to a SprintDTO based on the source Sprint.
        /// </summary>
        private static void ApplyRuntimeCalculations(SprintDTO dto, Sprint sprint, IMapper mapper, SprintTimeSummaryDTO? timeSummary)
        {
            var now = DateTime.UtcNow;

            // Calculate DaysRemaining
            dto.DaysRemaining = sprint.Status == SprintStatus.Active
                ? Math.Max(0, (int)(sprint.EndDate - now).TotalDays)
                : 0;

            // Calculate DurationInDays
            dto.DurationInDays = (int)(sprint.EndDate - sprint.StartDate).TotalDays;

            // Calculate ProgressPercentage
            dto.ProgressPercentage = sprint.TotalStoryPoints > 0
                ? (int)((decimal)sprint.CompletedStoryPoints / sprint.TotalStoryPoints * 100)
                : 0;

            // Map Members with UtilizationPercentage calculation
            dto.Members = sprint.SprintMembers?.Select(sm =>
            {
                var memberDto = mapper.Map<SprintMemberDTO>(sm);
                memberDto.UtilizationPercentage = sm.AllocatedStoryPoints > 0
                    ? (int)((decimal)sm.CompletedStoryPoints / sm.AllocatedStoryPoints * 100)
                    : 0;
                return memberDto;
            }).ToList() ?? new List<SprintMemberDTO>();

            // Apply time summary if provided
            dto.TimeSummary = timeSummary;
        }
    }
}
