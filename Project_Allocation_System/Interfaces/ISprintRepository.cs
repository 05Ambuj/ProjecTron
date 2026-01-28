using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface ISprintRepository
    {
        Task<Sprint?> GetByIdAsync(Guid sprintId);
        Task<Sprint?> GetByIdWithDetailsAsync(Guid sprintId);
        Task<List<Sprint>> GetByProjectIdAsync(Guid projectId);
        Task<Sprint?> GetActiveSprintByProjectIdAsync(Guid projectId);
        Task CreateAsync(Sprint sprint);
        Task UpdateAsync(Sprint sprint);
        Task DeleteAsync(Guid sprintId);
        Task<bool> HasOverlappingSprintAsync(Guid projectId, DateTime startDate, DateTime endDate, Guid? excludeSprintId = null);
        Task<SprintMember?> GetSprintMemberAsync(Guid sprintId, Guid userId);
        Task AddSprintMemberAsync(SprintMember member);
        Task RemoveSprintMemberAsync(Guid sprintId, Guid userId);
        Task<List<SprintMember>> GetSprintMembersAsync(Guid sprintId);
        Task UpdateSprintMemberAsync(SprintMember member);
        Task<int> CountActiveByProjectIdsAsync(List<Guid> projectIds);
    }
}