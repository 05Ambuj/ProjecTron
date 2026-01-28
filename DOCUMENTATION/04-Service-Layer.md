# Service Layer - Business Logic

## Table of Contents
1. [Overview](#overview)
2. [Service Responsibilities](#service-responsibilities)
3. [Validation Patterns](#validation-patterns)
4. [Error Handling](#error-handling)
5. [AutoMapper Usage](#automapper-usage)

---

## Overview

Services contain **business logic** - the "what" and "why" of operations. They:
- Validate business rules
- Coordinate between repositories
- Transform data (using AutoMapper)
- Handle business-level errors

---

## Service Responsibilities

### 1. Business Validation

```csharp
public async Task<ApiResponse<ProjectDTO>> CreateAsync(Guid userId, ProjectCreateRequest request)
{
    // Validate user exists
    var admin = await _userRepository.GetByIdAsync(userId);
    if (admin == null)
        return new ApiResponse<ProjectDTO> { Success = false, Message = "User not found" };

    // Validate role
    if (admin.Role != UserRole.Admin)
        return new ApiResponse<ProjectDTO> { Success = false, Message = "Only Admin can create projects" };

    // Validate organization
    if (admin.OrganizationId == Guid.Empty)
        return new ApiResponse<ProjectDTO> { Success = false, Message = "User not associated with organization" };

    // Validate project manager
    var projectManager = await _userRepository.GetByIdAsync(request.ProjectManagerId);
    if (projectManager == null)
        return new ApiResponse<ProjectDTO> { Success = false, Message = "Project Manager not found" };

    if (projectManager.OrganizationId != admin.OrganizationId)
        return new ApiResponse<ProjectDTO> { Success = false, Message = "PM must belong to same organization" };

    // ... create project
}
```

**What**: Validates business rules before operations
**Why**: Ensures data integrity and business constraints

---

### 2. Orchestration

```csharp
// 1. Get project
var project = await _projectRepository.GetByIdAsync(projectId);

// 2. Validate
if (project == null) return NotFound();

// 3. Update properties
project.Name = request.Name;
project.Description = request.Description;

// 4. Save changes
await _projectRepository.UpdateAsync(project);

// 5. Send notification
await _notificationService.SendEmailNotificationAsync(...);

// 6. Map to DTO
var dto = _mapper.Map<ProjectDTO>(project);
```

**What**: Coordinates multiple operations
**Why**: Ensures operations happen in correct order

---

### 3. Data Transformation

```csharp
// Map from DTO to Entity
var project = _mapper.Map<Project>(request);

// Map from Entity to DTO
var dto = _mapper.Map<ProjectDTO>(project);
```

**What**: Converts between DTOs and Entities
**Why**: Separates API contracts from internal models

**See**: AutoMapper configuration in `Mapping/MappingProfile.cs`

---

## Validation Patterns

### Input Validation

```csharp
if (string.IsNullOrWhiteSpace(request.Name))
    return new ApiResponse<ProjectDTO> 
    { 
        Success = false, 
        Message = "Project name is required" 
    };
```

**What**: Checks required fields
**Why**: Prevents invalid data from entering system

---

### Business Rule Validation

```csharp
if (request.EndDate < request.StartDate)
    return new ApiResponse<ProjectDTO> 
    { 
        Success = false, 
        Message = "End date must be after start date" 
    };
```

**What**: Validates business logic
**Why**: Ensures data makes business sense

---

### Authorization Validation

```csharp
if (admin.Role != UserRole.Admin)
    return new ApiResponse<ProjectDTO> 
    { 
        Success = false, 
        Message = "Only Admin can create projects",
        StatusCode = 403 
    };
```

**What**: Checks permissions
**Why**: Enforces access control

---

## Error Handling

### Standardized Response Format

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T? Data { get; set; }
    public int StatusCode { get; set; }
}
```

**What**: Consistent error format
**Why**: Frontend can handle uniformly

---

### Error Response Examples

```csharp
// Success
return new ApiResponse<ProjectDTO>
{
    Success = true,
    Message = "Project created successfully",
    Data = dto,
    StatusCode = 200
};

// Error
return new ApiResponse<ProjectDTO>
{
    Success = false,
    Message = "Project Manager not found",
    StatusCode = 404
};
```

---

## AutoMapper Usage

### Mapping Configuration

```csharp
// In MappingProfile.cs
CreateMap<Project, ProjectDTO>()
    .ForMember(dest => dest.ProjectManagerName,
        opt => opt.MapFrom(src => src.ProjectManager != null 
            ? src.ProjectManager.DisplayName 
            : string.Empty));
```

**What**: Defines how to map between types
**Why**: Automatic conversion, less boilerplate

---

### Usage in Service

```csharp
// Entity → DTO
var dto = _mapper.Map<ProjectDTO>(project);

// DTO → Entity
var project = _mapper.Map<Project>(request);
```

**What**: Converts objects automatically
**Why**: Cleaner code than manual mapping

---

## Service vs Repository

| Service | Repository |
|---------|-----------|
| Business logic | Data access |
| Validations | Queries |
| Orchestration | CRUD operations |
| DTOs | Entities |

**Example**:
- **Repository**: `GetByIdAsync()` - Gets data from database
- **Service**: `CreateAsync()` - Validates, creates, sends notifications

---

## Key Takeaways

1. **Services contain business logic**
2. **Validate before operations**
3. **Use AutoMapper for transformations**
4. **Return standardized ApiResponse**
5. **Coordinate between repositories**

---

## Next Steps

Continue reading:
- [05-Controller-Layer.md](./05-Controller-Layer.md) - API endpoints
- [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md) - Security details
