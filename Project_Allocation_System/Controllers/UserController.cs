using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Auth;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling user related operations
    // Manages user profiles, listing users, deleting users etc
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        // Constructor - injecting user service
        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // This function fetches all users with pagination, filtering and sorting
        // PM will only see users from their organization
        // Can filter by role, status and search by name/email/dept
        [HttpGet]
        [Authorize(Roles = "Admin,ProjectManager,TeamLead")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool includeInactive = false,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? role = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = null)
        {
            // Validate pagination parameters
            if (page <= 0 || pageSize <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid paging parameters. Page and PageSize must be greater than 0.",
                    Data = null,
                    StatusCode = 400
                });
            }

            Guid? organizationId = null;

            //Enforce org-level restriction for Project Manager
            if (User.IsInRole("ProjectManager"))
            {
                organizationId = User.GetOrganizationId(); // from claims
            }

            // Parse role from int to UserRole enum
            UserRole? roleEnum = null;
            if (role.HasValue)
            {
                // Check if the integer value is a valid enum value
                if (Enum.IsDefined(typeof(UserRole), role.Value))
                {
                    roleEnum = (UserRole)role.Value;
                }
                // If invalid enum value, roleEnum remains null and filter won't be applied
            }

            // Always use filtered endpoint for consistency
            // Priority: If isActive is explicitly provided, use it. Otherwise, use includeInactive logic.
            bool? finalIsActive = isActive.HasValue 
                ? isActive.Value 
                : (includeInactive ? (bool?)null : true);

            var filter = new UserFilterRequest
            {
                PageNumber = page,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                Role = roleEnum,
                IsActive = finalIsActive,
                OrganizationId = organizationId,
                SortBy = sortBy,
                SortOrder = sortOrder
            };

            var response = await _userService.GetFilteredUsersAsync(filter);
            return StatusCode(response.StatusCode, response);
        }


        // This function soft deletes a user
        // Sets isActive to false instead of actually deleting
        // Only Admin can delete users
        [HttpDelete("{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteUser(Guid userId)
        {
            await _userService.UpdateStatusAsync(userId, false);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "User deleted successfully",
                Data = null,
                StatusCode = StatusCodes.Status200OK
            });
        }
        // This function gets current logged in user's profile
        // Fetches user details using userId from JWT token claims
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {  
            var userId = User.GetUserId();
            var profile = await _userService.GetMyProfileAsync(userId);

            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        // This function updates current user's profile
        // Can update phone number and department only
        [HttpPut("me/profile")]
        public async Task<IActionResult> UpdateMyProfile(
            [FromBody] UpdateUserProfileReq request)
        {
            var userId = User.GetUserId();

            var response = await _userService.UpdateMyProfileAsync(userId, request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPut("me/password")]
        public async Task<IActionResult> ChangeMyPassword(
            [FromBody] ChangePasswordReq request)
        {
            var userId = User.GetUserId();

            var response = await _userService.ChangeMyPasswordAsync(userId, request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("{userId}")]
        [Authorize(Roles = "Admin,ProjectManager")]
        public async Task<IActionResult> GetUserById(Guid userId)
        {
            var response = await _userService.GetByIdAsync(userId);
            return StatusCode(response.StatusCode, response);
        }
    }
}