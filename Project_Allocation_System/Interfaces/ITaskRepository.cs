using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface ITaskRepository
    {
        Task<WorkTask?> GetByIdAsync(Guid taskId);
        Task<WorkTask?> GetByIdWithDetailsAsync(Guid taskId);
        Task<List<WorkTask>> GetAllAsync(TaskFilterRequest filter);
        Task<(List<WorkTask> Tasks, int TotalCount)> GetPagedAsync(TaskFilterRequest filter);
        Task<List<WorkTask>> GetByUserIdAsync(Guid userId);
        Task<List<WorkTask>> GetByProjectIdAsync(Guid projectId);
        Task<List<WorkTask>> GetBySprintIdAsync(Guid sprintId);
        Task<List<WorkTask>> GetOverdueTasksAsync(Guid? projectId, Guid? userId);
        Task<List<WorkTask>> GetNotStartedTasksAsync(Guid? projectId, int daysUntilDue);
        Task<string> GenerateTaskCodeAsync(Guid projectId);
        Task CreateAsync(WorkTask task);
        Task UpdateAsync(WorkTask task);
        Task DeleteAsync(Guid taskId);
        Task<int> GetTaskCountByStatusAsync(Guid projectId, TaskStatuses status);
        Task<List<TaskComment>> GetCommentsByTaskIdAsync(Guid taskId);
        Task<TaskComment?> GetCommentByIdAsync(Guid commentId);
        Task AddCommentAsync(TaskComment comment);
        Task UpdateCommentAsync(TaskComment comment);
        Task DeleteCommentAsync(Guid commentId);
        Task AddTimeLogAsync(TaskTimeLog timeLog);
        Task<decimal> GetTotalHoursLoggedAsync(Guid taskId);
        Task AddDependencyAsync(TaskDependency dependency);
        Task<List<WorkTask>> GetDependentTasksAsync(Guid taskId);
        Task<List<TaskDependency>> GetDependenciesAsync(Guid taskId);
        Task<int> GetSprintTotalStoryPointsAsync(Guid sprintId);
        Task<int> GetSprintCompletedStoryPointsAsync(Guid sprintId);

        Task<int> CountOpenByProjectIdsAsync(List<Guid> projectIds);
        Task<int> CountOverdueByProjectIdsAsync(List<Guid> projectIds);

        /// <summary>
        /// Unassigns a user from all tasks in a project (sets AssignedToUserId to null)
        /// </summary>
        Task<int> UnassignUserFromProjectTasksAsync(Guid projectId, Guid userId);

        /// <summary>
        /// Removes a user as reviewer from all tasks in a project (sets ReviewerId to null)
        /// </summary>
        Task<int> RemoveUserAsReviewerFromProjectTasksAsync(Guid projectId, Guid userId);
    }
}
