using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Project_Allocation_System.Services
{
    // Service for project manager dashboard statistics
    // Calculates stats for PM's managed projects
    public class ProjectManagerDashboardService : IProjectManagerDashboardService
    {
        private readonly ISprintRepository _sprintRepo;
        private readonly IProjectRepository _projectRepo;
        private readonly ITaskRepository _taskRepo;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectManagerDashboardService> _logger;

        // Constructor - injecting required dependencies
        public ProjectManagerDashboardService(
            ISprintRepository sprintRepo,
            IProjectRepository projectRepo,
            ITaskRepository taskRepo,
            ApplicationDbContext context,
            ILogger<ProjectManagerDashboardService> logger)
        {
            _sprintRepo = sprintRepo;
            _projectRepo = projectRepo;
            _taskRepo = taskRepo;
            _context = context;
            _logger = logger;
        }

        // This function calculates dashboard stats for a project manager
        // Returns count of their projects, active sprints, open tasks and overdue tasks
        // Only counts projects where this PM is assigned as project manager
        public async Task<ApiResponse<ProjectManagerDashboardDTO>> GetDashboardAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Getting dashboard for Project Manager. UserId={UserId}", userId);

                // Direct database query to verify and count
                var projectsCount = await _context.Projects
                    .AsNoTracking()
                    .CountAsync(p => p.ProjectManagerId == userId);
                
                _logger.LogInformation("Direct count query result: {Count} projects for UserId={UserId}", projectsCount, userId);

                // Also log all projects with their ProjectManagerIds for debugging
                var allProjectsDebug = await _context.Projects
                    .AsNoTracking()
                    .Select(p => new { p.ProjectId, p.ProjectManagerId, p.Name })
                    .Take(10)
                    .ToListAsync();
                
                _logger.LogInformation("Sample projects in DB (first 10): {Projects}", 
                    string.Join(" | ", allProjectsDebug.Select(p => $"Name={p.Name}, PMId={p.ProjectManagerId}")));

                // Get project IDs for calculating other stats
                var projectIds = await _projectRepo.GetProjectIdsByProjectManagerIdAsync(userId);

                int activeSprints = 0;
                int openTasks = 0;
                int overdueTasks = 0;

                if (projectIds.Any())
                {
                    activeSprints = await _sprintRepo.CountActiveByProjectIdsAsync(projectIds);
                    openTasks = await _taskRepo.CountOpenByProjectIdsAsync(projectIds);
                    overdueTasks = await _taskRepo.CountOverdueByProjectIdsAsync(projectIds);
                }

                _logger.LogInformation("Dashboard stats calculated. Projects={ProjectsCount}, ActiveSprints={ActiveSprints}, OpenTasks={OpenTasks}, OverdueTasks={OverdueTasks}",
                    projectsCount, activeSprints, openTasks, overdueTasks);

                return new ApiResponse<ProjectManagerDashboardDTO>
                {
                    Success = true,
                    Data = new ProjectManagerDashboardDTO
                    {
                        ProjectsCount = projectsCount,
                        ActiveSprints = activeSprints,
                        OpenTasks = openTasks,
                        OverdueTasks = overdueTasks
                    },
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project manager dashboard. UserId={UserId}", userId);
                return new ApiResponse<ProjectManagerDashboardDTO>
                {
                    Success = false,
                    Message = "An error occurred while retrieving dashboard data",
                    StatusCode = 500
                };
            }
        }
    }
}
