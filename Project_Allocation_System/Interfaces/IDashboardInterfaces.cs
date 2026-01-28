using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;

namespace Project_Allocation_System.Interfaces
{
    public interface IAdminDashboardService
    {
        Task<ApiResponse<AdminDashboardStatsDto>> GetStatsAsync();
    }

    public interface IProjectManagerDashboardService
    {
        Task<ApiResponse<ProjectManagerDashboardDTO>> GetDashboardAsync(Guid userId);
    }

    public interface ITeamMemberDashboardService
    {
        Task<ApiResponse<TeamMemberDashboardDTO>> GetDashboardAsync(Guid userId);
    }
}
