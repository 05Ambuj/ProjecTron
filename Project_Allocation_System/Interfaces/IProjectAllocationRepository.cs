using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface IProjectAllocationRepository
    {
        Task<bool> ExistsAsync(Guid projectId, Guid userId);
        Task<int> GetCountAsync(Guid projectId);
        Task<List<ProjectAllocation>> GetByProjectIdAsync(Guid projectId);
        Task CreateAsync(ProjectAllocation allocation);
        Task RemoveAsync(Guid projectId, Guid userId);
        Task<List<Guid>> GetProjectIdsForUserAsync(Guid userId);
    }
}
