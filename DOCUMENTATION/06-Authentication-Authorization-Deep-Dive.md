# Authentication & Authorization - Deep Dive

## Table of Contents
1. [Overview](#overview)
2. [JWT Token Structure](#jwt-token-structure)
3. [JWT Configuration - What Happens If Missing](#jwt-configuration---what-happens-if-missing)
4. [Encryption and Signing Explained](#encryption-and-signing-explained)
5. [Password Hashing Deep Dive](#password-hashing-deep-dive)
6. [Authentication Flow Step-by-Step](#authentication-flow-step-by-step)
7. [Authorization Flow Step-by-Step](#authorization-flow-step-by-step)

---

## Overview

This document provides **deep technical explanations** of how authentication and authorization work, including what happens when configuration is missing and how encryption/hashing actually works.

---

## JWT Token Structure

### What is a JWT Token?

A JWT (JSON Web Token) is a **compact, URL-safe** token format consisting of three parts separated by dots:

```
header.payload.signature
```

**Example**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OCIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJBZG1pbiIsImV4cCI6MTcwNjI0ODAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Token Parts Explained

#### 1. Header (Base64 Encoded)
```json
{
  "alg": "HS256",    // Algorithm: HMAC-SHA256
  "typ": "JWT"       // Type: JSON Web Token
}
```

**What**: Describes how token is signed
**Encoding**: Base64URL encoded
**Why**: Tells validator which algorithm to use

#### 2. Payload (Base64 Encoded)
```json
{
  "userId": "12345678-...",
  "email": "john@example.com",
  "role": "Admin",
  "organizationId": "org-123",
  "exp": 1706248000,  // Expiration timestamp
  "iat": 1706244400   // Issued at timestamp
}
```

**What**: Contains claims (user data)
**Encoding**: Base64URL encoded
**Why**: Stores user identity without database lookup

#### 3. Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

**What**: Cryptographic signature
**How**: HMAC-SHA256 hash of header+payload using secret key
**Why**: Prevents tampering - any change invalidates signature

---

## JWT Configuration - What Happens If Missing

### JwtTokenProvider Constructor Analysis

```csharp
public JwtTokenProvider(IConfiguration configuration)
{
    _jwtSecret = configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("JWT Secret not configured");
    
    if (_jwtSecret.Length < 32)
        throw new InvalidOperationException("JWT Secret must be at least 32 characters long");

    _jwtIssuer = configuration["Jwt:Issuer"];
    _jwtAudience = configuration["Jwt:Audience"];
    _jwtExpiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"] ?? "60");
}
```

### Scenario 1: Secret Missing

**What Happens**:
```csharp
_jwtSecret = configuration["Jwt:Secret"] ?? throw new InvalidOperationException(...);
```

**If Missing**:
- ❌ **Application fails to start**
- ❌ **Exception thrown immediately**
- ❌ **Server won't start**

**Why Fail-Fast?**:
- **Security**: Cannot run without secret (would be insecure)
- **Early Detection**: Better to fail at startup than runtime
- **Prevents Deployment**: Can't deploy insecure application

**Error Message**:
```
InvalidOperationException: JWT Secret not configured
```

**Fix**: Add to `appsettings.json`:
```json
{
  "Jwt": {
    "Secret": "your-secret-key-minimum-32-characters-long-for-security"
  }
}
```

---

### Scenario 2: Secret Too Short

**What Happens**:
```csharp
if (_jwtSecret.Length < 32)
    throw new InvalidOperationException("JWT Secret must be at least 32 characters long");
```

**If Less Than 32 Characters**:
- ❌ **Application fails to start**
- ❌ **Exception thrown**

**Why 32 Characters Minimum?**:
- **Cryptographic Strength**: 32 characters = 256 bits minimum
- **Brute Force Protection**: Longer secrets harder to guess
- **Industry Standard**: NIST recommends 256+ bits for symmetric keys

**Example**:
```json
"Secret": "short"  // ❌ Fails - only 5 characters
"Secret": "this-is-a-very-long-secret-key-with-32-chars"  // ✅ Works
```

**Security Impact**:
- Short secret = Weak encryption = Vulnerable to attacks
- Attackers could brute force weak secrets
- Tokens could be forged

---

### Scenario 3: ExpiryMinutes Missing

**What Happens**:
```csharp
_jwtExpiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"] ?? "60");
```

**If Missing**:
- ✅ **Application still starts**
- ✅ **Defaults to 60 minutes**
- ⚠️ **Uses default value**

**Why Default?**:
- **Non-Critical**: Application can run with default
- **Sensible Default**: 60 minutes is reasonable
- **Can Override**: Can set in config if needed

**Impact**:
- Tokens expire after 60 minutes
- Users need to re-login every hour
- Can be changed in config without code changes

**If You Remove This Line**:
```csharp
// If you remove: ?? "60"
_jwtExpiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"]);
```

**What Happens**:
- ❌ **Throws `ArgumentNullException`** if missing
- ❌ **Application fails to start**
- ❌ **No default fallback**

**Best Practice**: Always provide defaults for non-critical config

---

### Scenario 4: Issuer Missing

**What Happens**:
```csharp
_jwtIssuer = configuration["Jwt:Issuer"];
```

**If Missing**:
- ✅ **Application starts** (no validation)
- ⚠️ **`_jwtIssuer` = `null`**
- ❌ **Token validation will fail**

**Why?**:
```csharp
var validationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,        // ✅ Validation enabled
    ValidIssuer = _jwtIssuer,     // ❌ null if missing
};
```

**Result**:
- Token generation: ✅ Works (uses null)
- Token validation: ❌ **Fails** (expects issuer, gets null)

**Error**:
```
SecurityTokenInvalidIssuerException: IDX10205: Issuer validation failed
```

**Fix**: Always configure issuer:
```json
{
  "Jwt": {
    "Issuer": "Project_Allocation_System"
  }
}
```

---

### Scenario 5: Audience Missing

**What Happens**:
```csharp
_jwtAudience = configuration["Jwt:Audience"];
```

**If Missing**:
- ✅ **Application starts**
- ⚠️ **`_jwtAudience` = `null`**
- ❌ **Token validation will fail**

**Impact**: Same as missing issuer - validation fails

---

### Complete Configuration Impact Table

| Setting | Missing Behavior | Impact | Severity |
|---------|-----------------|--------|----------|
| `Jwt:Secret` | ❌ App won't start | Cannot generate/validate tokens | **CRITICAL** |
| `Jwt:Secret` < 32 chars | ❌ App won't start | Weak security | **CRITICAL** |
| `Jwt:Issuer` | ⚠️ App starts, validation fails | Tokens won't validate | **HIGH** |
| `Jwt:Audience` | ⚠️ App starts, validation fails | Tokens won't validate | **HIGH** |
| `Jwt:ExpiryMinutes` | ✅ Defaults to 60 | Works but uses default | **LOW** |

---

## Encryption and Signing Explained

### JWT Signing (Not Encryption!)

**Important**: JWTs are **signed**, not **encrypted**!

**Difference**:
- **Signing**: Proves token wasn't tampered with (can still read contents)
- **Encryption**: Hides contents (can't read without key)

**Why Signing, Not Encryption?**:
- **Performance**: Signing is faster
- **Stateless**: Server doesn't need to decrypt
- **Claims Visible**: Can read user info without database lookup

---

### How JWT Signing Works

#### Step 1: Create Signing Key

```csharp
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
```

**What Happens**:
1. `_jwtSecret` (string) → Convert to bytes using UTF-8
2. Bytes → Create `SymmetricSecurityKey` object
3. Key object used for signing

**Example**:
```
Secret: "my-secret-key-32-chars-long!!"
↓ UTF-8 Encoding
Bytes: [109, 121, 45, 115, 101, 99, 114, 101, 116, ...]
↓ Create Key
SymmetricSecurityKey object
```

**Why Symmetric?**:
- Same key used to sign AND verify
- Faster than asymmetric (RSA)
- Suitable for single-server applications

---

#### Step 2: Create Signing Credentials

```csharp
var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
```

**What Happens**:
- Specifies algorithm: **HMAC-SHA256**
- HMAC = Hash-based Message Authentication Code
- SHA256 = Secure Hash Algorithm (256 bits)

**Algorithm Details**:
- **HMAC**: Combines secret key with message
- **SHA256**: Cryptographic hash function
- **Result**: 256-bit (32-byte) signature

**Why HMAC-SHA256?**:
- Industry standard
- Fast and secure
- Supported everywhere
- Resistant to collision attacks

---

#### Step 3: Generate Signature

**Process**:
```
1. Encode Header (Base64URL)
   ↓
2. Encode Payload (Base64URL)
   ↓
3. Concatenate: header + "." + payload
   ↓
4. Apply HMAC-SHA256 with secret key
   ↓
5. Encode Signature (Base64URL)
   ↓
6. Final Token: header.payload.signature
```

**Code Equivalent**:
```csharp
// Pseudo-code (actual happens inside JwtSecurityTokenHandler)
string header = Base64UrlEncode(headerJson);
string payload = Base64UrlEncode(payloadJson);
string data = header + "." + payload;
byte[] signature = HMACSHA256(data, secretKey);
string signatureEncoded = Base64UrlEncode(signature);
string token = data + "." + signatureEncoded;
```

**Why Base64URL?**:
- **URL-Safe**: Can be used in URLs without encoding
- **Compact**: Smaller than hex encoding
- **Standard**: JWT specification requirement

---

### Token Validation Process

```csharp
public ClaimsPrincipal? GetPrincipalFromToken(string token)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(_jwtSecret);
    
    var validationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = _jwtIssuer,
        ValidateAudience = true,
        ValidAudience = _jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    return tokenHandler.ValidateToken(token, validationParameters, out _);
}
```

**Validation Steps**:

#### Step 1: Parse Token
```
Token: "header.payload.signature"
↓ Split by "."
header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
payload = "eyJ1c2VySWQiOiIxMjM0NTY3OCJ9"
signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

#### Step 2: Verify Signature
```csharp
// Recalculate signature
string data = header + "." + payload;
byte[] calculatedSignature = HMACSHA256(data, secretKey);

// Compare with token signature
if (calculatedSignature != tokenSignature)
    throw SecurityTokenInvalidSignatureException;  // ❌ Invalid token
```

**What This Checks**:
- Token wasn't tampered with
- Signature matches secret key
- Token came from our server

#### Step 3: Validate Issuer
```csharp
if (payload.issuer != _jwtIssuer)
    throw SecurityTokenInvalidIssuerException;  // ❌ Wrong issuer
```

**What This Checks**:
- Token issued by our system
- Prevents token reuse from other systems

#### Step 4: Validate Audience
```csharp
if (payload.audience != _jwtAudience)
    throw SecurityTokenInvalidAudienceException;  // ❌ Wrong audience
```

**What This Checks**:
- Token intended for our application
- Prevents token misuse

#### Step 5: Validate Lifetime
```csharp
if (DateTime.UtcNow > payload.expiration)
    throw SecurityTokenExpiredException;  // ❌ Token expired
```

**What This Checks**:
- Token hasn't expired
- `ClockSkew = TimeSpan.Zero` means no tolerance

**If ClockSkew Was Not Zero**:
```csharp
ClockSkew = TimeSpan.FromMinutes(5)  // 5 minute tolerance
```
- **What**: Allows 5 minutes of clock difference
- **Why**: Handles server clock drift
- **Security**: Less strict (expired tokens accepted for 5 min)
- **Our Choice**: Zero = Stricter security

---

## Password Hashing Deep Dive

### PBKDF2 Algorithm Explained

```csharp
public class PasswordService
{
    private const int KeySize = 64;        // 512 bits output
    private const int Iterations = 350000; // Number of hash rounds
    
    public (string PasswordHash, string PasswordSalt) HashPassword(string password)
    {
        // Step 1: Generate random salt
        byte[] salt = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        // Step 2: Hash password with PBKDF2
        using (var pbkdf2 = new Rfc2898DeriveBytes(
            password, 
            salt, 
            Iterations, 
            HashAlgorithmName.SHA512))
        {
            byte[] hash = pbkdf2.GetBytes(KeySize);
            return (
                Convert.ToBase64String(hash),
                Convert.ToBase64String(salt)
            );
        }
    }
}
```

### Step-by-Step: How Password Hashing Works

#### Step 1: Generate Salt

```csharp
byte[] salt = new byte[16];
rng.GetBytes(salt);
```

**What Happens**:
- Creates 16 random bytes (128 bits)
- Uses cryptographically secure random number generator
- **Different salt for each password**

**Example**:
```
Password: "MyPassword123"
Salt (random): [45, 123, 89, 12, 234, 67, ...]  // Different each time
```

**Why Salt?**:
- **Prevents Rainbow Table Attacks**: Same password → different hash
- **Prevents Dictionary Attacks**: Attackers can't pre-compute hashes
- **Uniqueness**: Each password gets unique salt

**Without Salt**:
```
Password: "password123"
Hash: "abc123..."  // Always same

// Attacker pre-computes:
"password123" → "abc123..."
"password456" → "def456..."
// Can quickly lookup any password
```

**With Salt**:
```
Password: "password123"
Salt: [random bytes]
Hash: "xyz789..."  // Different each time

// Attacker can't pre-compute - needs salt first
```

---

#### Step 2: PBKDF2 Hashing

```csharp
using (var pbkdf2 = new Rfc2898DeriveBytes(
    password,      // Input password
    salt,          // Random salt
    Iterations,    // 350,000 rounds
    HashAlgorithmName.SHA512))  // SHA-512 hash function
{
    byte[] hash = pbkdf2.GetBytes(KeySize);  // 64 bytes = 512 bits
}
```

**What PBKDF2 Does**:

**PBKDF2 = Password-Based Key Derivation Function 2**

**Process**:
```
1. Start: password + salt
   ↓
2. Hash Round 1: SHA512(password + salt + 1)
   ↓
3. Hash Round 2: SHA512(previous_hash + salt + 2)
   ↓
4. Hash Round 3: SHA512(previous_hash + salt + 3)
   ↓
   ... (repeats 350,000 times)
   ↓
5. Final Hash: 64 bytes (512 bits)
```

**Why 350,000 Iterations?**:
- **Slows Down Attacks**: Each hash takes ~100ms
- **Brute Force Protection**: Attacker needs 350,000x more time
- **Balance**: Secure but not too slow for legitimate users

**Performance**:
- **Legitimate Login**: ~100ms (acceptable)
- **Brute Force Attack**: 350,000 × 100ms = 35,000 seconds per password (9.7 hours!)

**If You Reduce Iterations**:
```csharp
private const int Iterations = 1000;  // Reduced from 350,000
```

**Impact**:
- ⚠️ **Faster hashing** (~0.3ms instead of 100ms)
- ❌ **Less secure** (easier to brute force)
- ❌ **Attackers 350x faster**

**If You Increase Iterations**:
```csharp
private const int Iterations = 1000000;  // Increased
```

**Impact**:
- ✅ **More secure** (harder to brute force)
- ⚠️ **Slower** (~300ms per hash)
- ⚠️ **Worse UX** (slower login)

---

#### Step 3: SHA-512 Hash Function

**What is SHA-512?**:
- **SHA** = Secure Hash Algorithm
- **512** = Output size (512 bits = 64 bytes)
- **One-Way Function**: Cannot reverse hash to get password

**Properties**:
- **Deterministic**: Same input → same output
- **Avalanche Effect**: Small input change → completely different output
- **Collision Resistant**: Hard to find two inputs with same hash

**Example**:
```
Input: "password123"
SHA512: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f..."

Input: "password124"  // Changed 1 character
SHA512: "a3f5d8e9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0..."  // Completely different!
```

---

#### Step 4: Store Hash and Salt

```csharp
return (
    Convert.ToBase64String(hash),   // "xyz789abc..."
    Convert.ToBase64String(salt)    // "dGVzdHNhbHQ="
);
```

**What**: Converts bytes to Base64 strings

**Why Base64?**:
- **Database Storage**: Strings easier than binary
- **URL-Safe**: Can be transmitted easily
- **Readable**: Can inspect in database

**Database Storage**:
```sql
Users Table:
UserId | Email | PasswordHash | PasswordSalt
-------|-------|--------------|-------------
123    | john@ | xyz789abc... | dGVzdHNhbHQ=
```

**Security**: Even if database is breached:
- ✅ Passwords are hashed (can't reverse)
- ✅ Each has unique salt (can't use rainbow tables)
- ✅ High iteration count (slow to brute force)

---

### Password Verification Process

```csharp
public bool VerifyPassword(string password, string passwordHash, string passwordSalt)
{
    // Step 1: Decode salt from Base64
    byte[] salt = Convert.FromBase64String(passwordSalt);
    
    // Step 2: Hash input password with stored salt
    using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA512))
    {
        byte[] hash = pbkdf2.GetBytes(KeySize);
        byte[] storedHash = Convert.FromBase64String(passwordHash);
        
        // Step 3: Constant-time comparison
        return CryptographicOperations.FixedTimeEquals(hash, storedHash);
    }
}
```

**Step-by-Step**:

1. **Decode Salt**: Convert Base64 string back to bytes
2. **Hash Input**: Hash provided password with stored salt (same process)
3. **Compare**: Compare calculated hash with stored hash

**Why Constant-Time Comparison?**:
```csharp
// ❌ BAD: Timing attack vulnerable
if (calculatedHash == storedHash) return true;

// ✅ GOOD: Constant-time (always takes same time)
return CryptographicOperations.FixedTimeEquals(calculatedHash, storedHash);
```

**Timing Attack**:
- **Problem**: String comparison stops at first difference
- **Attack**: Measure response time to guess password character by character
- **Solution**: `FixedTimeEquals` always takes same time regardless of match

**Example**:
```
Password: "password123"
Stored:   "password456"

// Bad comparison:
"password123" == "password456"
  ↓
Compares: p==p (match), a==a (match), s==s (match), ... 3==6 (different, stops)
  ↓
Takes less time than full match → reveals position of first difference

// Good comparison:
FixedTimeEquals always compares all bytes, takes same time
```

---

## Authentication Flow Step-by-Step

### Complete Login Process

```
1. User sends: POST /api/auth/login
   Body: { "email": "john@example.com", "password": "MyPassword123" }
   ↓
2. AuthController.Login receives request
   ↓
3. AuthService.LoginAsync called
   ↓
4. Get user from database by email
   ↓
5. Verify password:
   - Hash input password with stored salt
   - Compare with stored hash
   ↓
6. If password correct:
   - Generate JWT token (JwtTokenProvider.GenerateAccessToken)
   - Return token to client
   ↓
7. Client stores token (localStorage)
   ↓
8. Client sends token in subsequent requests:
   Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
9. Middleware (UseAuthentication) validates token
   - Extracts claims
   - Sets HttpContext.User
   ↓
10. Controller uses User.GetUserId() to get user info
```

---

## Authorization Flow Step-by-Step

### Role-Based Authorization

```
1. Request arrives with JWT token
   ↓
2. UseAuthentication middleware:
   - Validates token signature
   - Extracts claims (role, userId, etc.)
   - Sets HttpContext.User with ClaimsPrincipal
   ↓
3. UseAuthorization middleware:
   - Checks [Authorize] attributes
   - Validates role/permissions
   ↓
4. Controller action:
   [Authorize(Roles = "Admin,ProjectManager")]
   ↓
5. If user role matches → ✅ Proceed
   If user role doesn't match → ❌ 403 Forbid
```

### Permission-Based Authorization

```
1. Controller extracts user:
   var user = await _userRepository.GetByIdAsync(userId);
   ↓
2. Check permission:
   if (!user.Role.CanManageProjects())
       return Forbid();
   ↓
3. Extension method checks:
   public static bool CanManageProjects(this UserRole role)
   {
       return role == UserRole.Admin || role == UserRole.ProjectManager;
   }
   ↓
4. If true → ✅ Proceed
   If false → ❌ 403 Forbid
```

---

## Security Considerations

### What Happens If Secret is Compromised?

**Scenario**: Attacker gets JWT secret

**Impact**:
- ❌ **Can forge tokens**: Create valid tokens for any user
- ❌ **Can impersonate users**: Access any account
- ❌ **Complete system compromise**

**Mitigation**:
- **Rotate Secret**: Change secret, invalidate all tokens
- **Short Expiry**: Tokens expire quickly (limits damage)
- **Monitor**: Detect unusual token generation patterns

---

### What Happens If Token Expires?

**Scenario**: User's token expires (after 60 minutes)

**What Happens**:
1. User makes request with expired token
2. `UseAuthentication` middleware validates token
3. `ValidateLifetime = true` checks expiration
4. Token expired → ❌ **401 Unauthorized**

**User Experience**:
- Frontend receives 401
- Redirects to login page
- User logs in again
- Gets new token

**Why Expiration?**:
- **Limits Damage**: Stolen token only valid for 60 minutes
- **Forces Re-authentication**: Ensures user still authorized
- **Security Best Practice**: No infinite sessions

---

## Next Steps

Continue reading:
- [03-Repository-Layer.md](./03-Repository-Layer.md) - How repositories process queries and translate LINQ to SQL
