using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;

namespace Project_Allocation_System.Interfaces
{
    public interface ITeamService
    {
        // Team operations
        Task<ApiResponse<TeamDTO>> GetTeamByIdAsync(Guid teamId, Guid actorUserId);
        Task<ApiResponse<ProjectTeamsDTO>> GetProjectTeamsAsync(Guid projectId, Guid actorUserId);
        Task<ApiResponse<TeamDTO>> CreateTeamAsync(CreateTeamRequest request, Guid actorUserId);
        Task<ApiResponse<TeamDTO>> UpdateTeamAsync(Guid teamId, UpdateTeamRequest request, Guid actorUserId);
        Task<ApiResponse<bool>> DeleteTeamAsync(Guid teamId, Guid actorUserId);
        
        // Team Member operations
        Task<ApiResponse<TeamMemberDTO>> AddMemberToTeamAsync(Guid teamId, AddTeamMemberRequest request, Guid actorUserId);
        Task<ApiResponse<bool>> RemoveMemberFromTeamAsync(Guid teamId, Guid userId, Guid actorUserId);
        
        // Search
        Task<ApiResponse<List<ProjectTeamsDTO>>> SearchProjectsWithTeamsAsync(string? searchTerm, Guid actorUserId);
    }
}
