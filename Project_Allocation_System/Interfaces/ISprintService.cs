using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface ISprintService
    {
        Task<ApiResponse<SprintDTO>> CreateSprintAsync(Guid userId, SprintCreateRequest request);
        Task<ApiResponse<SprintDTO>> GetSprintByIdAsync(Guid sprintId);
        Task<ApiResponse<List<SprintDTO>>> GetSprintsByProjectIdAsync(Guid projectId);
        Task<ApiResponse<SprintDTO>> GetActiveSprintByProjectIdAsync(Guid projectId);
        Task<ApiResponse<SprintDTO>> UpdateSprintAsync(Guid sprintId, SprintUpdateRequest request, Guid userId);
        Task<ApiResponse<bool>> DeleteSprintAsync(Guid sprintId, Guid userId);
        Task<ApiResponse<bool>> StartSprintAsync(Guid sprintId, Guid userId);
        Task<ApiResponse<bool>> CompleteSprintAsync(Guid sprintId, Guid userId);
        Task<ApiResponse<SprintStatsDTO>> GetSprintStatsAsync(Guid sprintId);
        Task<ApiResponse<bool>> AddSprintMemberAsync(Guid sprintId, SprintMemberCreateRequest request, Guid userId);
        Task<ApiResponse<bool>> RemoveSprintMemberAsync(Guid sprintId, Guid userId, Guid requestingUserId);
        Task<ApiResponse<SprintTimeSummaryDTO>> GetSprintTimeSummaryAsync(Guid sprintId,Guid userId);
        Task<ApiResponse<SprintBurndownDTO>> GetSprintBurndownAsync(Guid sprintId);
        Task<bool> IsUserAllocatedToSprintProjectAsync(Guid sprintId, Guid userId);
    }
}
