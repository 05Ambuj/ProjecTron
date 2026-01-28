# Data Layer - Models and Database Configuration

## Table of Contents
1. [Overview](#overview)
2. [DbContext Explained](#dbcontext-explained)
3. [Entity Relationships](#entity-relationships)
4. [Delete Behaviors](#delete-behaviors)
5. [Enum Conversions](#enum-conversions)

---

## Overview

The Data Layer consists of:
- **Models**: C# classes representing database tables
- **DbContext**: Database connection and configuration
- **Migrations**: Database schema changes

---

## DbContext Explained

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<Project> Projects { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<WorkTask> WorkTasks { get; set; }
    // ... other DbSets
}
```

**What is DbSet?**:
- Represents a database table
- Provides LINQ query interface
- Used by repositories to query data

**Example**:
```csharp
_context.Projects  // DbSet<Project> - represents Projects table
    .Where(p => p.Status == ProjectStatus.Active)
    .ToListAsync();
```

---

## Entity Relationships

### One-to-Many Relationships

**Project → Tasks**:
```csharp
public class Project
{
    public Guid ProjectId { get; set; }
    public List<WorkTask> Tasks { get; set; }  // Navigation property
}

public class WorkTask
{
    public Guid TaskId { get; set; }
    public Guid ProjectId { get; set; }        // Foreign key
    public Project Project { get; set; }       // Navigation property
}
```

**Configuration**:
```csharp
modelBuilder.Entity<WorkTask>(entity =>
{
    entity.HasOne(t => t.Project)
          .WithMany(p => p.Tasks)
          .HasForeignKey(t => t.ProjectId)
          .OnDelete(DeleteBehavior.Restrict);
});
```

**What This Means**:
- One Project can have many Tasks
- Each Task belongs to one Project
- Foreign key: `ProjectId` in `WorkTasks` table

---

### Many-to-Many Relationships

**Project ↔ Users (via ProjectAllocation)**:
```csharp
public class ProjectAllocation
{
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public Project Project { get; set; }
    public User User { get; set; }
}
```

**What**: Junction table connecting Projects and Users
**Why**: Tracks which users are allocated to which projects

---

## Delete Behaviors

### Restrict (Prevent Delete)

```csharp
.OnDelete(DeleteBehavior.Restrict)
```

**What**: Prevents deletion if related records exist

**Example**:
```csharp
// Project has Tasks
Project project = ...;
_context.Projects.Remove(project);  // ❌ Throws exception if Tasks exist
```

**Why**: Prevents orphaned records
- Can't delete Project if it has Tasks
- Must delete Tasks first

---

### Cascade (Auto Delete)

```csharp
.OnDelete(DeleteBehavior.Cascade)
```

**What**: Automatically deletes related records

**Example**:
```csharp
// Task has Comments
WorkTask task = ...;
_context.WorkTasks.Remove(task);  // ✅ Also deletes all Comments
```

**Why**: Clean up related data automatically
- Deleting Task also deletes its Comments
- No orphaned Comments

---

## Enum Conversions

```csharp
entity.Property(e => e.Role).HasConversion<int>();
```

**What**: Stores enum as integer in database

**Example**:
```csharp
public enum UserRole
{
    Admin = 0,
    ProjectManager = 1,
    TeamLead = 2,
    TeamMember = 3
}
```

**Database Storage**:
- C#: `UserRole.Admin`
- Database: `0` (integer)

**Why**:
- Efficient storage (int vs string)
- Easy to query
- Type-safe in C#

---

## Next Steps

Continue reading:
- [03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md) - How Include/ThenInclude works and queries are processed
