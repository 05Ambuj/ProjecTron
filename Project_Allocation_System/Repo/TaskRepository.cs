using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Repos
{
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IProjectAllocationRepository _allocationRepo;

        public TaskRepository(
            ApplicationDbContext context,
            IProjectAllocationRepository projectAllocationRepository
        )
        {
            _context = context;
            _allocationRepo = projectAllocationRepository;
        }

        public async Task<WorkTask?> GetByIdAsync(Guid taskId)
        {
            return await _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.AssignedByUser)
                .Include(t => t.Reviewer)
                .Include(t => t.Project)
                .Include(t => t.Sprint)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);
        }

        public async Task<WorkTask?> GetByIdWithDetailsAsync(Guid taskId)
        {
            return await _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.AssignedByUser)
                .Include(t => t.Reviewer)
                .Include(t => t.Project)
                .Include(t => t.Sprint)
                .Include(t => t.Comments)                    
                    .ThenInclude(c => c.User)
                .Include(t => t.TimeLogs.OrderByDescending(tl => tl.LogDate))
                .Include(t => t.Dependencies)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);
        }

        public async Task<List<WorkTask>> GetAllAsync(TaskFilterRequest filter)
        {
            var query = BuildFilterQuery(filter);
            if (filter.ProjectIds != null && filter.ProjectIds.Any())
            {
                query = query.Where(t => filter.ProjectIds.Contains(t.ProjectId));
            }
            return await query
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task<(List<WorkTask> Tasks, int TotalCount)> GetPagedAsync(
            TaskFilterRequest filter
        )
        {
            var query = BuildFilterQuery(filter);

            var totalCount = await query.CountAsync();

            var tasks = await query
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (tasks, totalCount);
        }

        private IQueryable<WorkTask> BuildFilterQuery(TaskFilterRequest filter)
        {
            var query = _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.AssignedByUser)
                .Include(t => t.Reviewer)
                .Include(t => t.Project)
                .Include(t => t.Sprint)
                .Where(t => t.Status != TaskStatuses.Cancelled) // Exclude cancelled tasks
                .AsQueryable();

            if (filter.ProjectId.HasValue)
                query = query.Where(t => t.ProjectId == filter.ProjectId.Value);

            if (filter.ProjectIds != null && filter.ProjectIds.Any())
                query = query.Where(t => filter.ProjectIds.Contains(t.ProjectId));

            if (filter.SprintId.HasValue)
                query = query.Where(t => t.SprintId == filter.SprintId.Value);

            if (filter.AssignedToUserId.HasValue)
                query = query.Where(t => t.AssignedToUserId == filter.AssignedToUserId.Value);

            if (filter.Status.HasValue)
                query = query.Where(t => t.Status == filter.Status.Value);

            if (filter.Priority.HasValue)
                query = query.Where(t => t.Priority == filter.Priority.Value);

            if (filter.IsOverdue.HasValue && filter.IsOverdue.Value)
                query = query.Where(t =>
                    t.DueDate.HasValue
                    && t.DueDate < DateTime.UtcNow
                    && t.Status != TaskStatuses.Done
                    && t.Status != TaskStatuses.Cancelled
                );

            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                query = query.Where(t =>
                    t.Title.Contains(filter.SearchTerm)
                    || t.Description.Contains(filter.SearchTerm)
                    || t.TaskCode.Contains(filter.SearchTerm)
                );

            return query;
        }

        public async Task<List<WorkTask>> GetByUserIdAsync(Guid userId)
        {
            return await _context
                .WorkTasks.Include(t => t.Project)
                .Include(t => t.Sprint)
                .Include(t => t.AssignedByUser)
                .Where(t => t.AssignedToUserId == userId && t.Status != TaskStatuses.Cancelled)
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task<List<WorkTask>> GetByProjectIdAsync(Guid projectId)
        {
            return await _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.Sprint)
                .Where(t => t.ProjectId == projectId && t.Status != TaskStatuses.Cancelled)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();
        }

        public async Task<List<WorkTask>> GetBySprintIdAsync(Guid sprintId)
        {
            return await _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.Project)
                .Where(t => t.SprintId == sprintId && t.Status != TaskStatuses.Cancelled)
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task<List<WorkTask>> GetOverdueTasksAsync(Guid? projectId, Guid? userId)
        {
            var query = _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.Project)
                .Where(t =>
                    t.DueDate.HasValue
                    && t.DueDate < DateTime.UtcNow
                    && t.Status != TaskStatuses.Done
                    && t.Status != TaskStatuses.Cancelled
                );

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            if (userId.HasValue)
                query = query.Where(t => t.AssignedToUserId == userId.Value);

            return await query.ToListAsync();
        }

        public async Task<List<WorkTask>> GetNotStartedTasksAsync(Guid? projectId, int daysUntilDue)
        {
            var thresholdDate = DateTime.UtcNow.AddDays(daysUntilDue);

            var query = _context
                .WorkTasks.Include(t => t.AssignedToUser)
                .Include(t => t.Project)
                .Where(t =>
                    t.Status == TaskStatuses.NotStarted
                    && t.DueDate.HasValue
                    && t.DueDate <= thresholdDate
                );

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            return await query.ToListAsync();
        }

        public async Task<string> GenerateTaskCodeAsync(Guid projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                return $"TASK-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            // Use project code if available, otherwise use project name or a default
            var projectPrefix = !string.IsNullOrWhiteSpace(project.Code)
                ? project.Code
                : (
                    !string.IsNullOrWhiteSpace(project.Name)
                        ? project
                            .Name.Substring(0, Math.Min(4, project.Name.Length))
                            .ToUpper()
                            .Replace(" ", "")
                        : "TASK"
                );

            var lastTask = await _context
                .WorkTasks.Where(t => t.ProjectId == projectId)
                .OrderByDescending(t => t.CreatedDate)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastTask != null && !string.IsNullOrEmpty(lastTask.TaskCode))
            {
                var parts = lastTask.TaskCode.Split('-');
                if (parts.Length == 2 && int.TryParse(parts[1], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"{projectPrefix}-{nextNumber:D3}";
        }

        public async Task CreateAsync(WorkTask task)
        {
            _context.WorkTasks.Add(task);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(WorkTask task)
        {
            _context.WorkTasks.Update(task);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid taskId)
        {
            var task = await _context.WorkTasks.FindAsync(taskId);
            if (task != null)
            {
                task.Status = TaskStatuses.Cancelled;
                task.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> GetTaskCountByStatusAsync(Guid projectId, TaskStatuses status)
        {
            return await _context.WorkTasks.CountAsync(t =>
                t.ProjectId == projectId 
                && t.Status == status
            );
        }

        public async Task<List<TaskComment>> GetCommentsByTaskIdAsync(Guid taskId)
        {
            return await _context
                .TaskComments.Include(c => c.User)
                .Include(c => c.TaggedUser)
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync();
        }

        public async Task<TaskComment?> GetCommentByIdAsync(Guid commentId)
        {
            return await _context
                .TaskComments
                .Include(c => c.User)
                .Include(c => c.TaggedUser)
                .FirstOrDefaultAsync(c => c.CommentId == commentId);
        }

        public async Task AddCommentAsync(TaskComment comment)
        {
            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateCommentAsync(TaskComment comment)
        {
            _context.TaskComments.Update(comment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCommentAsync(Guid commentId)
        {
            var comment = await _context.TaskComments.FindAsync(commentId);
            if (comment != null)
            {
                _context.TaskComments.Remove(comment);
                await _context.SaveChangesAsync();
            }
        }

        public async Task AddTimeLogAsync(TaskTimeLog timeLog)
        {
            _context.TaskTimeLogs.Add(timeLog);
            await _context.SaveChangesAsync();
        }

        public async Task<decimal> GetTotalHoursLoggedAsync(Guid taskId)
        {
            return await _context
                .TaskTimeLogs.Where(tl => tl.TaskId == taskId)
                .SumAsync(tl => tl.HoursLogged);
        }

        public async Task AddDependencyAsync(TaskDependency dependency)
        {
            _context.TaskDependencies.Add(dependency);
            await _context.SaveChangesAsync();
        }

        public async Task<List<WorkTask>> GetDependentTasksAsync(Guid taskId)
        {
            var dependencyIds = await _context
                .TaskDependencies.Where(d => d.DependsOnTaskId == taskId)
                .Select(d => d.TaskId)
                .ToListAsync();

            return await _context
                .WorkTasks.Where(t => dependencyIds.Contains(t.TaskId))
                .ToListAsync();
        }

        public async Task<List<TaskDependency>> GetDependenciesAsync(Guid taskId)
        {
            return await _context
                .TaskDependencies.Include(d => d.DependsOnTask)
                .Where(d => d.TaskId == taskId)
                .ToListAsync();
        }

        public async Task<int> GetSprintTotalStoryPointsAsync(Guid sprintId)
        {
            return await _context
                    .WorkTasks.Where(t =>
                        t.SprintId == sprintId && t.Status != TaskStatuses.Cancelled
                    )
                    .SumAsync(t => (int?)t.StoryPoints)
                ?? 0;
        }

        public async Task<int> GetSprintCompletedStoryPointsAsync(Guid sprintId)
        {
            return await _context
                    .WorkTasks.Where(t => t.SprintId == sprintId && t.Status == TaskStatuses.Done)
                    .SumAsync(t => (int?)t.StoryPoints)
                ?? 0;
        }

        public async Task<int> CountOpenByProjectIdsAsync(List<Guid> projectIds)
        {
            return await _context.WorkTasks.CountAsync(t =>
                projectIds.Contains(t.ProjectId)
                && t.Status != TaskStatuses.Done
                && t.Status != TaskStatuses.Cancelled
            );
        }

        public async Task<int> CountOverdueByProjectIdsAsync(List<Guid> projectIds)
        {
            return await _context.WorkTasks.CountAsync(t =>
                projectIds.Contains(t.ProjectId)
                && t.DueDate.HasValue
                && t.DueDate < DateTime.UtcNow
                && t.Status != TaskStatuses.Done
                && t.Status != TaskStatuses.Cancelled
            );
        }

        public async Task<int> UnassignUserFromProjectTasksAsync(Guid projectId, Guid userId)
        {
            var tasksToUpdate = await _context
                .WorkTasks.Where(t => t.ProjectId == projectId && t.AssignedToUserId == userId)
                .ToListAsync();

            foreach (var task in tasksToUpdate)
            {
                task.AssignedToUserId = null;
                task.UpdatedDate = DateTime.UtcNow;
            }

            if (tasksToUpdate.Any())
            {
                await _context.SaveChangesAsync();
            }

            return tasksToUpdate.Count;
        }

        public async Task<int> RemoveUserAsReviewerFromProjectTasksAsync(
            Guid projectId,
            Guid userId
        )
        {
            var tasksToUpdate = await _context
                .WorkTasks.Where(t => t.ProjectId == projectId && t.ReviewerId == userId)
                .ToListAsync();

            foreach (var task in tasksToUpdate)
            {
                task.ReviewerId = null;
                task.UpdatedDate = DateTime.UtcNow;
            }

            if (tasksToUpdate.Any())
            {
                await _context.SaveChangesAsync();
            }

            return tasksToUpdate.Count;
        }
    }
}
