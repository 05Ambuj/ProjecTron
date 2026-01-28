using Microsoft.AspNetCore.Identity.Data;
using Project_Allocation_System.DTOs;
using System;
using System.Threading.Tasks;

namespace Project_Allocation_System.Interfaces
{
    public interface IAuthenticationService
    {
        Task<LoginRes> LoginAsync(LoginReq request);
        Task<RegisterRes> RegisterAsync(RegisterReq request);
        Task<ApiResponse<UserDTO>> GetCurrentUserAsync(Guid userId);
    }
}
