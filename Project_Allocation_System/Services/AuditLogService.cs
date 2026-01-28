using System;
using System.Collections.Generic;
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
    // Service for audit logging functionality
    // Records all important actions like create, update, delete for tracking
    // Very important for compliance and debugging issues
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuditLogService> _logger;

        // Constructor - injecting db context and logger
        public AuditLogService(ApplicationDbContext context, ILogger<AuditLogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // This function creates a new audit log entry
        // Records what action was done, by whom, on which entity
        // Also stores old and new values for tracking changes
        // Note: This function doesn't throw exceptions to not break main flow
        public async Task LogAsync(string entityType, Guid entityId, string action, Guid userId, string userEmail, string? fieldName = null, string? oldValue = null, string? newValue = null, string? description = null, string? ipAddress = null)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    AuditLogId = Guid.NewGuid(),
                    EntityType = entityType,
                    EntityId = entityId,
                    Action = action,
                    FieldName = fieldName,
                    OldValue = oldValue,
                    NewValue = newValue,
                    UserId = userId,
                    UserEmail = userEmail,
                    Description = description ?? $"{action} on {entityType} {entityId}",
                    IpAddress = ipAddress,
                    CreatedDate = DateTime.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging audit entry. EntityType={EntityType}, EntityId={EntityId}, Action={Action}", entityType, entityId, action);
                // Don't throw - audit logging should not break the main flow
            }
        }

        // This function fetches audit logs with pagination and filtering
        // Can filter by entity type, action, user email, date range and search term
        // Returns logs ordered by created date descending (newest first)
        public async Task<(List<AuditLogDto> logs, int totalCount)> GetAuditLogsAsync(AuditLogFilterRequest filter)
        {
            var query = _context.AuditLogs.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.EntityType))
            {
                query = query.Where(a => a.EntityType.Contains(filter.EntityType));
            }

            if (!string.IsNullOrWhiteSpace(filter.Action))
            {
                query = query.Where(a => a.Action.Contains(filter.Action));
            }

            if (!string.IsNullOrWhiteSpace(filter.UserEmail))
            {
                query = query.Where(a => a.UserEmail.Contains(filter.UserEmail));
            }

            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.CreatedDate >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.CreatedDate <= filter.EndDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.EntityType.ToLower().Contains(searchTerm) ||
                    a.Action.ToLower().Contains(searchTerm) ||
                    a.UserEmail.ToLower().Contains(searchTerm) ||
                    (a.Description != null && a.Description.ToLower().Contains(searchTerm)));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var skip = (filter.PageNumber - 1) * filter.PageSize;
            var logs = await query
                .OrderByDescending(a => a.CreatedDate)
                .Skip(skip)
                .Take(filter.PageSize)
                .Select(a => new AuditLogDto
                {
                    AuditLogId = a.AuditLogId.ToString(),
                    EntityType = a.EntityType,
                    EntityId = a.EntityId.ToString(),
                    Action = a.Action,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    UserId = a.UserId.ToString(),
                    UserEmail = a.UserEmail,
                    Description = a.Description,
                    CreatedDate = a.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    IpAddress = a.IpAddress
                })
                .ToListAsync();

            return (logs, totalCount);
        }

        // This function gets most recent audit logs
        // Default limit is 5, useful for showing recent activity on dashboard
        public async Task<List<AuditLogDto>> GetRecentAuditLogsAsync(int limit = 5)
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(a => a.CreatedDate)
                .Take(limit)
                .Select(a => new AuditLogDto
                {
                    AuditLogId = a.AuditLogId.ToString(),
                    EntityType = a.EntityType,
                    EntityId = a.EntityId.ToString(),
                    Action = a.Action,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    UserId = a.UserId.ToString(),
                    UserEmail = a.UserEmail,
                    Description = a.Description,
                    CreatedDate = a.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    IpAddress = a.IpAddress
                })
                .ToListAsync();

            return logs;
        }
    }
}
