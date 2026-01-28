# ProjecTron - Project Allocation System
## Comprehensive Project Overview

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Backend System](#backend-system)
5. [Frontend Application](#frontend-application)
6. [Azure Functions - Email Notifications](#azure-functions---email-notifications)
7. [Technology Stack](#technology-stack)
8. [Key Features & Capabilities](#key-features--capabilities)
9. [Security & Authentication](#security--authentication)
10. [Database Schema](#database-schema)
11. [Azure Cloud Services](#azure-cloud-services)
12. [Deployment & DevOps](#deployment--devops)
13. [API Documentation](#api-documentation)
14. [User Roles & Permissions](#user-roles--permissions)

---

## Executive Summary

**ProjecTron** is a comprehensive, enterprise-grade Project Allocation and Management System designed to streamline project workflows, resource allocation, task management, and team collaboration. Built on modern cloud-native architecture, the system provides role-based access control, real-time notifications, and seamless integration with Azure cloud services.

The platform supports multi-tenant organizations with granular permission management, enabling administrators, project managers, team leads, and team members to efficiently collaborate on projects, manage sprints, track tasks, and monitor project progress through intuitive dashboards.

---

## Project Overview

### Purpose
ProjecTron addresses the critical need for a centralized platform to manage:
- **Project Lifecycle Management**: From planning to completion
- **Resource Allocation**: Efficient assignment of team members to projects
- **Task Tracking**: Comprehensive task management with dependencies and time tracking
- **Sprint Management**: Agile sprint planning and execution
- **Team Collaboration**: Communication through comments, notifications, and shared workspaces
- **Audit & Compliance**: Complete audit trail for all system activities

### Target Users
- **Administrators**: System-wide management and configuration
- **Project Managers**: Project oversight and resource allocation
- **Team Leads**: Team coordination and task assignment
- **Team Members**: Task execution and progress reporting

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  React SPA (Vite + TypeScript + Redux + Tailwind CSS)       │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
                        │ JWT Authentication
┌───────────────────────▼─────────────────────────────────────┐
│                    BACKEND API LAYER                        │
│  ASP.NET Core 8 Web API (Controllers → Services → Repos)    │
└───────┬───────────────────────┬───────────────────┬─────────┘
        │                       │                   │
        │                       │                   │
┌───────▼────────┐   ┌─────────▼────────┐  ┌───────▼──────────┐
│  SQL Server    │   │  Azure Service   │  │  Azure Blob      │
│   Database     │   │      Bus         │  │    Storage       │
└────────────────┘   └─────────┬─────────┘  └──────────────────┘
                              │
                              │ Queue Messages
                              │
                    ┌─────────▼─────────────┐
                    │  AZURE FUNCTIONS      │
                    │  Email Notifications  │
                    └─────────┬─────────────┘
                              │
                    ┌─────────▼─────────────┐
                    │  Azure Communication │
                    │      Services        │
                    │    (Email Sending)   │
                    └──────────────────────┘
```

### Architecture Principles

1. **Layered Architecture**: Clear separation of concerns (Controllers → Services → Repositories → Data)
2. **Microservices-Ready**: Azure Functions for asynchronous email processing
3. **Cloud-Native**: Built for Azure cloud infrastructure
4. **Scalable**: Stateless API design with horizontal scaling capability
5. **Secure**: JWT-based authentication with role-based access control
6. **Maintainable**: Clean code structure with dependency injection and interfaces

---

## Backend System

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Language**: C# (.NET 8)
- **ORM**: Entity Framework Core 9.0
- **Database**: Microsoft SQL Server
- **Authentication**: JWT Bearer Tokens
- **Logging**: Serilog
- **API Documentation**: Swagger/OpenAPI
- **Object Mapping**: AutoMapper
- **Password Hashing**: BCrypt.Net

### Project Structure

```
Project_Allocation_System/
├── Controllers/          # API Endpoints
│   ├── AuthController.cs
│   ├── ProjectController.cs
│   ├── TaskController.cs
│   ├── SprintController.cs
│   ├── TeamController.cs
│   ├── AdminController.cs
│   └── ...
├── Services/             # Business Logic Layer
│   ├── AuthService.cs
│   ├── ProjectService.cs
│   ├── TaskService.cs
│   ├── ProjectAllocationService.cs
│   ├── ServiceBusNotificationService.cs
│   └── ...
├── Repos/                # Data Access Layer
│   ├── UserRepository.cs
│   ├── ProjectRepository.cs
│   ├── TaskRepository.cs
│   └── ...
├── Models/               # Domain Models
│   ├── User.cs
│   ├── Project.cs
│   ├── WorkTask.cs
│   ├── Sprint.cs
│   └── ...
├── DTOs/                 # Data Transfer Objects
├── Interfaces/           # Service & Repository Contracts
├── Middlewares/          # Custom Middleware
│   └── ExceptionHandlingMiddleware.cs
├── Auth/                 # Authentication Components
│   └── JwtTokenProvider.cs
├── Mapping/              # AutoMapper Profiles
└── Data/                 # DbContext
    └── ApplicationDbContext.cs
```

### Key Backend Features

#### 1. **Layered Architecture**
- **Controllers**: Handle HTTP requests/responses, authorization, validation
- **Services**: Business logic, validation, orchestration
- **Repositories**: Data access abstraction using EF Core
- **Models**: Domain entities and business objects

#### 2. **Authentication & Authorization**
- JWT Bearer token authentication
- Role-based access control (RBAC)
- Permission-based authorization
- Password hashing with BCrypt
- Account lockout after failed login attempts

#### 3. **API Design**
- RESTful API endpoints
- Consistent response format (`ApiResponse<T>`)
- JSON camelCase serialization
- Swagger/OpenAPI documentation
- CORS configuration for frontend integration

#### 4. **Error Handling**
- Global exception handling middleware
- Structured error responses
- Comprehensive logging with Serilog
- Request/response logging

#### 5. **Notification System**
- Azure Service Bus integration
- Asynchronous email notification queuing
- Template-based email system
- Support for multiple notification types

#### 6. **File Management**
- Azure Blob Storage integration
- Document upload/download
- Attachment management for tasks

### API Endpoints Overview

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

#### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/{id}` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

#### Sprints
- `GET /api/sprints` - List sprints
- `POST /api/sprints` - Create sprint
- `PUT /api/sprints/{id}` - Update sprint

#### Teams & Allocations
- `GET /api/teams` - List teams
- `POST /api/project-allocations` - Allocate user to project
- `PUT /api/project-allocations/{id}` - Update allocation

#### Dashboards
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/pm/dashboard` - Project Manager dashboard
- `GET /api/tm/dashboard` - Team Member dashboard

---

## Frontend Application

### Technology Stack
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Language**: TypeScript 5.9.3
- **State Management**: Redux Toolkit 2.11.2
- **Routing**: React Router DOM 7.12.0
- **HTTP Client**: Axios 1.13.2
- **Styling**: Tailwind CSS 4.1.18
- **Icons**: Lucide React 0.562.0

### Project Structure

```
Project_Allocation_System_Frontend/
├── src/
│   ├── api/              # API Client Modules
│   │   ├── client.ts     # Axios instance
│   │   ├── admin/
│   │   ├── pm/
│   │   ├── tl/
│   │   ├── tm/
│   │   └── project/
│   ├── app/              # Redux Store
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── components/       # Reusable Components
│   │   ├── common/
│   │   ├── layout/
│   │   ├── project/
│   │   └── task/
│   ├── features/         # Redux Slices
│   │   ├── auth/
│   │   ├── pm/
│   │   ├── project/
│   │   └── ...
│   ├── layouts/          # Layout Components
│   │   ├── AdminLayout.tsx
│   │   └── AppLayout.tsx
│   ├── pages/            # Page Components
│   │   ├── admin/
│   │   ├── pm/
│   │   ├── tl/
│   │   ├── tm/
│   │   └── auth/
│   ├── routes/           # Route Guards
│   │   └── ProtectedRoute.tsx
│   ├── types/           # TypeScript Types
│   ├── utils/           # Utility Functions
│   └── contexts/        # React Contexts
```

### Key Frontend Features

#### 1. **Role-Based Routing**
- **Admin Routes** (`/admin/*`): Full system access
- **Project Manager Routes** (`/pm/*`): Project and team management
- **Team Lead Routes** (`/tl/*`): Team task management
- **Team Member Routes** (`/tm/*`): Personal task management
- **Public Routes**: Landing page, login, registration

#### 2. **State Management**
- Redux Toolkit for global state
- Feature-based slices (auth, projects, tasks, etc.)
- Optimistic updates for better UX
- Persistent authentication state

#### 3. **API Integration**
- Centralized Axios client with interceptors
- Automatic JWT token attachment
- Request/response error handling
- Loading states management

#### 4. **User Interface**
- Modern, responsive design with Tailwind CSS
- Consistent component library
- Loading skeletons and spinners
- Toast notifications for user feedback
- Sidebar navigation with role-specific menus

#### 5. **Key Pages**

**Admin Pages:**
- Dashboard with system overview
- Project management (create, edit, view)
- User management
- Organization management
- Task overview
- Reports and analytics
- Audit logs
- System settings

**Project Manager Pages:**
- Dashboard with project metrics
- Project details and management
- Sprint planning and management
- Task board (Kanban view)
- Team management
- Task filtering (overdue, not started, etc.)

**Team Lead Pages:**
- Dashboard with team metrics
- Task management and assignment
- Project view (read-only)
- Sprint tracking
- Task board

**Team Member Pages:**
- Personal dashboard
- My tasks view
- Task board
- Project information (read-only)

---

## Azure Functions - Email Notifications

### Overview
The Email Notification Functions project provides asynchronous email processing using Azure Functions, triggered by Service Bus messages or scheduled timers.

### Technology Stack
- **Runtime**: .NET 8 (Isolated Worker)
- **Framework**: Azure Functions v4
- **Email Service**: Azure Communication Services
- **Storage**: Azure Blob Storage (templates)
- **Messaging**: Azure Service Bus
- **Database**: SQL Server (shared with backend)

### Functions

#### 1. **ProcessEmailNotification**
- **Trigger**: Service Bus Queue (`email-notifications`)
- **Purpose**: Process email notification messages from the backend
- **Flow**:
  1. Receive message from Service Bus queue
  2. Deserialize `EmailNotificationMessage`
  3. Fetch HTML template from Blob Storage
  4. Replace template variables with dynamic data
  5. Fetch recipient email from database (if needed)
  6. Send email via Azure Communication Services

**Supported Templates:**
- `user-registered` - Welcome email for new users
- `project-assigned` - Project manager assignment notification
- `project-reassigned` - Project reassignment notification
- `task-assigned` - Task assignment notification
- `task-due-date` - Task due date reminder
- `team-lead-assigned` - Team lead assignment notification
- `user-added-to-project` - Project member addition notification
- `weekly-report` - Weekly project report
- `audit-log` - Audit log summary

#### 2. **SendWeeklyReports** (Scheduled)
- **Trigger**: Timer (CRON: `0 0 9 * * MON` - Every Monday at 9 AM UTC)
- **Purpose**: Send weekly project reports to Project Managers and Admins
- **Flow**:
  1. Query database for active Project Managers and Admins
  2. Generate weekly report data per user
  3. Load report template from Blob Storage
  4. Populate template with project metrics
  5. Send personalized email reports

#### 3. **CheckTaskDueDates** (Scheduled)
- **Trigger**: Timer (CRON: `0 0 8 * * *` - Daily at 8 AM UTC)
- **Purpose**: Send reminders for tasks due today
- **Flow**:
  1. Query tasks due today (not completed/cancelled)
  2. For each task, notify assignee, team lead, and project manager
  3. Use `task-due-date` template
  4. Send email notifications

#### 4. **CheckOverdueTasks** (Scheduled)
- **Trigger**: Timer (CRON: `0 0 9 * * *` - Daily at 9 AM UTC)
- **Purpose**: Send alerts for overdue tasks
- **Flow**:
  1. Query overdue tasks (due date passed, not completed)
  2. Notify assignee, team lead, and project manager
  3. Use appropriate template
  4. Send email notifications

### Email Template System
- Templates stored in Azure Blob Storage container `email-templates`
- HTML-based templates with variable placeholders
- Dynamic variable replacement using `{{variableName}}` syntax
- Support for rich HTML formatting
- Responsive email design

---

## Technology Stack

### Backend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | ASP.NET Core | 8.0 | Web API framework |
| **Language** | C# | .NET 8 | Programming language |
| **ORM** | Entity Framework Core | 9.0.11 | Database access |
| **Database** | SQL Server | Latest | Primary data store |
| **Authentication** | JWT Bearer | 8.0.22 | Token-based auth |
| **Password Hashing** | BCrypt.Net | 4.0.3 | Secure password storage |
| **Logging** | Serilog | 4.3.0 | Structured logging |
| **API Docs** | Swashbuckle | 6.6.2 | Swagger/OpenAPI |
| **Mapping** | AutoMapper | 12.0.1 | Object mapping |
| **Messaging** | Azure Service Bus | 7.18.1 | Async notifications |
| **Storage** | Azure Blob Storage | 12.19.1 | File storage |

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 19.2.0 | UI framework |
| **Build Tool** | Vite | 7.2.4 | Build and dev server |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript |
| **State Management** | Redux Toolkit | 2.11.2 | Global state |
| **Routing** | React Router | 7.12.0 | Client-side routing |
| **HTTP Client** | Axios | 1.13.2 | API requests |
| **Styling** | Tailwind CSS | 4.1.18 | Utility-first CSS |
| **Icons** | Lucide React | 0.562.0 | Icon library |

### Azure Functions Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | .NET 8 Isolated | 8.0 | Function runtime |
| **Functions SDK** | Azure Functions Worker | 1.23.0 | Functions framework |
| **Service Bus** | Functions Extensions | 5.15.0 | Service Bus triggers |
| **Email** | Azure Communication | 1.0.1 | Email sending |
| **Storage** | Azure Blob Storage | 12.19.1 | Template storage |
| **Database** | EF Core SQL Server | 8.0.1 | Database access |

### Azure Cloud Services

| Service | Purpose |
|---------|---------|
| **Azure SQL Database** | Primary database |
| **Azure Service Bus** | Message queue for notifications |
| **Azure Blob Storage** | Email templates and document storage |
| **Azure Communication Services** | Email delivery |
| **Azure Functions** | Serverless email processing |

---

## Key Features & Capabilities

### 1. Project Management
- ✅ Create, update, and delete projects
- ✅ Project status tracking (Planned, InProgress, OnHold, Completed, Cancelled)
- ✅ Priority management (Low, Medium, High, Critical)
- ✅ Budget tracking and spending monitoring
- ✅ Progress percentage calculation
- ✅ Project manager assignment and reassignment
- ✅ Multi-organization support

### 2. Task Management
- ✅ Comprehensive task creation and editing
- ✅ Task types (Feature, Bug, Technical Debt, Documentation, Research, Testing)
- ✅ Priority levels and complexity assessment
- ✅ Story points and time estimation
- ✅ Actual hours tracking
- ✅ Task dependencies (Finish-to-Start, Start-to-Start, etc.)
- ✅ Task comments and collaboration
- ✅ File attachments
- ✅ Task status workflow (NotStarted → InProgress → Approved → Done)
- ✅ Kanban board view
- ✅ Task filtering (overdue, not started, by assignee, etc.)

### 3. Sprint Management
- ✅ Sprint creation and planning
- ✅ Sprint status tracking (Planned, Active, Completed, Cancelled)
- ✅ Story points allocation
- ✅ Sprint member assignment
- ✅ Sprint statistics and metrics
- ✅ Sprint goal tracking

### 4. Resource Allocation
- ✅ User allocation to projects
- ✅ Allocation percentage management
- ✅ Team-based allocation
- ✅ Active/inactive allocation tracking
- ✅ Allocation date ranges
- ✅ Team lead assignment

### 5. User & Organization Management
- ✅ Multi-tenant organization support
- ✅ User registration and management
- ✅ Role-based access control
- ✅ Department and designation tracking
- ✅ User activation/deactivation
- ✅ Account lockout after failed login attempts

### 6. Dashboard & Analytics
- ✅ Role-specific dashboards
- ✅ Project metrics and KPIs
- ✅ Task completion statistics
- ✅ Sprint velocity tracking
- ✅ Resource utilization metrics
- ✅ Overdue task alerts

### 7. Notifications & Communication
- ✅ Real-time email notifications
- ✅ Project assignment notifications
- ✅ Task assignment alerts
- ✅ Due date reminders
- ✅ Overdue task notifications
- ✅ Weekly report emails
- ✅ Template-based email system

### 8. Audit & Compliance
- ✅ Comprehensive audit logging
- ✅ User activity tracking
- ✅ Change history for projects and tasks
- ✅ Audit log viewing and filtering

### 9. File Management
- ✅ Document upload to Azure Blob Storage
- ✅ Task attachment support
- ✅ Secure file access

### 10. Security Features
- ✅ JWT-based authentication
- ✅ Password hashing with BCrypt
- ✅ Role-based authorization
- ✅ Permission-based access control
- ✅ CORS configuration
- ✅ Account lockout protection
- ✅ Secure API endpoints

---

## Security & Authentication

### Authentication Mechanism
- **JWT Bearer Token Authentication**
  - Token-based stateless authentication
  - Configurable token expiration
  - Symmetric key signing (minimum 32 characters)
  - Issuer and audience validation
  - Lifetime validation with zero clock skew

### Password Security
- **BCrypt Hashing**: Industry-standard password hashing
- **Salt Generation**: Unique salt per password
- **No Plain Text Storage**: Passwords never stored in plain text

### Authorization
- **Role-Based Access Control (RBAC)**
  - Admin (Role ID: 1)
  - Project Manager (Role ID: 2)
  - Team Lead (Role ID: 3)
  - Team Member (Role ID: 4)

- **Permission-Based Access**
  - Granular permissions per role
  - Resource-level authorization
  - Organization-based data isolation

### Security Features
- ✅ Account lockout after failed login attempts
- ✅ HTTPS enforcement
- ✅ CORS policy configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (EF Core parameterized queries)
- ✅ XSS protection
- ✅ Secure API endpoints with `[Authorize]` attributes

---

## Database Schema

### Core Entities

#### Organizations
- Multi-tenant organization support
- Organization activation/deactivation

#### Users
- User authentication and profile information
- Role assignment
- Organization association
- Login tracking and lockout management

#### Projects
- Project details (name, code, description)
- Status and priority tracking
- Budget and spending
- Project manager assignment
- Organization association

#### ProjectAllocations
- User-to-project allocation
- Allocation percentage
- Team name assignment
- Date range tracking
- Active/inactive status

#### WorkTasks
- Comprehensive task information
- Task classification (type, priority, complexity, risk)
- Estimation (story points, hours)
- Assignment tracking
- Progress monitoring
- Dependencies and relationships

#### Sprints
- Sprint planning and execution
- Story points tracking
- Sprint member management
- Status tracking

#### Teams
- Team creation and management
- Team member assignment
- Team lead designation

#### AuditLogs
- System-wide activity logging
- User action tracking
- Change history

#### WorkItemLinks
- Task-to-task relationships
- Link type classification

### Relationships
- **User** → **Organization** (Many-to-One)
- **Project** → **Organization** (Many-to-One)
- **Project** → **User** (Project Manager, Many-to-One)
- **ProjectAllocation** → **Project** (Many-to-One)
- **ProjectAllocation** → **User** (Many-to-One)
- **WorkTask** → **Project** (Many-to-One)
- **WorkTask** → **Sprint** (Many-to-One, Optional)
- **WorkTask** → **User** (Assignee, Many-to-One)
- **Sprint** → **Project** (Many-to-One)

---

## Azure Cloud Services

### 1. Azure SQL Database
- **Purpose**: Primary relational database
- **Features**: 
  - Managed SQL Server instance
  - Automatic backups
  - High availability
  - Scalable performance tiers

### 2. Azure Service Bus
- **Purpose**: Message queue for asynchronous email notifications
- **Queue**: `email-notifications`
- **Flow**: Backend publishes messages → Functions consume and process

### 3. Azure Blob Storage
- **Purpose**: 
  - Email template storage (container: `email-templates`)
  - Document and file storage
- **Features**:
  - Scalable object storage
  - Secure access with connection strings
  - Versioning support

### 4. Azure Communication Services
- **Purpose**: Email delivery service
- **Features**:
  - Reliable email sending
  - HTML email support
  - Delivery tracking

### 5. Azure Functions
- **Purpose**: Serverless email processing
- **Runtime**: .NET 8 Isolated Worker
- **Triggers**:
  - Service Bus Queue (ProcessEmailNotification)
  - Timer Triggers (Scheduled reports and reminders)
- **Benefits**:
  - Pay-per-execution pricing
  - Automatic scaling
  - No server management

---

## Deployment & DevOps

### Backend Deployment
- **Platform**: Azure App Service (recommended)
- **Build**: .NET 8 SDK
- **Configuration**: 
  - Connection strings in Azure App Settings
  - Environment-specific appsettings files
- **CI/CD**: Azure DevOps Pipelines (azure-pipelines-pas-backend.yml)

### Frontend Deployment
- **Platform**: Azure Static Web Apps or Azure Blob Storage + CDN
- **Build**: Vite production build
- **Configuration**: Environment variables for API base URL

### Azure Functions Deployment
- **Platform**: Azure Functions App
- **Runtime**: .NET 8 Isolated
- **Configuration**: Application settings for connection strings

### Environment Configuration
- **Development**: Local development with local.settings.json
- **Staging**: Staging environment with separate Azure resources
- **Production**: Production environment with production-grade Azure resources

---

## API Documentation

### Swagger/OpenAPI
- **Endpoint**: `/swagger` (Development only)
- **Features**:
  - Interactive API documentation
  - JWT Bearer token authentication
  - Request/response schema documentation
  - Try-it-out functionality

### API Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* Response data */ },
  "statusCode": 200
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* Validation errors */ ],
  "statusCode": 400
}
```

---

## User Roles & Permissions

### Admin (Role ID: 1)
- ✅ Full system access
- ✅ User management
- ✅ Organization management
- ✅ Project creation and management
- ✅ System configuration
- ✅ Audit log access
- ✅ Reports and analytics

### Project Manager (Role ID: 2)
- ✅ Project management (assigned projects)
- ✅ Team management
- ✅ Sprint planning and management
- ✅ Task creation and assignment
- ✅ Resource allocation
- ✅ Project dashboard access

### Team Lead (Role ID: 3)
- ✅ Team task management
- ✅ Task assignment to team members
- ✅ Task creation
- ✅ Project view (read-only)
- ✅ Sprint tracking
- ✅ Team dashboard access

### Team Member (Role ID: 4)
- ✅ Personal task management
- ✅ Task status updates
- ✅ Time logging
- ✅ Task comments
- ✅ Project view (read-only)
- ✅ Personal dashboard access

---

## Conclusion

ProjecTron represents a modern, scalable, and feature-rich project allocation system built on industry-standard technologies and cloud-native architecture. The system provides comprehensive project management capabilities with robust security, real-time notifications, and an intuitive user interface.

The architecture supports future enhancements and scalability, making it suitable for organizations of all sizes. With its multi-tenant design, role-based access control, and Azure cloud integration, ProjecTron delivers enterprise-grade project management solutions.

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Project Name**: ProjecTron - Project Allocation System
