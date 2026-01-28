using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface IWorkItemLinkRepository
    {
        Task<WorkItemLink?> GetByIdAsync(Guid linkId);
        Task<List<WorkItemLink>> GetLinksByTaskIdAsync(Guid taskId);
        Task<List<WorkItemLink>> GetSourceLinksAsync(Guid taskId);
        Task<List<WorkItemLink>> GetTargetLinksAsync(Guid taskId);
        Task CreateAsync(WorkItemLink link);
        Task DeleteAsync(Guid linkId);
        Task<bool> LinkExistsAsync(Guid sourceTaskId, Guid targetTaskId, WorkItemLinkType linkType);
    }

    public interface IWorkItemLinkService
    {
        Task<ApiResponse<WorkItemLinkDTO>> CreateLinkAsync(Guid userId, CreateWorkItemLinkRequest request);
        Task<ApiResponse<List<WorkItemLinkDTO>>> GetLinksByTaskIdAsync(Guid taskId);
        Task<ApiResponse<bool>> DeleteLinkAsync(Guid linkId, Guid userId);
    }
}
