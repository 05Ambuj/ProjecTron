using System;
using System.Threading.Tasks;
using AutoMapper;
using Project_Allocation_System.Auth;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;
using Project_Allocation_System.Repos;

namespace Project_Allocation_System.Services
{
    // Service for handling authentication operations
    // Contains logic for login, register and getting current user details
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtTokenProvider _jwtTokenProvider;
        private readonly IPasswordService _passwordService;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly IOrganizationRepository _organizationRepository;
        private readonly IMapper _mapper;
        private readonly ServiceBusNotificationService _notificationService;

        // Constructor - injecting all required dependencies
        public AuthenticationService(
            IUserRepository userRepository,
            IOrganizationRepository organizationRepository,
            IJwtTokenProvider jwtTokenProvider,
            IPasswordService passwordService,
            ILogger<AuthenticationService> logger,
            IMapper mapper,
            ServiceBusNotificationService notificationService
        )
        {
            _userRepository = userRepository;
            _organizationRepository = organizationRepository;
            _passwordService = passwordService;
            _jwtTokenProvider = jwtTokenProvider;
            _logger = logger;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        // This function registers a new user in the system
        // Admin role cannot be self registered for security reasons
        // Validates email is unique, org is valid and active
        // Password is hashed using PBKDF2 before storing
        public async Task<RegisterRes> RegisterAsync(RegisterReq request)
        {
            try
            {
                if (!request.Role.CanSelfRegister())
                {
                    _logger.LogWarning(
                        "Attempted self-registration with forbidden role {Role}",
                        request.Role
                    );
                    return new RegisterRes
                    {
                        Success = false,
                        Message = "Admin role cannot self-register",
                    };
                }
                // Verify that the registering usre's email is not already present
                var existingUser = await _userRepository.GetByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning(
                        "Registration failed, email already exists: {Email}",
                        request.Email
                    );
                    return new RegisterRes
                    {
                        Success = false,
                        Message = "Email already registered",
                    };
                }
                // Verify that orgId is not empty or org is not active. If any of these are true, throw error.
                if (request.OrganizationId == Guid.Empty)
                {
                    return new RegisterRes
                    {
                        Success = false,
                        Message = "Organization is required",
                    };
                }

                var organization = await _organizationRepository.GetByIdAsync(
                    request.OrganizationId
                );
                if (organization == null || !organization.IsActive)
                {
                    return new RegisterRes
                    {
                        Success = false,
                        Message = "Invalid organization selected",
                    };
                }
                //Hash/encrypt the password
                var (hash, salt) = _passwordService.HashPassword(request.Password);
                // If everything is correct, create a new user and save it to db
                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    OrganizationId = organization.OrganizationId,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    DisplayName = $"{request.FirstName} {request.LastName}",
                    Department = request.Department,
                    PhoneNumber = request.PhoneNumber,
                    Designation = request.Designation,
                    Role = request.Role,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    IsActive = true,
                    CreatedBy = "Self-Registration",
                };

                await _userRepository.CreateAsync(user);

                _logger.LogInformation("User registered successfully: {Email}", request.Email);

                // Send welcome email
                _logger.LogInformation(
                    "Preparing to send 'user-registered' email notification. UserId: {UserId}, Email: {Email}",
                    user.UserId,
                    user.Email
                );

                if (string.IsNullOrWhiteSpace(user.Email))
                {
                    _logger.LogWarning(
                        "Cannot send welcome email: User email is null or empty. UserId: {UserId}",
                        user.UserId
                    );
                }
                else
                {
                    var templateData = new Dictionary<string, object>
                    {
                        ["FirstName"] = user.FirstName,
                        ["Email"] = user.Email,
                        ["Role"] = user.Role.GetDisplayName(),
                        ["LoginUrl"] = "https://yourapp.com/login", // Update with your actual URL
                    };
                    _logger.LogInformation(
                        "Calling SendEmailNotificationAsync for 'user-registered'. Email: {Email}, TemplateDataKeys: {Keys}",
                        user.Email,
                        string.Join(", ", templateData.Keys)
                    );
                    await _notificationService.SendEmailNotificationAsync(
                        "UserRegistered",
                        "user-registered",
                        user.UserId,
                        user.Email,
                        templateData
                    );
                    _logger.LogInformation(
                        "SendEmailNotificationAsync completed for 'user-registered'. Email: {Email}",
                        user.Email
                    );
                }

                return new RegisterRes
                {
                    Success = true,
                    Message = "Account created successfully",
                    User = MapToDTO(user),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration failed for email {Email}", request.Email);
                throw;
            }
        }

        // Functionality to allow user to login
        public async Task<LoginRes> LoginAsync(LoginReq request)
        {
            try
            {
                if (
                    string.IsNullOrWhiteSpace(request.Email)
                    || string.IsNullOrWhiteSpace(request.Password)
                )
                {
                    return new LoginRes
                    {
                        Success = false,
                        Message = "Email and password are required",
                    };
                }
                // verify that email exists
                var user = await _userRepository.GetByEmailIncludeInactiveAsync(request.Email);
                if (user == null)
                {
                    _logger.LogWarning("Login failed: user not found {Email}", request.Email);
                    return new LoginRes { Success = false, Message = "Invalid email or password" };
                }
                // Check whether the user has already tried to login for 5 times with wrong pass. If yes, then throw error else continue
                if (await _userRepository.IsAccountLockedAsync(user.UserId))
                {
                    _logger.LogWarning("Login blocked: account locked {Email}", request.Email);
                    return new LoginRes
                    {
                        Success = false,
                        Message = "Account is locked. Please try again later",
                    };
                }
                // Check for the active status of the user
                if (!user.IsActive)
                {
                    _logger.LogWarning("Login blocked: inactive account {Email}", request.Email);
                    return new LoginRes { Success = false, Message = "User account is inactive" };
                }
                // Check for passowrd, is the password entered by the user matches with the password present in the db by using VerifyPassword
                if (
                    !_passwordService.VerifyPassword(
                        request.Password,
                        user.PasswordHash,
                        user.PasswordSalt
                    )
                )
                {
                    await _userRepository.IncrementFailedLoginAttemptsAsync(user.UserId);
                    _logger.LogWarning("Login failed: invalid password {Email}", request.Email);

                    return new LoginRes { Success = false, Message = "Invalid email or password" };
                }
                // If everything is correct, reset the login attempts, so that it does not continue to stay on that point next time
                await _userRepository.ResetFailedLoginAttemptsAsync(user.UserId);
                // Generate tokens
                var accessToken = _jwtTokenProvider.GenerateAccessToken(user);
                var expiryMinutes = _jwtTokenProvider.GetAccessTokenExpiryMinutes();

                _logger.LogInformation("User logged in successfully: {Email}", request.Email);

                return new LoginRes
                {
                    Success = true,
                    Message = "Login successful",
                    AccessToken = accessToken,
                    User = MapToDTO(user),
                    ExpiresIn = expiryMinutes,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login failed for email {Email}", request.Email);
                throw;
            }
        }

        // Get the details of the user who is currently logged in from userId
        public async Task<ApiResponse<UserDTO>> GetCurrentUserAsync(Guid userId)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Current user not found {UserId}", userId);
                    return new ApiResponse<UserDTO>
                    {
                        Success = false,
                        Message = "User not found",
                        StatusCode = 404,
                    };
                }

                return new ApiResponse<UserDTO>
                {
                    Success = true,
                    Message = "Current user retrieved successfully",
                    Data = MapToDTO(user),
                    StatusCode = 200,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Maps a User to UserDTO using AutoMapper.
        /// This is used to expose only relevant userData.
        /// </summary>
        private UserDTO MapToDTO(User user)
        {
            return _mapper.Map<UserDTO>(user);
        }
    }
}
