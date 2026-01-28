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
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(Guid userId)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }
        public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
        {
            return await _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == userId)
                .Select(u => new UserProfileDto
                {
                    Email = u.Email,
                    DisplayName = u.DisplayName,
                    RoleDisplayName = u.Role.GetDisplayName(),
                    Department = u.Department,
                    PhoneNumber = u.PhoneNumber,
                    OrganizationName = u.Organization.Name
                })
                .SingleOrDefaultAsync();
        }


        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        }

        public async Task<User?> GetByEmailIncludeInactiveAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.IsActive = false;
                user.UpdatedDate = DateTime.UtcNow;
                user.UpdatedBy = "Admin";

                await _context.SaveChangesAsync();
            }
        }

        public async Task<(List<User> Users, int TotalCount)> GetPagedAsync(
            int page, int pageSize, bool includeInactive = false, Guid? organizationId = null)
        {
            var query = _context.Users.AsNoTracking().Include(u => u.Organization).AsQueryable();

            if (!includeInactive)
                query = query.Where(u => u.IsActive);

            if (organizationId.HasValue)
                query = query.Where(u => u.OrganizationId == organizationId.Value);

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, totalCount);
        }

        public async Task<(List<User> Users, int TotalCount)> GetFilteredAsync(UserFilterRequest filter)
        {
            var query = _context.Users.AsNoTracking().Include(u => u.Organization).AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(u =>
                    u.DisplayName.ToLower().Contains(searchTerm) ||
                    u.Email.ToLower().Contains(searchTerm) ||
                    (u.Department != null && u.Department.ToLower().Contains(searchTerm)) ||
                    (u.Organization != null && u.Organization.Name.ToLower().Contains(searchTerm)));
            }

            // Role filter - MUST be applied before counting
            if (filter.Role.HasValue)
            {
                var roleValue = filter.Role.Value;
                // Direct enum comparison - EF Core with HasConversion<int>() handles this correctly
                query = query.Where(u => u.Role == roleValue);
            }

            // Status filter
            if (filter.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == filter.IsActive.Value);
            }

            // Organization filter
            if (filter.OrganizationId.HasValue)
            {
                query = query.Where(u => u.OrganizationId == filter.OrganizationId.Value);
            }

            var totalCount = await query.CountAsync();

            // Sorting
            var sortBy = filter.SortBy?.ToLower() ?? "createdDate";
            var sortOrder = filter.SortOrder?.ToLower() ?? "desc";

            query = sortBy switch
            {
                "name" => sortOrder == "asc" ? query.OrderBy(u => u.DisplayName) : query.OrderByDescending(u => u.DisplayName),
                "email" => sortOrder == "asc" ? query.OrderBy(u => u.Email) : query.OrderByDescending(u => u.Email),
                "role" => sortOrder == "asc" ? query.OrderBy(u => u.Role) : query.OrderByDescending(u => u.Role),
                "createdDate" => sortOrder == "asc" ? query.OrderBy(u => u.CreatedDate) : query.OrderByDescending(u => u.CreatedDate),
                _ => query.OrderByDescending(u => u.CreatedDate)
            };

            var users = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (users, totalCount);
        }

        public async Task<bool> IsAccountLockedAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.LockoutUntil == null)
                return false;

            if (user.LockoutUntil > DateTime.UtcNow)
                return true;

            user.LockoutUntil = null;
            user.FailedLoginAttempts = 0;
            await _context.SaveChangesAsync();
            return false;
        }

        public async Task IncrementFailedLoginAttemptsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.FailedLoginAttempts++;

                if (user.FailedLoginAttempts >= 5)
                {
                    user.LockoutUntil = DateTime.UtcNow.AddMinutes(30);
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task ResetFailedLoginAttemptsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.FailedLoginAttempts = 0;
                user.LockoutUntil = null;
                user.LastLogin = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Organization?> GetDefaultOrganizationAsync()
        {
            return await _context.Organizations.FirstOrDefaultAsync();
        }

        // Only allowed to admin( may change). Project manager should have similar but within the organization level. Team lead same for team level
        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users
                .Include(u => u.Organization)
                .OrderBy(u => u.CreatedDate)
                .ToListAsync();
        }

        //Personal Profile

        public async Task UpdateProfileAsync(
            Guid userId,
            string phoneNumber,
            string department)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return;

            user.PhoneNumber = phoneNumber;
            user.Department = department;
            user.UpdatedDate = DateTime.UtcNow;
            user.UpdatedBy = "Self";

            await _context.SaveChangesAsync();
        }

        public async Task UpdatePasswordAsync(
            Guid userId,
            string passwordHash,
            string passwordSalt)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return;

            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;
            user.UpdatedDate = DateTime.UtcNow;
            user.UpdatedBy = "Self";

            await _context.SaveChangesAsync();
        }
    }
}
