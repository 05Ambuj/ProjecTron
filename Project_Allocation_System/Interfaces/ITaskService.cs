using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface ITaskService
    {
        Task<ApiResponse<TaskDTO>> CreateTaskAsync(Guid userId, TaskCreateRequest request);
        Task<ApiResponse<TaskDTO>> GetTaskByIdAsync(Guid taskId);

        Task<ApiResponse<PagedResponse<TaskDTO>>> GetTasksAsync(
            TaskFilterRequest filter,
            Guid userId,
            UserRole userRole,
            Guid? organizationId,
            List<Guid>? allowedProjectIds = null
        );

        // ✅ ADD THIS (MISSING)
        Task<ApiResponse<List<TaskDTO>>> GetMyTasksAsync(Guid userId);

        Task<ApiResponse<TaskDTO>> UpdateTaskAsync(Guid taskId, TaskUpdateRequest request, Guid userId);
        Task<ApiResponse<bool>> DeleteTaskAsync(Guid taskId, Guid userId);
        Task<ApiResponse<TaskDTO>> AssignTaskAsync(Guid taskId, TaskAssignmentRequest request, Guid userId);
        Task<ApiResponse<TaskDTO>> UpdateTaskStatusAsync(Guid taskId, TaskStatusUpdateRequest request, Guid userId);
        Task<ApiResponse<bool>> LogTimeAsync(Guid taskId, TaskTimeLogRequest request, Guid userId);
        Task<ApiResponse<TaskCommentDTO>> AddCommentAsync(Guid taskId, TaskCommentRequest request, Guid userId);
        Task<ApiResponse<TaskCommentDTO>> UpdateCommentAsync(Guid commentId, TaskCommentRequest request, Guid userId);
        Task<ApiResponse<bool>> DeleteCommentAsync(Guid commentId, Guid userId);
        Task<ApiResponse<List<TaskCommentDTO>>> GetTaskCommentsAsync(Guid taskId);
        Task<ApiResponse<List<TaskDTO>>> GetOverdueTasksAsync(Guid? projectId, Guid? userId);
        Task<ApiResponse<List<TaskDTO>>> GetNotStartedTasksAsync(Guid? projectId, int daysUntilDue);

        Task<List<Guid>> GetProjectIdsForProjectManagerAsync(Guid userId);
        Task<ApiResponse<TaskBoardDto>> GetTaskBoardAsync(Guid projectId, Guid userId, UserRole role, Guid? assignedToUserId = null);

    }

}