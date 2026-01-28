using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface IProjectRepository
    {
        Task<Project?> GetByIdAsync(Guid projectId);
        Task<List<Project>> GetByIdsAsync(List<Guid> projectIds);
        Task<List<Project>> GetAllAsync(int pageNumber = 1, int pageSize = 10, Guid? organizationId = null);
        Task<(List<Project> Projects, int TotalCount)> GetFilteredAsync(ProjectFilterRequest filter);
        Task CreateAsync(Project project);
        Task UpdateAsync(Project project);
        Task DeleteAsync(Guid projectId);
        Task<List<Guid>> GetProjectIdsByProjectManagerIdAsync(Guid projectManagerId);
        Task<int> CountProjectsByProjectManagerIdAsync(Guid projectManagerId);
        //Task<int> GetUserCountAsync(Guid projectId);

    }
}
