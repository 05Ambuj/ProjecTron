using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Project_Allocation_System.DTOs;

namespace Project_Allocation_System.Interfaces
{
    public interface IUserService
    {
        // Admin
        Task<ApiResponse<List<UserDTO>>> GetAllUsersAsync();
        Task<ApiResponse<UserDTO>> GetByIdAsync(Guid userId);
        Task<ApiResponse<UserDTO>> UpdateStatusAsync(Guid userId, bool isActive);
        Task<ApiResponse<PagedResponse<UserDTO>>> GetPagedUsersAsync(
            int page,int pageSize,bool includeInactive,Guid? organizationId = null
        );
        Task<ApiResponse<PagedResponse<UserDTO>>> GetFilteredUsersAsync(UserFilterRequest filter);
        // Self (profile)
        Task<UserProfileDto?> GetMyProfileAsync(Guid userId);
        Task<ApiResponse<UserDTO>> UpdateMyProfileAsync(Guid userId, UpdateUserProfileReq request);
        Task<ApiResponse<bool>> ChangeMyPasswordAsync(Guid userId, ChangePasswordReq request);
    }
}
