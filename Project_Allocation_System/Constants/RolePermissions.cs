using Project_Allocation_System.Models;

namespace Project_Allocation_System.Constants
{
    public static class RolePermissions
    {
        public static Dictionary<UserRole, string[]> Permissions = new()
        {
            {
                UserRole.Admin,
                new[]
                {
                    "manage_users",
                    "manage_projects",
                    "create_projects",
                    "edit_projects",
                    "delete_projects",
                    "allocate_resources",
                    "view_all_projects",
                    "view_allocations",
                    "assign_work",
                    "view_team_progress",
                    "view_audit_logs",
                }
            },
            {
                UserRole.ProjectManager,
                new[]
                {
                    "create_projects",
                    "edit_projects",
                    "view_all_projects",
                    "allocate_resources",
                    "assign_work",
                    "view_team_progress",
                    "view_allocations",
                }
            },
            {
                UserRole.TeamLead,
                new[]
                {
                    "assign_work",
                    "view_team_progress",
                    "view_allocations",
                    "view_tasks",
                    "update_task_status",
                }
            },
            {
                UserRole.TeamMember,
                new[]
                {
                    "view_tasks",
                    "update_task_status",
                    "add_task_comments",
                    "view_work_progress",
                }
            },
        };

        public static bool HasPermission(UserRole role, string permission)
        {
            if (!Permissions.TryGetValue(role, out var rolePermissions))
                return false;

            return rolePermissions.Contains(permission);
        }
    }
}
