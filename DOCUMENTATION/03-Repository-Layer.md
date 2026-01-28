# Repository Layer - Basic Patterns

## Table of Contents
1. [Overview](#overview)
2. [Repository Pattern](#repository-pattern)
3. [Include() Basics](#include-basics)
4. [ThenInclude() Basics](#theninclude-basics)
5. [Common Patterns](#common-patterns)

---

## Overview

Repositories abstract data access logic. They:
- Encapsulate database queries
- Use Entity Framework Core
- Provide clean interface to services

---

## Repository Pattern

### Interface (Contract)

```csharp
public interface IProjectRepository
{
    Task<Project?> GetByIdAsync(Guid projectId);
    Task<List<Project>> GetAllAsync();
    Task CreateAsync(Project project);
    Task UpdateAsync(Project project);
}
```

**What**: Defines what operations are available
**Why**: Allows mocking in tests, loose coupling

---

### Implementation

```csharp
public class ProjectRepository : IProjectRepository
{
    private readonly ApplicationDbContext _context;

    public ProjectRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Project?> GetByIdAsync(Guid projectId)
    {
        return await _context.Projects
            .Include(p => p.ProjectManager)
            .FirstOrDefaultAsync(p => p.ProjectId == projectId);
    }
}
```

**What**: Implements data access using EF Core
**Why**: Separates data access from business logic

---

## Include() Basics

### What Include() Does

```csharp
var project = await _context.Projects
    .Include(p => p.ProjectManager)  // ✅ Loads ProjectManager
    .FirstOrDefaultAsync(p => p.ProjectId == id);
```

**Without Include()**:
- `project.ProjectManager` = `null` ❌

**With Include()**:
- `project.ProjectManager` = `User` object ✅

**How**: EF Core translates to SQL JOIN
- See [03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md) for details

---

### Multiple Includes

```csharp
var project = await _context.Projects
    .Include(p => p.ProjectManager)   // Load manager
    .Include(p => p.Organization)      // Load organization
    .FirstOrDefaultAsync(p => p.ProjectId == id);
```

**Result**: Both navigation properties populated ✅

---

## ThenInclude() Basics

### Nested Navigation Properties

```csharp
var task = await _context.WorkTasks
    .Include(t => t.Project)                    // Level 1: Load Project
        .ThenInclude(p => p.ProjectManager)     // Level 2: Load Project's Manager
    .FirstOrDefaultAsync(t => t.TaskId == id);
```

**What**: Loads nested relationships
- `task.Project` ✅
- `task.Project.ProjectManager` ✅

**Without ThenInclude()**:
- `task.Project` ✅
- `task.Project.ProjectManager` = `null` ❌

---

### Multiple ThenInclude() Chains

```csharp
var task = await _context.WorkTasks
    .Include(t => t.AssignedToUser)              // Level 1
        .ThenInclude(u => u.Organization)        // Level 2
    .Include(t => t.Project)                     // Level 1
        .ThenInclude(p => p.ProjectManager)      // Level 2
    .FirstOrDefaultAsync(t => t.TaskId == id);
```

**Result**: All nested properties loaded ✅

---

## Common Patterns

### Filtering with Include

```csharp
var projects = await _context.Projects
    .Include(p => p.ProjectManager)
    .Where(p => p.Status == ProjectStatus.Active)
    .ToListAsync();
```

**What**: Filters projects AND includes manager
**SQL**: Single query with JOIN and WHERE

---

### AsNoTracking() for Read-Only

```csharp
var projects = await _context.Projects
    .AsNoTracking()  // ✅ Faster, read-only
    .Include(p => p.ProjectManager)
    .ToListAsync();
```

**When**: GET requests (read-only operations)
**Why**: 10-20% faster, less memory

**See**: [03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md#asnotracking-explained) for details

---

### Pagination

```csharp
var projects = await _context.Projects
    .Include(p => p.ProjectManager)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

**What**: Gets specific page of results
**SQL**: Uses `OFFSET` and `FETCH NEXT`

---

## Key Takeaways

1. **Include()**: Loads single navigation property
2. **ThenInclude()**: Loads nested navigation property
3. **AsNoTracking()**: Use for read-only queries
4. **Repository Pattern**: Abstracts data access

---

## Deep Dive

For detailed explanations of:
- How EF Core translates LINQ to SQL
- How Include() becomes JOINs
- How ThenInclude() processes nested relationships
- Query execution lifecycle

**See**: [03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md)

---

## Next Steps

Continue reading:
- [04-Service-Layer.md](./04-Service-Layer.md) - Business logic
- [03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md) - Deep dive into query processing
