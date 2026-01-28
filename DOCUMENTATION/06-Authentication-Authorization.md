# Authentication & Authorization - Overview

## Table of Contents
1. [Overview](#overview)
2. [JWT Tokens](#jwt-tokens)
3. [Password Security](#password-security)
4. [Role-Based Permissions](#role-based-permissions)

---

## Overview

Authentication = **Who are you?** (Login)
Authorization = **What can you do?** (Permissions)

---

## JWT Tokens

### What is a JWT?

A JWT (JSON Web Token) is a **stateless** authentication token containing user information.

**Structure**: `header.payload.signature`

**Example**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OCIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJBZG1pbiIsImV4cCI6MTcwNjI0ODAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**See**: [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md) for detailed explanation

---

### Token Generation

```csharp
var token = _jwtTokenProvider.GenerateAccessToken(user);
```

**What**: Creates JWT with user claims
**Contains**: userId, email, role, organizationId, expiration

---

### Token Validation

```csharp
// In middleware (automatic)
UseAuthentication()  // Validates token, sets HttpContext.User
```

**What**: Validates token signature, expiration, issuer, audience
**Result**: Sets `HttpContext.User` with claims if valid

---

## Password Security

### Hashing (Not Encryption!)

**Important**: Passwords are **hashed**, not encrypted!

**Difference**:
- **Hashing**: One-way (cannot reverse)
- **Encryption**: Two-way (can decrypt)

**Why Hashing?**:
- Even if database breached, passwords can't be recovered
- Only way to verify: hash input and compare

---

### PBKDF2 Algorithm

```csharp
var (hash, salt) = _passwordService.HashPassword("MyPassword123");
```

**What**: Uses PBKDF2-SHA512 with 350,000 iterations
**Why**: Industry standard, secure, slow for attackers

**See**: [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md#password-hashing-deep-dive) for detailed explanation

---

### Password Verification

```csharp
bool isValid = _passwordService.VerifyPassword(
    inputPassword, 
    storedHash, 
    storedSalt
);
```

**What**: Hashes input password with stored salt, compares with stored hash
**Why**: Constant-time comparison prevents timing attacks

---

## Role-Based Permissions

### Roles

```csharp
public enum UserRole
{
    Admin = 0,
    ProjectManager = 1,
    TeamLead = 2,
    TeamMember = 3
}
```

**What**: Defines user roles
**Why**: Different permissions for different roles

---

### Permission Checks

```csharp
public static bool CanManageProjects(this UserRole role)
{
    return role == UserRole.Admin || role == UserRole.ProjectManager;
}
```

**Usage**:
```csharp
if (!user.Role.CanManageProjects())
    return Forbid();
```

**What**: Checks if role has permission
**Why**: Centralized permission logic

---

## Authentication Flow

```
1. User sends: POST /api/auth/login
   Body: { "email": "...", "password": "..." }
   ↓
2. AuthService validates credentials
   ↓
3. If valid: Generate JWT token
   ↓
4. Return token to client
   ↓
5. Client stores token (localStorage)
   ↓
6. Client sends token in subsequent requests:
   Header: Authorization: Bearer <token>
   ↓
7. Middleware validates token
   ↓
8. Sets HttpContext.User with claims
   ↓
9. Controller can access user info
```

---

## Authorization Flow

```
1. Request arrives with JWT token
   ↓
2. UseAuthentication middleware validates token
   ↓
3. Sets HttpContext.User with claims
   ↓
4. UseAuthorization middleware checks [Authorize]
   ↓
5. Controller checks permissions:
   if (!user.Role.CanManageProjects())
       return Forbid();
   ↓
6. If authorized → Proceed
   If not → 403 Forbidden
```

---

## Key Takeaways

1. **JWT tokens** = Stateless authentication
2. **Passwords** = Hashed with PBKDF2-SHA512
3. **Roles** = Define permissions
4. **Middleware** = Validates tokens automatically

---

## Deep Dive

For detailed explanations of:
- What happens if JWT config is missing
- How JWT signing works (not encryption!)
- How password hashing works internally
- Complete authentication/authorization flow

**See**: [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md)

---

## Next Steps

Continue reading:
- [06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md) - Deep dive into security
- [07-Middleware.md](./07-Middleware.md) - Request pipeline
