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
    public class SprintRepository : ISprintRepository
    {
        private readonly ApplicationDbContext _context;

        public SprintRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Sprint?> GetByIdAsync(Guid sprintId)
        {
            return await _context.Sprints
                .Include(s => s.Project)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId);
        }

        public async Task<Sprint?> GetByIdWithDetailsAsync(Guid sprintId)
        {
            return await _context.Sprints
                .Include(s => s.Project)
                .Include(s => s.Tasks)
                    .ThenInclude(t => t.AssignedToUser)
                .Include(s => s.SprintMembers)
                    .ThenInclude(sm => sm.User)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId);
        }

        public async Task<List<Sprint>> GetByProjectIdAsync(Guid projectId)
        {
            return await _context.Sprints
                .Include(s => s.Project)
                .Include(s => s.Tasks)
                .Include(s => s.SprintMembers)
                .Where(s => s.ProjectId == projectId && s.Status != SprintStatus.Cancelled)
                .OrderByDescending(s => s.StartDate)
                .ToListAsync();
        }

        public async Task<Sprint?> GetActiveSprintByProjectIdAsync(Guid projectId)
        {
            return await _context.Sprints
                .Include(s => s.Project)
                .Include(s => s.Tasks)
                .Include(s => s.SprintMembers)
                    .ThenInclude(sm => sm.User)
                .FirstOrDefaultAsync(s => s.ProjectId == projectId && s.Status == SprintStatus.Active);
        }

        public async Task CreateAsync(Sprint sprint)
        {
            _context.Sprints.Add(sprint);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Sprint sprint)
        {
            _context.Sprints.Update(sprint);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid sprintId)
        {
            var sprint = await _context.Sprints.FindAsync(sprintId);
            if (sprint != null)
            {
                _context.Sprints.Remove(sprint);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasOverlappingSprintAsync(Guid projectId, DateTime startDate, DateTime endDate, Guid? excludeSprintId = null)
        {
            var query = _context.Sprints
                .Where(s => s.ProjectId == projectId &&
                           s.Status != SprintStatus.Cancelled &&
                           ((s.StartDate <= endDate && s.EndDate >= startDate)));

            if (excludeSprintId.HasValue)
                query = query.Where(s => s.SprintId != excludeSprintId.Value);

            return await query.AnyAsync();
        }

        public async Task<SprintMember?> GetSprintMemberAsync(Guid sprintId, Guid userId)
        {
            return await _context.SprintMembers
                .Include(sm => sm.User)
                .FirstOrDefaultAsync(sm => sm.SprintId == sprintId && sm.UserId == userId);
        }

        public async Task AddSprintMemberAsync(SprintMember member)
        {
            _context.SprintMembers.Add(member);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveSprintMemberAsync(Guid sprintId, Guid userId)
        {
            var member = await _context.SprintMembers
                .FirstOrDefaultAsync(sm => sm.SprintId == sprintId && sm.UserId == userId);

            if (member != null)
            {
                _context.SprintMembers.Remove(member);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<SprintMember>> GetSprintMembersAsync(Guid sprintId)
        {
            return await _context.SprintMembers
                .Include(sm => sm.User)
                .Where(sm => sm.SprintId == sprintId)
                .ToListAsync();
        }

        public async Task UpdateSprintMemberAsync(SprintMember member)
        {
            _context.SprintMembers.Update(member);
            await _context.SaveChangesAsync();
        }

        public async Task<int> CountActiveByProjectIdsAsync(List<Guid> projectIds)
        {
            var now = DateTime.UtcNow;
            return await _context.Sprints
                .CountAsync(s =>
                    projectIds.Contains(s.ProjectId) &&
                    (
                        s.Status == SprintStatus.Active ||
                        (
                            s.Status == SprintStatus.Planned &&
                            s.StartDate <= now &&
                            s.EndDate >= now
                        ) ||
                        (
                            s.ActualStartDate != null &&
                            s.ActualEndDate == null &&
                            s.Status != SprintStatus.Completed &&
                            s.Status != SprintStatus.Cancelled
                        )
                    )
                );
        }
    }
}