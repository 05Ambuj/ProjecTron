using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface IOrganizationRepository
    {
        Task<List<Organization>> GetAllActiveAsync();
        Task<Organization?> GetByIdAsync(Guid id);
        Task<(List<Organization> Organizations, int TotalCount)> GetFilteredAsync(OrganizationFilterRequest filter);
        Task CreateAsync(Organization organization);
        Task DeleteAsync(Guid organizationId);
        Task<int> GetUserCountAsync(Guid organizationId);
        Task<int> GetProjectCountAsync(Guid organizationId);

    }
}
