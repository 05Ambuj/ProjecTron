using Microsoft.EntityFrameworkCore;
using Project_Allocation_System.Data;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Repos
{
    public class ProjectAllocationRepository : IProjectAllocationRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectAllocationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsAsync(Guid projectId, Guid userId)
        {
            return await _context.ProjectAllocations
                .AnyAsync(a => a.ProjectId == projectId && a.UserId == userId);
        }

        public async Task<int> GetCountAsync(Guid projectId)
        {
            return await _context.ProjectAllocations
                .CountAsync(a => a.ProjectId == projectId);
        }

        public async Task<List<ProjectAllocation>> GetByProjectIdAsync(Guid projectId)
        {
            return await _context.ProjectAllocations
                .Include(a => a.User)
                .Where(a => a.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task CreateAsync(ProjectAllocation allocation)
        {
            _context.ProjectAllocations.Add(allocation);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveAsync(Guid projectId, Guid userId)
        {
            var allocation = await _context.ProjectAllocations
                .FirstOrDefaultAsync(a => a.ProjectId == projectId && a.UserId == userId);

            if (allocation != null)
            {
                _context.ProjectAllocations.Remove(allocation);
                await _context.SaveChangesAsync();
            }
        }
        public async Task<List<Guid>> GetProjectIdsForUserAsync(Guid userId)
        {
            return await _context.ProjectAllocations
                .Where(a => a.UserId == userId)
                .Select(a => a.ProjectId)
                .Distinct()
                .ToListAsync();
        }

    }
}
