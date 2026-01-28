using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface ITeamRepository
    {
        Task<Team?> GetByIdAsync(Guid teamId);
        Task<Team?> GetByIdWithMembersAsync(Guid teamId);
        Task<List<Team>> GetByProjectIdAsync(Guid projectId);
        Task<List<Team>> GetByProjectIdWithMembersAsync(Guid projectId);
        Task<bool> ExistsAsync(Guid projectId, string teamName);
        Task<bool> IsUserTeamLeadAsync(Guid projectId, Guid userId);
        Task<Team> CreateAsync(Team team);
        Task<Team> UpdateAsync(Team team);
        Task DeleteAsync(Guid teamId);
        
        // Team Member operations
        Task<TeamMember?> GetTeamMemberAsync(Guid teamId, Guid userId);
        Task<bool> IsUserInTeamAsync(Guid teamId, Guid userId);
        Task<bool> IsUserInAnyTeamOfProjectAsync(Guid projectId, Guid userId);
        Task<TeamMember> AddMemberAsync(TeamMember member);
        Task RemoveMemberAsync(Guid teamId, Guid userId);
        Task<int> GetMemberCountAsync(Guid teamId);
    }
}
