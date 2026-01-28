using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Project_Allocation_System.Data;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Repos
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Project?> GetByIdAsync(Guid projectId)
        {
            return await _context.Projects
                .Include(p => p.ProjectManager)
                .Include(p => p.Organization)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);
        }

        public async Task<List<Project>> GetByIdsAsync(List<Guid> projectIds)
        {
            if (projectIds == null || projectIds.Count == 0)
            {
                return new List<Project>();
            }

            return await _context.Projects
                .AsNoTracking()
                .Include(p => p.ProjectManager)
                .Include(p => p.Organization)
                .Where(p => projectIds.Contains(p.ProjectId))
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync();
        }

        public async Task<List<Project>> GetAllAsync(
            int pageNumber = 1,
            int pageSize = 10,
            Guid? organizationId = null)
        {
            var query = _context.Projects
                .AsNoTracking()
                .Include(p => p.ProjectManager)
                .Include(p => p.Organization)
                .AsQueryable();

            if (organizationId.HasValue)
            {
                query = query.Where(p => p.OrganizationId == organizationId.Value);
            }

            return await query
                .OrderByDescending(p => p.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<(List<Project> Projects, int TotalCount)> GetFilteredAsync(ProjectFilterRequest filter)
        {
            var query = _context.Projects
                .AsNoTracking()
                .Include(p => p.ProjectManager)
                .Include(p => p.Organization)
                .AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
                    p.Code.ToLower().Contains(searchTerm) ||
                    (p.Description != null && p.Description.ToLower().Contains(searchTerm)) ||
                    (p.Organization != null && p.Organization.Name.ToLower().Contains(searchTerm)) ||
                    (p.ProjectManager != null && p.ProjectManager.DisplayName.ToLower().Contains(searchTerm)));
            }

            // Status filter - Direct enum comparison - EF Core with HasConversion<int>() handles this correctly
            if (filter.Status.HasValue)
            {
                var statusValue = filter.Status.Value;
                query = query.Where(p => p.Status == statusValue);
            }

            // Priority filter - Direct enum comparison - EF Core with HasConversion<int>() handles this correctly
            if (filter.Priority.HasValue)
            {
                var priorityValue = filter.Priority.Value;
                query = query.Where(p => p.Priority == priorityValue);
            }

            // Organization filter
            if (filter.OrganizationId.HasValue)
            {
                query = query.Where(p => p.OrganizationId == filter.OrganizationId.Value);
            }

            // Project Manager filter
            if (filter.ProjectManagerId.HasValue)
            {
                query = query.Where(p => p.ProjectManagerId == filter.ProjectManagerId.Value);
            }

            var totalCount = await query.CountAsync();

            // Sorting
            var sortBy = filter.SortBy?.ToLower() ?? "createdDate";
            var sortOrder = filter.SortOrder?.ToLower() ?? "desc";

            query = sortBy switch
            {
                "name" => sortOrder == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
                "code" => sortOrder == "asc" ? query.OrderBy(p => p.Code) : query.OrderByDescending(p => p.Code),
                "status" => sortOrder == "asc" ? query.OrderBy(p => p.Status) : query.OrderByDescending(p => p.Status),
                "priority" => sortOrder == "asc" ? query.OrderBy(p => p.Priority) : query.OrderByDescending(p => p.Priority),
                "progressPercentage" => sortOrder == "asc" ? query.OrderBy(p => p.ProgressPercentage) : query.OrderByDescending(p => p.ProgressPercentage),
                "createdDate" => sortOrder == "asc" ? query.OrderBy(p => p.CreatedDate) : query.OrderByDescending(p => p.CreatedDate),
                _ => query.OrderByDescending(p => p.CreatedDate)
            };

            var projects = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (projects, totalCount);
        }

        public async Task CreateAsync(Project project)
        {
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Project project)
        {
            _context.Projects.Update(project);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project != null)
            {
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Guid>> GetProjectIdsByProjectManagerIdAsync(Guid projectManagerId)
        {
            if (projectManagerId == Guid.Empty)
            {
                return new List<Guid>();
            }

            return await _context.Projects
                .AsNoTracking()
                .Where(p => p.ProjectManagerId == projectManagerId)
                .Select(p => p.ProjectId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<int> CountProjectsByProjectManagerIdAsync(Guid projectManagerId)
        {
            if (projectManagerId == Guid.Empty)
            {
                return 0;
            }

            return await _context.Projects
                .AsNoTracking()
                .CountAsync(p => p.ProjectManagerId == projectManagerId);
        }

        //public async Task<int> GetUserCountAsync(Guid projectId)
        //{
        //    return await _context.ProjectAllocations
        //        .CountAsync(a => a.ProjectId == projectId && a.IsActive);
        //}
    }
}
