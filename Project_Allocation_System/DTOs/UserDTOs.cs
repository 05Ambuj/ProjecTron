using Project_Allocation_System.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace Project_Allocation_System.DTOs
{

    public class UserDTO
    {
        public Guid UserId { get; set; }
        public Guid OrganizationId { get; set; }
        public string OrganizationName { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
        public string PhoneNumber { get; set; }
        public string Department { get; set; }
        public UserRole Role { get; set; }
        public string RoleDisplayName => Role.GetDisplayName();
        public DateTime CreatedDate { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsActive { get; set; }
    }

    public class UserProfileDto
    {
        public string Email { get; set; }
        public string DisplayName { get; set; }
        public string RoleDisplayName { get; set; }
        public string Department { get; set; }
        public string PhoneNumber { get; set; }
        public string OrganizationName { get; set; }
    }

    public class UpdateUserProfileReq
    {
        [Required]
        [Phone]
        [MaxLength(12)]
        public string PhoneNumber { get; set; }
        [Required]
        [MaxLength(100)]
        public string Department { get; set; }
    }
    public class ChangePasswordReq
    {
        [Required]
        public string CurrentPassword { get; set; }
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }
    }

    public class AdminDashboardStatsDto
    {
        public int TotalOrganizations { get; set; }
        public int TotalUsers { get; set; }
        public int TotalProjects { get; set; }
        public int OpenTasks { get; set; }
    }

    public class UserFilterRequest
    {
        public string? SearchTerm { get; set; }
        public UserRole? Role { get; set; }
        public bool? IsActive { get; set; }
        public Guid? OrganizationId { get; set; }
        public string? SortBy { get; set; } // "name", "email", "role", "createdDate"
        public string? SortOrder { get; set; } // "asc", "desc"
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

}
