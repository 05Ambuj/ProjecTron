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
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly ApplicationDbContext _context;

        public OrganizationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Organization>> GetAllActiveAsync()
        {
            return await _context.Organizations
                .Where(o => o.IsActive)
                .OrderBy(o => o.Name)
                .ToListAsync();
        }

        public async Task<Organization?> GetByIdAsync(Guid id)
        {
            return await _context.Organizations.FindAsync(id);
        }

        public async Task CreateAsync(Organization organization)
        {
            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid organizationId)
        {
            var org = await _context.Organizations.FindAsync(organizationId);
            if (org == null || !org.IsActive) return;

            org.IsActive = false;
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetUserCountAsync(Guid organizationId)
        {
            return await _context.Users
                .CountAsync(u => u.OrganizationId == organizationId && u.IsActive);
        }

        public async Task<int> GetProjectCountAsync(Guid organizationId)
        {
            return await _context.Projects
                .CountAsync(p => p.OrganizationId == organizationId);
        }

        public async Task<(List<Organization> Organizations, int TotalCount)> GetFilteredAsync(OrganizationFilterRequest filter)
        {
            var query = _context.Organizations.AsNoTracking().AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(o =>
                    o.Name.ToLower().Contains(searchTerm) ||
                    o.Location.ToLower().Contains(searchTerm));
            }

            // Status filter
            if (filter.IsActive.HasValue)
            {
                query = query.Where(o => o.IsActive == filter.IsActive.Value);
            }

            var totalCount = await query.CountAsync();

            // Get all organizations first for count-based sorting
            var allOrgs = await query.ToListAsync();

            // Sorting
            var sortBy = filter.SortBy?.ToLower() ?? "name";
            var sortOrder = filter.SortOrder?.ToLower() ?? "asc";

            if (sortBy == "userCount" || sortBy == "projectCount")
            {
                // For count-based sorting, we need to materialize and sort in memory
                var orgsWithCounts = new List<(Organization Organization, int UserCount, int ProjectCount)>();
                foreach (var o in allOrgs)
                {
                    var userCount = await _context.Users.CountAsync(u => u.OrganizationId == o.OrganizationId && u.IsActive);
                    var projectCount = await _context.Projects.CountAsync(p => p.OrganizationId == o.OrganizationId);
                    orgsWithCounts.Add((o, userCount, projectCount));
                }

                var sortedOrgs = sortBy switch
                {
                    "userCount" => sortOrder == "asc"
                        ? orgsWithCounts.OrderBy(x => x.UserCount).Select(x => x.Organization)
                        : orgsWithCounts.OrderByDescending(x => x.UserCount).Select(x => x.Organization),
                    "projectCount" => sortOrder == "asc"
                        ? orgsWithCounts.OrderBy(x => x.ProjectCount).Select(x => x.Organization)
                        : orgsWithCounts.OrderByDescending(x => x.ProjectCount).Select(x => x.Organization),
                    _ => allOrgs.OrderBy(o => o.Name)
                };

                var organizations = sortedOrgs
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToList();

                return (organizations, totalCount);
            }
            else
            {
                // For other sorts, use database sorting
                var sortedQuery = sortBy switch
                {
                    "name" => sortOrder == "asc" ? query.OrderBy(o => o.Name) : query.OrderByDescending(o => o.Name),
                    "location" => sortOrder == "asc" ? query.OrderBy(o => o.Location) : query.OrderByDescending(o => o.Location),
                    "createdDate" => sortOrder == "asc" ? query.OrderBy(o => o.CreatedDate) : query.OrderByDescending(o => o.CreatedDate),
                    _ => query.OrderBy(o => o.Name)
                };

                var organizations = await sortedQuery
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                return (organizations, totalCount);
            }
        }

    }
}
