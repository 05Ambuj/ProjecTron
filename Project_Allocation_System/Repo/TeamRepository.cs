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
    public class TeamRepository : ITeamRepository
    {
        private readonly ApplicationDbContext _context;

        public TeamRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Team?> GetByIdAsync(Guid teamId)
        {
            return await _context.Teams
                .Include(t => t.Project)
                .Include(t => t.TeamLead)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);
        }

        public async Task<Team?> GetByIdWithMembersAsync(Guid teamId)
        {
            return await _context.Teams
                .Include(t => t.Project)
                .Include(t => t.TeamLead)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);
        }

        public async Task<List<Team>> GetByProjectIdAsync(Guid projectId)
        {
            return await _context.Teams
                .Include(t => t.TeamLead)
                .Where(t => t.ProjectId == projectId)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        public async Task<List<Team>> GetByProjectIdWithMembersAsync(Guid projectId)
        {
            return await _context.Teams
                .Include(t => t.Project)
                .Include(t => t.TeamLead)
                .Include(t => t.Members.Where(m => m.IsActive))
                    .ThenInclude(m => m.User)
                .Where(t => t.ProjectId == projectId)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(Guid projectId, string teamName)
        {
            return await _context.Teams
                .AnyAsync(t => t.ProjectId == projectId && 
                              t.Name.ToLower() == teamName.ToLower());
        }

        public async Task<bool> IsUserTeamLeadAsync(Guid projectId, Guid userId)
        {
            return await _context.Teams
                .AnyAsync(t => t.ProjectId == projectId && 
                              t.TeamLeadId == userId);
        }

        public async Task<Team> CreateAsync(Team team)
        {
            _context.Teams.Add(team);
            await _context.SaveChangesAsync();
            return team;
        }

        public async Task<Team> UpdateAsync(Team team)
        {
            _context.Teams.Update(team);
            await _context.SaveChangesAsync();
            return team;
        }

        public async Task DeleteAsync(Guid teamId)
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team != null)
            {
                _context.Teams.Remove(team);
                await _context.SaveChangesAsync();
            }
        }

        // Team Member operations
        public async Task<TeamMember?> GetTeamMemberAsync(Guid teamId, Guid userId)
        {
            return await _context.TeamMembers
                .Include(tm => tm.User)
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && 
                                          tm.UserId == userId && 
                                          tm.IsActive);
        }

        public async Task<bool> IsUserInTeamAsync(Guid teamId, Guid userId)
        {
            return await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && 
                               tm.UserId == userId && 
                               tm.IsActive);
        }

        public async Task<bool> IsUserInAnyTeamOfProjectAsync(Guid projectId, Guid userId)
        {
            // Check if user is a team lead or team member in any team of the project
            var isTeamLead = await _context.Teams
                .AnyAsync(t => t.ProjectId == projectId && 
                              t.TeamLeadId == userId);

            if (isTeamLead) return true;

            return await _context.TeamMembers
                .Include(tm => tm.Team)
                .AnyAsync(tm => tm.Team.ProjectId == projectId && 
                               tm.UserId == userId && 
                               tm.IsActive);
        }

        public async Task<TeamMember> AddMemberAsync(TeamMember member)
        {
            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();
            return member;
        }

        public async Task RemoveMemberAsync(Guid teamId, Guid userId)
        {
            var member = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
            
            if (member != null)
            {
                member.IsActive = false;
                member.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> GetMemberCountAsync(Guid teamId)
        {
            return await _context.TeamMembers
                .CountAsync(tm => tm.TeamId == teamId && tm.IsActive);
        }
    }
}
