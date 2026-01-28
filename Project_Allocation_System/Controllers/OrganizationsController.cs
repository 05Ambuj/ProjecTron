using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using System.Collections.Generic;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling organization related CRUD operations
    // Organizations are basically companies that users belong to
    [ApiController]
    [Route("api/organizations")]
    [Authorize]
    public class OrganizationsController : ControllerBase
    {
        private readonly IOrganizationRepository _repository;

        // Constructor - injecting organization repository
        public OrganizationsController(IOrganizationRepository repository)
        {
            _repository = repository;
        }

        // This function fetches all organizations with pagination and filtering
        // Made it anonymous because we need org list during user registration
        // Returns org details along with user count and project count for each org
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetOrganizations(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100,
            [FromQuery] string? searchTerm = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = null)
        {
            // Validate pagination parameters
            if (pageNumber <= 0 || pageSize <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid paging parameters. PageNumber and PageSize must be greater than 0.",
                    Data = null,
                    StatusCode = StatusCodes.Status400BadRequest
                });
            }

            // Always use filtered endpoint for consistency
            var filter = new OrganizationFilterRequest
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                IsActive = isActive,
                SortBy = sortBy,
                SortOrder = sortOrder
            };

            var (orgs, totalCount) = await _repository.GetFilteredAsync(filter);

            var data = new List<object>();
            foreach (var o in orgs)
            {
                var userCount = await _repository.GetUserCountAsync(o.OrganizationId);
                var projectCount = await _repository.GetProjectCountAsync(o.OrganizationId);
                data.Add(new
                {
                    o.OrganizationId,
                    o.Name,
                    o.Location,
                    o.IsActive,
                    UserCount = userCount,
                    ProjectCount = projectCount
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Organizations fetched successfully",
                Data = new
                {
                    Items = data,
                    TotalCount = totalCount,
                    Page = pageNumber,
                    PageSize = pageSize
                },
                StatusCode = StatusCodes.Status200OK
            });
        }

        // Create organization (Admin only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateOrganization([FromBody] OrganizationDtos request)
        {
            var org = new Organization
            {
                OrganizationId = Guid.NewGuid(),
                Name = request.Name,
                Location = request.Location,
                IsActive = true,
                CreatedBy = "Admin"
            };

            await _repository.CreateAsync(org);

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<object>
            {
                Success = true,
                Message = "Organization created successfully",
                Data = new
                {
                    org.OrganizationId,
                    org.Name,
                    org.Location
                },
                StatusCode = StatusCodes.Status201Created
            });
        }

        // This function deletes an organization (soft delete)
        // Only admin can delete organizations
        // First checks if org has any users or projects - if yes then cannot delete
        [HttpDelete("{organizationId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOrganization(Guid organizationId)
        {
            var org = await _repository.GetByIdAsync(organizationId);

            if (org == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Organization not found",
                    Data = null,
                    StatusCode = StatusCodes.Status404NotFound
                });
            }

            var userCount = await _repository.GetUserCountAsync(organizationId);
            var projectCount = await _repository.GetProjectCountAsync(organizationId);

            if (userCount > 0 || projectCount > 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Organization has active users or projects",
                    Data = null,
                    StatusCode = StatusCodes.Status400BadRequest
                });
            }

            await _repository.DeleteAsync(organizationId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Organization deleted successfully",
                Data = null,
                StatusCode = StatusCodes.Status200OK
            });
        }

        // This function returns statistics for a specific organization
        // Returns total users count and total projects count
        // Useful for admin to see org level metrics
        [HttpGet("{organizationId}/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOrganizationStats(Guid organizationId)
        {
            var org = await _repository.GetByIdAsync(organizationId);

            if (org == null || !org.IsActive)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Organization not found",
                    Data = null,
                    StatusCode = StatusCodes.Status404NotFound
                });
            }

            var userCount = await _repository.GetUserCountAsync(organizationId);
            var projectCount = await _repository.GetProjectCountAsync(organizationId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Organization statistics fetched successfully",
                Data = new
                {
                    OrganizationId = organizationId,
                    TotalUsers = userCount,
                    TotalProjects = projectCount
                },
                StatusCode = StatusCodes.Status200OK
            });
        }

        // This function fetches single organization details by its id
        // Returns all org info like name, location, created date etc
        [HttpGet("{organizationId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOrganizationById(Guid organizationId)
        {
            var org = await _repository.GetByIdAsync(organizationId);

            if (org == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Organization not found",
                    Data = null,
                    StatusCode = StatusCodes.Status404NotFound
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Organization fetched successfully",
                Data = new
                {
                    org.OrganizationId,
                    org.Name,
                    org.Location,
                    org.IsActive,
                    org.CreatedDate,
                    org.CreatedBy
                },
                StatusCode = StatusCodes.Status200OK
            });
        }
    }
}
