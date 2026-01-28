using System.ComponentModel.DataAnnotations;

namespace Project_Allocation_System.Models
{
    public enum UserRole
    {
        [Display(Name = "Administrator")]
        Admin = 1,

        [Display(Name = "Project Manager")]
        ProjectManager = 2,

        [Display(Name = "Team Lead")]
        TeamLead = 3,

        [Display(Name = "Team Member")]
        TeamMember = 4
    }

    public static class UserRoleExtensions
    {
        public static UserRole[] SelfRegisterableRoles()
        {
            return new[] { UserRole.ProjectManager, UserRole.TeamLead, UserRole.TeamMember };
        }

        public static bool CanSelfRegister(this UserRole role)
        {
            return SelfRegisterableRoles().Contains(role);
        }

        public static bool CanManageUsers(this UserRole role)
        {
            return role == UserRole.Admin;
        }

        public static bool CanManageProjects(this UserRole role)
        {
            return role == UserRole.Admin || role == UserRole.ProjectManager;
        }

        public static bool CanAssignWork(this UserRole role)
        {
            return role == UserRole.Admin || role == UserRole.TeamLead;
        }

        public static int GetHierarchyLevel(this UserRole role)
        {
            return role switch
            {
                UserRole.Admin => 4,
                UserRole.ProjectManager => 3,
                UserRole.TeamLead => 2,
                UserRole.TeamMember => 1,
                _ => 0
            };
        }

        public static string GetDisplayName(this UserRole role)
        {
            return role switch
            {
                UserRole.Admin => "Administrator",
                UserRole.ProjectManager => "Project Manager",
                UserRole.TeamLead => "Team Lead",
                UserRole.TeamMember => "Team Member",
                _ => "Unknown"
            };
        }
    }
}
