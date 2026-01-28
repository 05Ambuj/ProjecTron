# Program.cs - Application Configuration

## Table of Contents
1. [Overview](#overview)
2. [Dependency Injection Setup](#dependency-injection-setup)
3. [Database Configuration](#database-configuration)
4. [JWT Authentication Configuration](#jwt-authentication-configuration)
5. [CORS Configuration](#cors-configuration)
6. [Middleware Pipeline](#middleware-pipeline)

---

## Overview

`Program.cs` is the entry point of the ASP.NET Core application. It configures:
- Dependency Injection (DI) container
- Database connection
- Authentication/Authorization
- Middleware pipeline
- Services registration

---

## Dependency Injection Setup

### Service Lifetime Explained

```csharp
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, TaskService>();
```

**Scoped Lifetime**:
- **What**: One instance per HTTP request
- **When Created**: At start of request
- **When Disposed**: At end of request
- **Why**: Most services need request-scoped DbContext

**Example Flow**:
```
Request 1:
  - Creates new ProjectService instance
  - Uses DbContext instance #1
  - Disposes both at end

Request 2:
  - Creates NEW ProjectService instance
  - Uses DbContext instance #2
  - Disposes both at end
```

**Other Lifetimes**:
- **Singleton**: One instance for entire application lifetime
- **Transient**: New instance every time injected

---

## Database Configuration

```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);
```

**What Happens**:
- Registers `ApplicationDbContext` as scoped service
- Configures SQL Server provider
- Reads connection string from `appsettings.json`

**Connection String** (appsettings.json):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;..."
  }
}
```

**Why Scoped**:
- Each HTTP request gets its own DbContext
- Ensures data isolation between requests
- Automatic transaction management per request

---

## JWT Authentication Configuration

```csharp
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");

if (jwtSecret.Length < 32)
    throw new InvalidOperationException("JWT Secret must be at least 32 characters long");

var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });
```

**What This Configures**:
- **Authentication Scheme**: JWT Bearer tokens
- **Validation**: How tokens are validated
- **Security**: Signing key, issuer, audience checks

**See**: [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md) for detailed explanation

---

## CORS Configuration

```csharp
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
             .AllowAnyHeader()
             .AllowAnyMethod()
             .AllowCredentials();
    });
});
```

**What CORS Does**:
- Allows frontend (React) to call backend API
- Browser security: Blocks cross-origin requests by default
- CORS tells browser: "This origin is allowed"

**Configuration**:
- **WithOrigins**: Which frontend URLs allowed
- **AllowAnyHeader**: Accept any HTTP headers
- **AllowAnyMethod**: Accept GET, POST, PUT, DELETE, etc.
- **AllowCredentials**: Allows cookies/auth headers

**Why Needed**:
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `https://localhost:7245`
- Different origins → CORS required

---

## Middleware Pipeline

```csharp
app.UseHttpsRedirection();                    // 1. Redirect HTTP → HTTPS
app.UseRouting();                             // 2. Enable routing
app.UseCors("AllowReactFrontend");           // 3. Apply CORS policy
app.UseSerilogRequestLogging(...);           // 4. Log requests
app.UseMiddleware<ExceptionHandlingMiddleware>(); // 5. Catch exceptions
app.UseAuthentication();                     // 6. Validate JWT tokens
app.UseAuthorization();                      // 7. Check permissions
app.MapControllers();                        // 8. Route to controllers
```

**Order Matters!**:
- Middleware executes in registration order
- Each middleware can modify request/response
- Last middleware (MapControllers) routes to controller

**See**: [07-Middleware.md](./07-Middleware.md) for detailed explanation

---

## JSON Serialization Configuration

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
```

**What This Does**:
- **CamelCase**: Converts PascalCase to camelCase
  - C#: `ProjectManagerId` → JSON: `projectManagerId`
- **Case Insensitive**: Accepts both cases
  - JSON: `projectManagerId` or `ProjectManagerId` both work

**Why Needed**:
- Frontend (JavaScript) uses camelCase
- Backend (C#) uses PascalCase
- This bridges the gap automatically

---

## Next Steps

Continue reading:
- [02-Data-Layer.md](./02-Data-Layer.md) - Database models and relationships
- [03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md) - How queries are processed
