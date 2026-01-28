using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using System;
using System.Threading.Tasks;

namespace Project_Allocation_System.Services
{
    // Service for getting admin dashboard statistics
    // Calculates total counts for orgs, users, projects and tasks
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly ApplicationDbContext _context;
        private readonly ISprintRepository _sprintRepo;
        private readonly IProjectAllocationRepository _allocationRepo;
        private readonly ITaskRepository _taskRepo;
        private readonly IProjectRepository _projectRepo;
        private readonly ILogger<AdminDashboardService> _logger;

        // Constructor - injecting all required dependencies
        public AdminDashboardService(
            ApplicationDbContext context,
            ISprintRepository sprintRepo,
            IProjectAllocationRepository allocationRepo,
            ITaskRepository taskRepo,
            IProjectRepository projectRepo,
            ILogger<AdminDashboardService> logger
        )
        {
            _context = context;
            _sprintRepo = sprintRepo;
            _allocationRepo = allocationRepo;
            _taskRepo = taskRepo;
            _projectRepo = projectRepo;
            _logger = logger;
        }

        // This function calculates and returns all admin dashboard stats
        // Counts active organizations, active users, total projects and open tasks
        // Open tasks means tasks that are not Done or Cancelled
        public async Task<ApiResponse<AdminDashboardStatsDto>> GetStatsAsync()
        {
            try
            {
                var stats = new AdminDashboardStatsDto
                {
                    TotalOrganizations = await _context.Organizations.CountAsync(o => o.IsActive),

                    TotalUsers = await _context.Users.CountAsync(u => u.IsActive),

                    TotalProjects = await _context.Projects.CountAsync(),

                    OpenTasks = await _context.WorkTasks.CountAsync(t =>
                        t.Status != TaskStatuses.Done && t.Status != TaskStatuses.Cancelled
                    ),
                };

                return new ApiResponse<AdminDashboardStatsDto>
                {
                    Success = true,
                    Data = stats,
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin dashboard stats");
                return new ApiResponse<AdminDashboardStatsDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving dashboard statistics",
                    StatusCode = 500
                };
            }
        }
    }
}
