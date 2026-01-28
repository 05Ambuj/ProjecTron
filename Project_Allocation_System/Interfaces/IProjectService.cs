using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;

namespace Project_Allocation_System.Interfaces
{
    public interface IProjectService
    {
        Task<ApiResponse<ProjectDTO>> CreateAsync(Guid userId, ProjectCreateRequest request);
        Task<ApiResponse<ProjectDTO>> GetByIdAsync(Guid projectId);
        Task<ApiResponse<List<ProjectDTO>>> GetByIdsAsync(List<Guid> projectIds);
        Task<ApiResponse<List<ProjectDTO>>> GetAllAsync(
            int pageNumber = 1,
            int pageSize = 10,
            Guid? organizationId = null
        );
        Task<ApiResponse<PagedResponse<ProjectDTO>>> GetFilteredAsync(ProjectFilterRequest filter);
        Task<ApiResponse<ProjectDTO>> UpdateAsync(
            Guid projectId,
            ProjectUpdateRequest request,
            Guid userId
        );
        Task<ApiResponse<bool>> DeleteAsync(Guid projectId);
    }
}
