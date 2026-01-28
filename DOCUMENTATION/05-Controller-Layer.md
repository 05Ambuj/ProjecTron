# Controller Layer - API Endpoints

## Table of Contents
1. [Overview](#overview)
2. [Controller Structure](#controller-structure)
3. [Authorization Patterns](#authorization-patterns)
4. [Request/Response Handling](#requestresponse-handling)
5. [User Context Extraction](#user-context-extraction)

---

## Overview

Controllers handle **HTTP requests** and **responses**. They:
- Receive HTTP requests
- Extract user information from JWT token
- Call services for business logic
- Return HTTP responses

---

## Controller Structure

### Basic Controller

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IUserRepository _userRepository;

    public ProjectsController(
        IProjectService projectService,
        IUserRepository userRepository
    )
    {
        _projectService = projectService;
        _userRepository = userRepository;
    }
}
```

**Attributes**:
- `[ApiController]`: Enables API-specific features
- `[Route("api/[controller]")]`: Sets base route (`/api/projects`)
- `[Authorize]`: Requires authentication

---

## Authorization Patterns

### Role-Based Authorization

```csharp
[Authorize(Roles = "Admin,ProjectManager")]
[HttpPost]
public async Task<IActionResult> CreateProject([FromBody] ProjectCreateRequest request)
{
    // Only Admin or ProjectManager can access
}
```

**What**: Restricts access by role
**Why**: Enforces permissions at controller level

---

### Permission-Based Authorization

```csharp
[HttpPost]
public async Task<IActionResult> CreateProject([FromBody] ProjectCreateRequest request)
{
    var userId = User.GetUserId();
    var user = await _userRepository.GetByIdAsync(userId);
    
    if (!user.Role.CanManageProjects())
        return Forbid();  // 403 Forbidden
    
    // ... proceed
}
```

**What**: Checks custom permissions
**Why**: More flexible than role-based

---

## Request/Response Handling

### POST Request

```csharp
[HttpPost]
public async Task<IActionResult> CreateProject([FromBody] ProjectCreateRequest request)
{
    var userId = User.GetUserId();
    var response = await _projectService.CreateAsync(userId, request);
    
    if (response.Success)
        return Ok(response);  // 200 OK
    else
        return StatusCode(response.StatusCode, response);  // 400/404/etc
}
```

**What**: Handles POST requests
**Flow**:
1. Extract user ID from JWT
2. Call service
3. Return appropriate HTTP status

---

### GET Request

```csharp
[HttpGet("{projectId}")]
public async Task<IActionResult> GetProject(Guid projectId)
{
    var userId = User.GetUserId();
    var response = await _projectService.GetByIdAsync(projectId, userId);
    
    if (!response.Success)
        return NotFound(response);  // 404 Not Found
    
    return Ok(response);  // 200 OK
}
```

**What**: Handles GET requests
**Route Parameter**: `{projectId}` from URL

---

### PUT Request

```csharp
[HttpPut("{projectId}")]
public async Task<IActionResult> UpdateProject(
    Guid projectId, 
    [FromBody] ProjectUpdateRequest request
)
{
    var userId = User.GetUserId();
    var response = await _projectService.UpdateAsync(projectId, request, userId);
    
    return response.Success ? Ok(response) : StatusCode(response.StatusCode, response);
}
```

**What**: Handles PUT requests (updates)

---

## User Context Extraction

### From JWT Token

```csharp
var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
if (!Guid.TryParse(userIdClaim?.Value, out var userId))
    return Unauthorized();

var user = await _userRepository.GetByIdAsync(userId);
if (user == null)
    return Unauthorized();
```

**What**: Extracts user ID from JWT claims
**How**: `User` is set by `UseAuthentication` middleware

**See**: [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md) for details

---

### Helper Extension Method

```csharp
public static Guid? GetUserId(this ClaimsPrincipal user)
{
    var claim = user.FindFirst(ClaimTypes.NameIdentifier);
    return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
}
```

**Usage**:
```csharp
var userId = User.GetUserId();  // Cleaner!
```

---

## HTTP Status Codes

| Status | Meaning | When to Use |
|--------|---------|-------------|
| 200 OK | Success | GET, PUT successful |
| 201 Created | Created | POST successful |
| 400 Bad Request | Invalid input | Validation failed |
| 401 Unauthorized | Not authenticated | No/invalid token |
| 403 Forbidden | Not authorized | No permission |
| 404 Not Found | Resource not found | Entity doesn't exist |
| 500 Internal Server Error | Server error | Exception occurred |

---

## Audit Logging

```csharp
if (response.Success && response.Data != null)
{
    await _auditLogService.LogAsync(
        entityType: "Project",
        entityId: response.Data.ProjectId,
        action: "Created",
        userId: userId,
        userEmail: user.Email,
        description: $"Project '{request.Name}' created",
        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
    );
}
```

**What**: Logs important actions
**Why**: Track who did what, when

---

## Key Takeaways

1. **Controllers handle HTTP**
2. **Extract user from JWT**
3. **Call services for logic**
4. **Return appropriate status codes**
5. **Log important actions**

---

## Next Steps

Continue reading:
- [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md) - How JWT tokens work
- [07-Middleware.md](./07-Middleware.md) - Request pipeline
