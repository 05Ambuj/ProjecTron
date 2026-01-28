using AutoMapper;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using Project_Allocation_System.Repos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Project_Allocation_System.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordService _passwordService;
        private readonly ILogger<UserService> _logger;
        private readonly IMapper _mapper;

        public UserService(
            IUserRepository userRepository,
            IPasswordService passwordService,
            ILogger<UserService> logger,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _logger = logger;
            _mapper = mapper;
        }
        // To get all the users- May need to add filtered users- Filteration needs to be done at database level.
        public async Task<ApiResponse<List<UserDTO>>> GetAllUsersAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all users");

                var users = await _userRepository.GetAllAsync();

                return new ApiResponse<List<UserDTO>>
                {
                    Success = true,
                    Message = "Users retrieved successfully",
                    Data = users.Select(MapToDTO).ToList(),
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all users");
                throw;
            }
        }
        // Get user's profile data
        public async Task<UserProfileDto?> GetMyProfileAsync(Guid userId)
        {
            try
            {
                var profile = await _userRepository.GetProfileAsync(userId);
                if (profile == null)
                {
                    _logger.LogWarning("User profile not found. UserId={UserId}", userId);
                    return null;
                }

                return profile;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile. UserId={UserId}", userId);
                throw;
            }
        }
        // Fetch the users in paginated manner, according to the provided page and pagesize. 
        // Also check if the user is active or not 
        public async Task<ApiResponse<PagedResponse<UserDTO>>> GetPagedUsersAsync(
            int page, int pageSize, bool includeInactive, Guid? organizationId = null)
        {
            if (page <= 0 || pageSize <= 0)
            {
                return new ApiResponse<PagedResponse<UserDTO>>
                {
                    Success = false,
                    Message = "Invalid paging parameters",
                    StatusCode = 400
                };
            }

            try
            {
                _logger.LogInformation(
                    "Fetching paged users: Page={Page}, PageSize={PageSize}, IncludeInactive={IncludeInactive}",
                    page, pageSize, includeInactive);

                var (users, totalCount) =
                    await _userRepository.GetPagedAsync(page, pageSize, includeInactive, organizationId);

                return new ApiResponse<PagedResponse<UserDTO>>
                {
                    Success = true,
                    Message = "Users retrieved successfully",
                    Data = new PagedResponse<UserDTO>
                    {
                        Items = users.Select(MapToDTO).ToList(),
                        TotalCount = totalCount,
                        Page = page,
                        PageSize = pageSize
                    },
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving paged users");
                throw;
            }
        }

        public async Task<ApiResponse<PagedResponse<UserDTO>>> GetFilteredUsersAsync(UserFilterRequest filter)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching filtered users: Page={Page}, PageSize={PageSize}, SearchTerm={SearchTerm}, Role={Role}, IsActive={IsActive}, OrganizationId={OrganizationId}, SortBy={SortBy}, SortOrder={SortOrder}",
                    filter.PageNumber, filter.PageSize, filter.SearchTerm, filter.Role, filter.IsActive, filter.OrganizationId, filter.SortBy, filter.SortOrder);

                // All filtering, pagination, searching, and sorting is done at repository layer
                var (users, totalCount) = await _userRepository.GetFilteredAsync(filter);

                return new ApiResponse<PagedResponse<UserDTO>>
                {
                    Success = true,
                    Message = "Users retrieved successfully",
                    Data = new PagedResponse<UserDTO>
                    {
                        Items = users.Select(MapToDTO).ToList(),
                        TotalCount = totalCount,
                        Page = filter.PageNumber,
                        PageSize = filter.PageSize
                    },
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered users");
                throw;
            }
        }

        //Get the data based on user's Id
        public async Task<ApiResponse<UserDTO>> GetByIdAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Fetching user with ID {UserId}", userId);

                var user = await _userRepository.GetByIdAsync(userId);

                if (user == null)
                {
                    _logger.LogWarning("User not found: {UserId}", userId);
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404
                    };
                }

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "User retrieved successfully",
                    Data = MapToDTO(user),
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user {UserId}", userId);
                throw;
            }
        }

        // Update user's status
        public async Task<ApiResponse<UserDTO>> UpdateStatusAsync(Guid userId, bool isActive)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for status update: {UserId}", userId);
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404
                    };
                }

                user.IsActive = isActive;
                await _userRepository.UpdateAsync(user);

                _logger.LogInformation(
                    "User {UserId} status updated to {IsActive}",
                    userId, isActive);

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "User status updated",
                    Data = MapToDTO(user),
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status {UserId}", userId);
                throw;
            }
        }

        // Update the user's profile- Phone Number, dept, and also password

        // Update user's - Phone number and dept
        public async Task<ApiResponse<UserDTO>> UpdateMyProfileAsync(
            Guid userId,
            UpdateUserProfileReq request)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Profile update failed, user not found {UserId}", userId);
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404
                    };
                }

                await _userRepository.UpdateProfileAsync(
                    userId,
                    request.PhoneNumber,
                    request.Department
                );

                user.PhoneNumber = request.PhoneNumber;
                user.Department = request.Department;

                _logger.LogInformation("Profile updated for user {UserId}", userId);

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "Profile updated successfully",
                    Data = MapToDTO(user),
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
                throw;
            }
        }
        //Change User's paasword
        public async Task<ApiResponse<bool>> ChangeMyPasswordAsync(Guid userId, ChangePasswordReq request)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Password change failed, user not found {UserId}", userId);
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404
                    };
                }
                // Call verify pass to match the req pass with encrypted pass
                var isValid = _passwordService.VerifyPassword(
                    request.CurrentPassword,
                    user.PasswordHash,
                    user.PasswordSalt
                );

                if (!isValid)
                {
                    _logger.LogWarning("Invalid current password attempt for user {UserId}", userId);
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Current password is incorrect",
                        StatusCode = 400
                    };
                }

                var (hash, salt) = _passwordService.HashPassword(request.NewPassword);
                await _userRepository.UpdatePasswordAsync(userId, hash, salt);

                _logger.LogInformation("Password changed successfully for user {UserId}", userId);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Password changed successfully",
                    Data = true,
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                throw;
            }
        }


        /// <summary>
        /// Maps a User to UserDTO using AutoMapper.
        /// </summary>
        private UserDTO MapToDTO(User user)
        {
            return _mapper.Map<UserDTO>(user);
        }
    }
}


