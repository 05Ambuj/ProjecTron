using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Project_Allocation_System.Data;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Repos
{
    public class WorkItemLinkRepository : IWorkItemLinkRepository
    {
        private readonly ApplicationDbContext _context;

        public WorkItemLinkRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WorkItemLink?> GetByIdAsync(Guid linkId)
        {
            return await _context.WorkItemLinks
                .Include(l => l.SourceTask)
                .Include(l => l.TargetTask)
                .Include(l => l.CreatedByUser)
                .FirstOrDefaultAsync(l => l.WorkItemLinkId == linkId);
        }

        public async Task<List<WorkItemLink>> GetLinksByTaskIdAsync(Guid taskId)
        {
            return await _context.WorkItemLinks
                .Include(l => l.SourceTask)
                .Include(l => l.TargetTask)
                .Include(l => l.CreatedByUser)
                .Where(l => l.SourceTaskId == taskId || l.TargetTaskId == taskId)
                .ToListAsync();
        }

        public async Task<List<WorkItemLink>> GetSourceLinksAsync(Guid taskId)
        {
            return await _context.WorkItemLinks
                .Include(l => l.TargetTask)
                .Include(l => l.CreatedByUser)
                .Where(l => l.SourceTaskId == taskId)
                .ToListAsync();
        }

        public async Task<List<WorkItemLink>> GetTargetLinksAsync(Guid taskId)
        {
            return await _context.WorkItemLinks
                .Include(l => l.SourceTask)
                .Include(l => l.CreatedByUser)
                .Where(l => l.TargetTaskId == taskId)
                .ToListAsync();
        }

        public async Task CreateAsync(WorkItemLink link)
        {
            _context.WorkItemLinks.Add(link);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid linkId)
        {
            var link = await _context.WorkItemLinks.FindAsync(linkId);
            if (link != null)
            {
                _context.WorkItemLinks.Remove(link);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> LinkExistsAsync(Guid sourceTaskId, Guid targetTaskId, WorkItemLinkType linkType)
        {
            return await _context.WorkItemLinks
                .AnyAsync(l => l.SourceTaskId == sourceTaskId && 
                              l.TargetTaskId == targetTaskId && 
                              l.LinkType == linkType);
        }
    }
}
