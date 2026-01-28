# Backend Implementation Documentation

Complete line-by-line explanation of the Project Allocation System backend implementation.

## Documentation Index

### Core Architecture
- **[00-Architecture-Overview.md](./00-Architecture-Overview.md)** - High-level architecture, design patterns, technology stack
- **[01-Program-Configuration.md](./01-Program-Configuration.md)** - Application startup, dependency injection, middleware pipeline

### Data Access
- **[02-Data-Layer.md](./02-Data-Layer.md)** - Database models, DbContext configuration, relationships, delete behaviors
- **[03-Repository-Layer.md](./03-Repository-Layer.md)** - Repository pattern, Include/ThenInclude basics
- **[03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md)** - **DEEP DIVE**: How EF Core processes queries, LINQ to SQL translation, Include/ThenInclude internals

### Business Logic
- **[04-Service-Layer.md](./04-Service-Layer.md)** - Business logic, validation, orchestration, error handling
- **[05-Controller-Layer.md](./05-Controller-Layer.md)** - API endpoints, HTTP handling, request/response, authorization patterns

### Security & Infrastructure
- **[06-Authentication-Authorization.md](./06-Authentication-Authorization.md)** - JWT tokens, role-based permissions, password security
- **[06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md)** - **DEEP DIVE**: What happens if config missing, encryption/signing explained, password hashing internals
- **[07-Middleware.md](./07-Middleware.md)** - Exception handling, logging, request pipeline

---

## Quick Start

1. Start with **[00-Architecture-Overview.md](./00-Architecture-Overview.md)** for high-level understanding
2. Read **[01-Program-Configuration.md](./01-Program-Configuration.md)** to understand application setup
3. Study **[02-Data-Layer.md](./02-Data-Layer.md)** for database structure
4. Deep dive into **[03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md)** for Include/ThenInclude and query processing
5. Understand security with **[06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md)**

---

## Key Concepts Explained

### Include() and ThenInclude()
See **[03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md#include-processing-explained)** for comprehensive explanation with:
- How EF Core translates Include() to SQL JOINs
- Step-by-step materialization process
- What happens without Include() (N+1 problem)
- Performance implications

### Authentication & Encryption
See **[06-Authentication-Authorization-Deep-Dive.md](./06-Authentication-Authorization-Deep-Dive.md)** for:
- What happens if JWT settings are missing
- How JWT signing works (not encryption!)
- Password hashing with PBKDF2 explained
- Complete authentication/authorization flow

### Repository Processing
See **[03-Repository-Layer-Deep-Dive.md](./03-Repository-Layer-Deep-Dive.md#how-ef-core-translates-linq-to-sql)** for:
- How LINQ queries become SQL
- Expression tree building
- Query execution lifecycle
- IQueryable vs IEnumerable

---

## Documentation Structure

### Standard Documentation
- **00-Architecture-Overview.md** - Overview and patterns
- **01-Program-Configuration.md** - Startup configuration
- **02-Data-Layer.md** - Database models
- **03-Repository-Layer.md** - Basic repository patterns
- **04-Service-Layer.md** - Business logic
- **05-Controller-Layer.md** - API endpoints
- **06-Authentication-Authorization.md** - Basic auth concepts
- **07-Middleware.md** - Middleware pipeline

### Deep Dive Documentation
- **03-Repository-Layer-Deep-Dive.md** - **How repositories actually process queries**
- **06-Authentication-Authorization-Deep-Dive.md** - **What happens if config missing, encryption details**

---

## What's Covered

✅ **What** - What each component does
✅ **Why** - Why it's implemented that way  
✅ **How** - How it works internally
✅ **What If** - What happens if configuration is missing/changed
✅ **Encryption** - How encryption/hashing actually works
✅ **Processing** - How repositories process queries and translate LINQ to SQL

---

## Contributing

When adding new features:
1. Update relevant documentation files
2. Add code examples
3. Explain the "why" behind decisions
4. Include performance considerations
5. Document "what if" scenarios
