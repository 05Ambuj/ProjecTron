using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid userId);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByEmailIncludeInactiveAsync(string email);
        Task CreateAsync(User user);
        Task UpdateAsync(User user);
        Task DeleteAsync(Guid userId);
        Task<UserProfileDto?> GetProfileAsync(Guid userId);
        Task<(List<User> Users, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            bool includeInactive,
            Guid? organizationId = null
        );
        Task<(List<User> Users, int TotalCount)> GetFilteredAsync(UserFilterRequest filter);
        Task<bool> IsAccountLockedAsync(Guid userId);
        Task IncrementFailedLoginAttemptsAsync(Guid userId);
        Task ResetFailedLoginAttemptsAsync(Guid userId);
        Task<Organization?> GetDefaultOrganizationAsync();
        Task<List<User>> GetAllAsync();
        Task UpdateProfileAsync(Guid userId, string phoneNumber, string department);
        Task UpdatePasswordAsync(Guid userId, string passwordHash, string passwordSalt);
    }
}
