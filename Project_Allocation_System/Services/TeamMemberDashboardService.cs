using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Services
{
    public class TeamMemberDashboardService : ITeamMemberDashboardService
    {
        private readonly ITaskRepository _taskRepo;
        private readonly IProjectAllocationRepository _allocationRepo;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TeamMemberDashboardService> _logger;

        public TeamMemberDashboardService(
            ITaskRepository taskRepo,
            IProjectAllocationRepository allocationRepo,
            ApplicationDbContext context,
            ILogger<TeamMemberDashboardService> logger
        )
        {
            _taskRepo = taskRepo;
            _allocationRepo = allocationRepo;
            _context = context;
            _logger = logger;
        }

        public async Task<ApiResponse<TeamMemberDashboardDTO>> GetDashboardAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation(
                    "Getting dashboard for Team Member. UserId={UserId}",
                    userId
                );

                // Get all tasks assigned to this user
                var allTasks = await _taskRepo.GetByUserIdAsync(userId);

                // Calculate task counts
                var myTasks = allTasks.Count;
                var inProgressTasks = allTasks.Count(t => t.Status == TaskStatuses.InProgress); // Status = 2
                var completedTasks = allTasks.Count(t => t.Status == TaskStatuses.Done); // Status = 6

                // Get overdue tasks (due date is in the past and status is not Done/Cancelled)
                var now = DateTime.UtcNow.Date;
                var overdueTasks = allTasks.Count(t =>
                    t.DueDate.HasValue
                    && t.DueDate.Value.Date < now
                    && t.Status != TaskStatuses.Done
                    && t.Status != TaskStatuses.Cancelled
                );

                // Calculate total hours logged (sum of ActualHours from tasks)
                var hoursLogged = allTasks.Sum(t => t.ActualHours);

                // Count distinct active projects the user is allocated to
                var activeProjects = await _context
                    .ProjectAllocations.AsNoTracking()
                    .Where(pa => pa.UserId == userId && pa.IsActive)
                    .Select(pa => pa.ProjectId)
                    .Distinct()
                    .CountAsync();

                _logger.LogInformation(
                    "Dashboard stats calculated. MyTasks={MyTasks}, InProgress={InProgress}, Completed={Completed}, Overdue={Overdue}, HoursLogged={HoursLogged}, ActiveProjects={ActiveProjects}",
                    myTasks,
                    inProgressTasks,
                    completedTasks,
                    overdueTasks,
                    hoursLogged,
                    activeProjects
                );

                return new ApiResponse<TeamMemberDashboardDTO>
                {
                    Success = true,
                    Data = new TeamMemberDashboardDTO
                    {
                        MyTasks = myTasks,
                        InProgressTasks = inProgressTasks,
                        CompletedTasks = completedTasks,
                        OverdueTasks = overdueTasks,
                        HoursLogged = hoursLogged,
                        ActiveProjects = activeProjects,
                    },
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error retrieving team member dashboard. UserId={UserId}",
                    userId
                );
                return new ApiResponse<TeamMemberDashboardDTO>
                {
                    Success = false,
                    Message = "An error occurred while retrieving dashboard data",
                    StatusCode = 500,
                };
            }
        }
    }
}
