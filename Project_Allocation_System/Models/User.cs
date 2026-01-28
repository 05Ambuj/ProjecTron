using System;
using System.Collections.Generic;

namespace Project_Allocation_System.Models
{
    public class User
    {
        public Guid UserId { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
        public Guid OrganizationId { get; set; }
        public string PhoneNumber { get; set; }
        public UserRole Role { get; set; }
        public string Department { get; set; }
        public string Designation { get; set; }

        public string PasswordHash { get; set; }
        public string PasswordSalt { get; set; }

        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutUntil { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }

        // Foreign Key Relationship
        public virtual Organization Organization { get; set; }
        public virtual ICollection<Project> ManagedProjects { get; set; }
        public virtual ICollection<ProjectAllocation> Allocations { get; set; }
        public virtual ICollection<WorkTask> AssignedTasks { get; set; }
    }
}