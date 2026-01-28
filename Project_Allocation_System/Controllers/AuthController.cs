using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Project_Allocation_System.Controllers
{
    // Controller for handling authentication related operations
    // Login and registration endpoints are here
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationService _authService;

        // Constructor - injecting auth service
        public AuthController(IAuthenticationService authService)
        {
            _authService = authService;
        }

        // This function handles user login
        // Takes email and password, validates and returns JWT token if correct
        // Anyone can access this endpoint (no auth required)
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginReq request)
        {
            var response = await _authService.LoginAsync(request);
            return response.Success ? Ok(response) : Unauthorized(response);
        }

        // This function is for new user registration
        // Takes user details like name, email, password etc and creates account
        // Note: Admin role cannot be self-registered for security reasons
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterReq request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result);
        }
    }
}
