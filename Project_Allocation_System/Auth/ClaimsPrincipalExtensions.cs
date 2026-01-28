using Project_Allocation_System.Models;
using System;
using System.Security.Claims;

namespace Project_Allocation_System.Auth
{
    // It is used to extract the user's data from the JWT claims
    // eg- to get the details like userId from JWT and use it to retrive the details like user data
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            //Find the NameIdentifier claim(UserId) in the JWT
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userId))
                throw new UnauthorizedAccessException("UserId claim missing");

            return Guid.Parse(userId);
        }
        public static Guid GetOrganizationId(this ClaimsPrincipal user)
        {
            var orgId = user.FindFirstValue("organizationId");

            if (string.IsNullOrWhiteSpace(orgId))
                throw new UnauthorizedAccessException("OrganizationId claim missing");

            return Guid.Parse(orgId);
        }

        public static UserRole GetUserRole(this ClaimsPrincipal user)
        {
            var roleClaim = user.FindFirst(ClaimTypes.Role);
            if (roleClaim != null && Enum.TryParse<UserRole>(roleClaim.Value, out var role))
            {
                return role;
            }
            return UserRole.TeamMember; // Default fallback
        }

        public static string GetUserEmail(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Email)?.Value;
        }

        public static bool IsInAnyRole(this ClaimsPrincipal user, params UserRole[] roles)
        {
            var userRole = user.GetUserRole();
            return roles.Contains(userRole);
        }
    }
}
