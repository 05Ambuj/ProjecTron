# Backend Architecture Overview

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Design Patterns](#design-patterns)

---

## Architecture Overview

The Project Allocation System backend follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Controllers Layer               │  ← API Endpoints (HTTP)
│    (HTTP Request/Response Handling)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Services Layer                 │  ← Business Logic
│    (Validation, Business Rules)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Repositories Layer               │  ← Data Access
│    (Database Operations, EF Core)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Data Layer                     │  ← Entity Framework Core
│    (DbContext, Models, Migrations)      │
└─────────────────────────────────────────┘
```

### Request Flow

1. **HTTP Request** → Controller receives request
2. **Authentication** → JWT token validated
3. **Authorization** → Role-based permissions checked
4. **Controller** → Extracts user info, validates input
5. **Service** → Business logic, validations, orchestrations
6. **Repository** → Database queries using EF Core
7. **Response** → DTOs mapped and returned

---

## Technology Stack

### Core Framework
- **.NET 8.0** - Latest LTS version
- **ASP.NET Core Web API** - RESTful API framework
- **Entity Framework Core 9.0** - ORM for database operations
- **SQL Server** - Relational database

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **BCrypt.Net** - Password hashing
- **PBKDF2-SHA512** - Password derivation function

### Additional Libraries
- **AutoMapper** - Object-to-object mapping (Models ↔ DTOs)
- **Serilog** - Structured logging
- **Swagger/OpenAPI** - API documentation
- **Azure Service Bus** - Asynchronous email notifications

---

## Project Structure

```
Project_Allocation_System/
├── Auth/                          # Authentication & Authorization
│   ├── JwtTokenProvider.cs       # JWT token generation/validation
│   └── ClaimsPrincipalExtensions.cs  # Helper methods for claims
│
├── Constants/                     # Application constants
│   └── RolePermissions.cs        # Role-based permission definitions
│
├── Controllers/                   # API Controllers (HTTP endpoints)
│   ├── AuthController.cs         # Login, registration
│   ├── ProjectController.cs      # Project CRUD
│   ├── TaskController.cs         # Task operations
│   └── ...
│
├── Data/                          # Database context
│   └── AppDBContext.cs           # EF Core DbContext
│
├── DTOs/                          # Data Transfer Objects
│   ├── ApiResponse.cs            # Standard API response wrapper
│   ├── ProjectDTOs.cs            # Project-related DTOs
│   ├── TaskDTOs.cs               # Task-related DTOs
│   └── ...
│
├── Interfaces/                    # Contracts (abstractions)
│   ├── IProjectService.cs        # Project service interface
│   ├── IProjectRepository.cs     # Project repository interface
│   └── ...
│
├── Mapping/                       # AutoMapper configurations
│   ├── MappingProfile.cs          # Main mapping configuration
│   └── TaskMappingExtensions.cs  # Task-specific mappings
│
├── Middlewares/                   # Custom middleware
│   └── ExceptionHandlingMiddleware.cs  # Global exception handler
│
├── Models/                        # Domain entities
│   ├── User.cs                    # User entity
│   ├── Project.cs                 # Project entity
│   ├── WorkTask.cs                # Task entity
│   └── ...
│
├── Repo/                          # Repository implementations
│   ├── ProjectRepository.cs      # Project data access
│   ├── TaskRepository.cs         # Task data access
│   └── ...
│
├── Services/                      # Business logic services
│   ├── ProjectService.cs         # Project business logic
│   ├── TaskService.cs             # Task business logic
│   ├── AuthService.cs             # Authentication logic
│   └── ...
│
└── Program.cs                     # Application entry point & configuration
```

---

## Design Patterns

### 1. Repository Pattern
**Purpose**: Abstracts data access logic from business logic

**Why**: 
- Separates concerns
- Makes testing easier (can mock repositories)
- Allows switching data sources without changing business logic

**Implementation**:
- `IProjectRepository` interface defines contract
- `ProjectRepository` implements data access using EF Core
- Service layer depends on interface, not implementation

### 2. Dependency Injection (DI)
**Purpose**: Loose coupling between components

**Why**:
- Makes code testable
- Allows easy swapping of implementations
- Reduces dependencies between classes

**Implementation**:
- All services/repositories registered in `Program.cs`
- Constructor injection used throughout
- Scoped lifetime for most services (one per HTTP request)

### 3. DTO Pattern (Data Transfer Objects)
**Purpose**: Separate internal models from API contracts

**Why**:
- Prevents exposing internal structure
- Allows versioning API independently
- Can include computed/aggregated fields
- Reduces over-fetching data

**Implementation**:
- `Project` (Model) vs `ProjectDTO` (DTO)
- AutoMapper converts between them
- DTOs only contain what API needs

### 4. Service Layer Pattern
**Purpose**: Encapsulates business logic

**Why**:
- Controllers stay thin (only HTTP concerns)
- Business logic reusable across controllers
- Easier to test business rules

**Implementation**:
- `ProjectService` contains all project business logic
- Controllers delegate to services
- Services coordinate between repositories

### 5. Unit of Work Pattern (Implicit)
**Purpose**: Ensures data consistency

**Why**:
- `DbContext` acts as Unit of Work
- All changes in one request are atomic
- Automatic transaction management

**Implementation**:
- Each HTTP request gets one `DbContext` instance (scoped)
- All repositories share same context
- `SaveChangesAsync()` commits all changes

---

## Next Steps

Continue reading:
- [01-Program-Configuration.md](./01-Program-Configuration.md) - Application startup and configuration
- [02-Data-Layer.md](./02-Data-Layer.md) - Models and database configuration
- [03-Repository-Layer.md](./03-Repository-Layer.md) - Data access patterns and Include/ThenInclude
