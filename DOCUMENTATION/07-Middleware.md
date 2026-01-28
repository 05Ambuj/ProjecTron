# Middleware - Request Pipeline

## Table of Contents
1. [Overview](#overview)
2. [Middleware Pipeline Order](#middleware-pipeline-order)
3. [ExceptionHandlingMiddleware Explained](#exceptionhandlingmiddleware-explained)
4. [Request Flow](#request-flow)

---

## Overview

Middleware components process HTTP requests and responses. They form a pipeline that requests flow through.

**Order Matters**: Middleware executes in the order it's registered

---

## Middleware Pipeline Order

### From Program.cs

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

**Why This Order?**:

1. **HttpsRedirection First**
   - Redirects before processing
   - Security - ensures HTTPS

2. **Routing Before CORS**
   - CORS needs routing info
   - Preflight requests need route matching

3. **CORS Before Authentication**
   - CORS preflight (OPTIONS) happens before auth
   - Browser sends preflight without auth token

4. **Exception Handling Before Auth**
   - Catches auth errors
   - Converts to proper HTTP responses

5. **Authentication Before Authorization**
   - Must know WHO before checking WHAT they can do
   - Sets `HttpContext.User` with claims

6. **Authorization Before Controllers**
   - Checks permissions before controller code runs
   - Uses `[Authorize]` attributes

---

## ExceptionHandlingMiddleware Explained

### Complete Code

```csharp
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next, 
        ILogger<ExceptionHandlingMiddleware> logger
    )
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex, 
                "An error occured with req {Method},{Path}", 
                context.Request.Method, 
                context.Request.Path
            );
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new ApiResponse<object>
        {
            Success = false,
            Message = "An internal error occurred",
            StatusCode = context.Response.StatusCode,
        };

        return context.Response.WriteAsJsonAsync(response);
    }
}
```

**Line-by-Line Explanation**:

### Constructor

```csharp
public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    _next = next;
    _logger = logger;
}
```

**What**: 
- `RequestDelegate next` - Next middleware in pipeline
- `ILogger` - For logging errors

**Why**: 
- Middleware pattern - each middleware calls the next
- Logger needed to record exceptions

---

### InvokeAsync Method

```csharp
public async Task InvokeAsync(HttpContext context)
{
    try
    {
        await _next(context);  // Call next middleware
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "An error occured...");
        await HandleExceptionAsync(context, ex);
    }
}
```

**What**: Wraps entire pipeline in try-catch

**Flow**:
1. Calls `_next(context)` - Executes rest of pipeline
2. If exception thrown → catches it
3. Logs error with context
4. Converts exception to HTTP response

**Why**:
- **Global Exception Handler**: Catches ALL unhandled exceptions
- **Consistent Error Format**: All errors return `ApiResponse`
- **Prevents Crashes**: Application continues running

**Example Flow**:
```
Request → ExceptionHandlingMiddleware
           ↓
         try {
           ↓
         UseAuthentication (throws exception)
           ↓
         catch → HandleExceptionAsync
           ↓
         Return 500 with ApiResponse
```

---

### HandleExceptionAsync Method

```csharp
private static Task HandleExceptionAsync(HttpContext context, Exception exception)
{
    context.Response.ContentType = "application/json";
    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

    var response = new ApiResponse<object>
    {
        Success = false,
        Message = "An internal error occurred",
        StatusCode = context.Response.StatusCode,
    };

    return context.Response.WriteAsJsonAsync(response);
}
```

**Line-by-Line**:

1. **Set Content Type**
   ```csharp
   context.Response.ContentType = "application/json";
   ```
   - **What**: Tells client response is JSON
   - **Why**: Frontend expects JSON format

2. **Set Status Code**
   ```csharp
   context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
   ```
   - **What**: Sets HTTP 500 status
   - **Why**: Server error (unexpected exception)

3. **Create Response**
   ```csharp
   var response = new ApiResponse<object> { ... };
   ```
   - **What**: Standard error response format
   - **Why**: Consistent with other API responses
   - **Note**: Generic message - doesn't expose internal error details

4. **Write Response**
   ```csharp
   return context.Response.WriteAsJsonAsync(response);
   ```
   - **What**: Serializes response to JSON and sends to client
   - **Why**: Client gets proper error format

---

## Request Flow

### Complete Request Journey

```
1. HTTP Request arrives
   ↓
2. UseHttpsRedirection
   - Redirects HTTP → HTTPS (if needed)
   ↓
3. UseRouting
   - Determines which controller/action to call
   ↓
4. UseCors
   - Checks origin, applies CORS policy
   - Handles preflight (OPTIONS) requests
   ↓
5. UseSerilogRequestLogging
   - Logs: Method, Path, Status Code, Duration
   ↓
6. ExceptionHandlingMiddleware
   - Wraps pipeline in try-catch
   ↓
7. UseAuthentication
   - Reads Authorization header
   - Validates JWT token
   - Extracts claims → HttpContext.User
   ↓
8. UseAuthorization
   - Checks [Authorize] attributes
   - Validates role/permissions
   ↓
9. MapControllers
   - Routes to specific controller action
   ↓
10. Controller Action
    - Extracts user info
    - Calls service
    - Returns response
    ↓
11. Response flows back through middleware (reverse order)
    ↓
12. ExceptionHandlingMiddleware
    - If exception → catches, logs, returns error
    ↓
13. UseSerilogRequestLogging
    - Logs response status
    ↓
14. HTTP Response sent to client
```

---

## Key Concepts

### RequestDelegate

```csharp
private readonly RequestDelegate _next;
```

**What**: Represents next middleware in pipeline

**Why**: 
- Middleware pattern - chain of responsibility
- Each middleware calls next
- Last middleware calls controller

**Flow**:
```
Middleware1 → Middleware2 → Middleware3 → Controller
```

---

### HttpContext

```csharp
public async Task InvokeAsync(HttpContext context)
```

**What**: Contains request and response information

**Properties**:
- `context.Request` - HTTP request (method, path, headers, body)
- `context.Response` - HTTP response (status, headers, body)
- `context.User` - Authenticated user (set by UseAuthentication)
- `context.Connection` - Connection info (IP address, etc.)

**Why**: 
- Single object passed through pipeline
- Contains everything about the request
- Can be modified by middleware

---

## Best Practices

1. **Catch All Exceptions**
   - Prevents application crashes
   - Returns proper HTTP responses

2. **Log Errors**
   - Include request context (method, path)
   - Helps debugging

3. **Don't Expose Internal Details**
   - Generic error message to client
   - Detailed error in logs only
   - Security - don't leak implementation details

4. **Consistent Error Format**
   - Use `ApiResponse<T>` for all errors
   - Frontend can handle uniformly

---

## Summary

The middleware pipeline ensures:
- ✅ Security (HTTPS, CORS, Authentication)
- ✅ Error handling (global exception handler)
- ✅ Logging (request/response tracking)
- ✅ Authorization (role-based access control)

Each middleware has a specific responsibility and executes in a specific order to ensure proper request processing.

---

## Documentation Complete!

You now have comprehensive documentation covering:
- ✅ Architecture and design patterns
- ✅ Application configuration (Program.cs)
- ✅ Data layer (Models, DbContext, relationships)
- ✅ Repository layer (Include/ThenInclude explained in detail)
- ✅ Service layer (Business logic)
- ✅ Controller layer (API endpoints)
- ✅ Authentication & Authorization (JWT, permissions)
- ✅ Middleware (Exception handling, pipeline)

All documentation files are in the `DOCUMENTATION/` folder.
