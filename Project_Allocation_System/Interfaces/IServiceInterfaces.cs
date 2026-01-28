using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Interfaces
{
    // Authentication & Security Interfaces
    public interface IJwtTokenProvider
    {
        string GenerateAccessToken(User user);
        ClaimsPrincipal? GetPrincipalFromToken(string token);
        Guid? GetUserIdFromToken(string token);
        int GetAccessTokenExpiryMinutes();
    }

    public interface IPasswordService
    {
        // Returns a Tuple of (PasswordHash, PasswordSalt)
        (string PasswordHash, string PasswordSalt) HashPassword(string password);

        // Verify a password against its hash using constant-time comparison to prevent timing attacks
        // Returns True if password matches, otherwise false
        bool VerifyPassword(string password, string passwordHash, string passwordSalt);
    }

    public interface IAuditLogService
    {
        Task LogAsync(string entityType, Guid entityId, string action, Guid userId, string userEmail, string? fieldName = null, string? oldValue = null, string? newValue = null, string? description = null, string? ipAddress = null);
        Task<(List<Project_Allocation_System.DTOs.AuditLogDto> logs, int totalCount)> GetAuditLogsAsync(Project_Allocation_System.DTOs.AuditLogFilterRequest filter);
        Task<List<Project_Allocation_System.DTOs.AuditLogDto>> GetRecentAuditLogsAsync(int limit = 5);
    }
}
