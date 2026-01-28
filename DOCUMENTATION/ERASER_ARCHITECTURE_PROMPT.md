# Eraser.io Architecture Diagram Prompts

Use these prompts in [Eraser.io](https://app.eraser.io) → **Diagram** → **Generate from prompt** (or AI diagram generator).  
Select **diagram type: Cloud Architecture Diagram** for best results.

---

## 1. Full System Architecture — Detailed (Recommended)

Use this for a comprehensive end-to-end view of frontend, backend, Azure Functions, and shared services.

```
Project Allocation System (PAS) — complete architecture (frontend, backend, Azure Functions):

--- FRONTEND (Project_Allocation_System_Frontend) ---
React SPA: Vite, React 19, Redux Toolkit, React Router 7, Axios, Tailwind CSS, Lucide icons. Single axios client (api/client.ts) with baseURL from VITE_API_BASE_URL; request interceptor attaches JWT Bearer from Redux store or localStorage. Role-based routing via ProtectedRoute (allowedRoles): Admin=1, ProjectManager=2, TeamLead=3, TeamMember=4.

Public: / (LandingPage), /login, /register.
Admin (/admin, AdminLayout): home, projects, projects/new, projects/:id, tasks, organizations, users, reports, notifications, integrations, audit-logs, settings.
Project Manager (/pm, AppLayout): dashboard, projects, projects/:id, teams, sprints/active, sprints/planning, sprints/stats, tasks (all/create/board/overdue/not-started).
Team Lead (/tl, AppLayout): dashboard, tasks (all/create/my-tasks/board/overdue/not-started/:taskId), projects (read-only), projects/:id (read-only), sprints/active, sprints/:id/stats.
Team Member (/tm, AppLayout): dashboard, tasks (my-tasks/board/all/:taskId), projects, projects/:id (read-only), sprints/active, sprints/stats.
Profile (/profile, all roles): ProfilePage.

API modules: admin, pm, tl, tm, project, sprint, profile — each calls backend REST endpoints via the shared axios client.

--- BACKEND (Project_Allocation_System) ---
ASP.NET Core 8 Web API, .NET 8, EF Core 9, SQL Server. Layered: Controllers → Services → Repositories → ApplicationDbContext → SQL Server.

Controllers: AuthController (login, register), ProjectController, TaskController, SprintController, TeamController, ProjectAllocationsController, UserController, OrganizationsController, AdminController, AdminDashboardController, ProjectManagerDashboardController, TeamMemberDashboardController, WorkItemLinkController.

Services: AuthService, ProjectService, TaskService, SprintService, TeamService, ProjectAllocationService, UserService, AdminDashboardService, ProjectManagerDashboardService, TeamMemberDashboardService, AuditLogService, WorkItemLinkService, PasswordService, ServiceBusNotificationService, BlobStorageService (Azure Blob for documents). Repositories: User, Project, Task, Sprint, ProjectAllocation, Organization, Team, WorkItemLink.

Auth: JWT Bearer (JwtTokenProvider, symmetric key from config), Validate Issuer/Audience/Lifetime, BCrypt/PBKDF2 for passwords. RBAC via RolePermissions (manage_users, manage_projects, create_projects, etc. per role). Swagger with Bearer security definition.

Middleware pipeline (order): UseHttpsRedirection → UseRouting → UseCors("AllowReactFrontend") → UseSerilogRequestLogging → ExceptionHandlingMiddleware → UseAuthentication → UseAuthorization → MapControllers.

ServiceBusNotificationService publishes EmailNotificationMessage (notificationType, templateKey, recipientUserId/recipientEmail, templateData) to Azure Service Bus queue "email-notifications". BlobStorageService uses BlobStorage:ConnectionString and BaseUrl for document uploads.

--- AZURE FUNCTIONS (EmailNotificationFunctions) ---
Same SQL Server and Blob Storage as backend. Uses ApplicationDbContext, Azure.Communication.Email, Azure.Storage.Blobs.

(1) ProcessEmailNotification — Service Bus trigger (queue from ServiceBusQueueName). Reads message, loads HTML template from Blob by templateKey, hydrates with templateData (may query DB for extra data), sends email via Azure Communication Services.

(2) SendWeeklyReports — TimerTrigger "0 0 9 * * MON" (Mondays 9 AM UTC). Queries Users (ProjectManagers, Admins), generates per-user weekly report from DB, uses Blob templates, sends via ACS Email.

(3) CheckTaskDueDates — TimerTrigger "0 0 8 * * *" (daily 8 AM UTC). Finds tasks due today (not Done/Cancelled), emails assignee, team lead, PM via Blob template.

(4) CheckOverdueTasks — TimerTrigger "0 0 9 * * *" (daily 9 AM UTC). Finds overdue tasks, emails assignee, team lead, PM.

Templates in Blob: user-registered, project-assigned, project-reassigned, project-reassigned-from, task-assigned, task-due-date, team-lead-assigned, team-lead-reassigned, team-lead-reassigned-from, user-added-to-project, audit-log, weekly-report.

--- SHARED / EXTERNAL ---
SQL Server: Organizations, Users, Projects, ProjectAllocations, Sprints, SprintMembers, WorkTasks, TaskComments, TaskTimeLogs, TaskDependencies, Teams, TeamMembers, AuditLogs, WorkItemLinks. Both API and Functions connect.

Azure Service Bus: queue "email-notifications"; API publishes, Functions ProcessEmailNotification consumes.
Azure Blob Storage: email templates (container used by Functions), document uploads (API BlobStorageService).
Azure Communication Services (Email): sends all outbound emails.

Draw a cloud architecture diagram with four clear sections: (1) Frontend — React SPA, role-based routes, axios→API; (2) Backend — ASP.NET Core API, controllers/services/repos, middleware, JWT; (3) Azure Functions — ProcessEmailNotification (Service Bus), SendWeeklyReports / CheckTaskDueDates / CheckOverdueTasks (timers); (4) Azure & SQL — Service Bus queue, Blob Storage (templates + documents), Azure Communication Email, SQL Server. Show all connections: Frontend↔API, API↔SQL, API↔Service Bus, API↔Blob; Functions↔Service Bus, Functions↔SQL, Functions↔Blob, Functions↔Email. Label components and data/notification flows.
```

---

## 1b. Full System Architecture — Concise

Shorter prompt for quick diagrams.

```
Project Allocation System (PAS): React SPA (Vite, Redux, Axios, JWT) → ASP.NET Core 8 API (Controllers→Services→Repositories→EF Core→SQL Server). API publishes to Azure Service Bus; EmailNotificationFunctions consumes queue (ProcessEmailNotification), fetches HTML from Blob, sends via Azure Communication Email. Timer functions: SendWeeklyReports (Mon 9 UTC), CheckTaskDueDates (daily 8 UTC), CheckOverdueTasks (daily 9 UTC). API and Functions share SQL Server and Blob Storage. API BlobStorageService handles document uploads. Draw cloud architecture: Frontend→API→SQL; API→Service Bus→Functions→Blob+Email+SQL; API→Blob.
```

---

## 2. Backend Layered Architecture Only

Use this to focus on the API’s internal layers.

```
Project Allocation System backend — layered architecture:

**Layer 1 — Controllers:** HTTP request/response, [Authorize], role-based checks, model validation. AuthController, ProjectController, TaskController, SprintController, TeamController, ProjectAllocationsController, UserController, OrganizationsController, AdminController, AdminDashboardController, ProjectManagerDashboardController, TeamMemberDashboardController, WorkItemLinkController. Inject services; return DTOs in ApiResponse.

**Layer 2 — Services:** Business logic, validation, orchestration. AuthService, ProjectService, TaskService, SprintService, TeamService, ProjectAllocationService, UserService, AdminDashboardService, ProjectManagerDashboardService, TeamMemberDashboardService, AuditLogService, WorkItemLinkService, PasswordService, ServiceBusNotificationService, BlobStorageService. Call repositories (I*Repository), ServiceBusNotificationService (publish to Service Bus), BlobStorageService (Blob read/write). AutoMapper for Model↔DTO.

**Layer 3 — Repositories:** Data access via EF Core. IUserRepository, IProjectRepository, ITaskRepository, ISprintRepository, IProjectAllocationRepository, IOrganizationRepository, ITeamRepository, IWorkItemLinkRepository. Use ApplicationDbContext (DbSets); Include/ThenInclude for eager loading.

**Layer 4 — Data:** ApplicationDbContext, domain models (Organization, User, Project, ProjectAllocation, Sprint, WorkTask, Team, TeamMember, AuditLog, etc.), SQL Server. Migrations manage schema.

**Pipeline:** UseHttpsRedirection → UseRouting → UseCors("AllowReactFrontend") → SerilogRequestLogging → ExceptionHandlingMiddleware → UseAuthentication → UseAuthorization → MapControllers. JWT Bearer, symmetric key; RolePermissions for RBAC.

**External:** Service Bus queue "email-notifications" (publish from services); Blob Storage (BlobStorageService for documents).

Draw a diagram with four horizontal layers (Controllers, Services, Repositories, Data), list main components per layer, and show SQL Server, Service Bus, and Blob Storage as external. Indicate request/response flow and outbound notification/blob flows.
```

---

## 3. Notification & Email Flow

Use this to emphasize async notifications and scheduled emails.

```
Project Allocation System — email and notification flow:

**Event-driven (API → Service Bus → Functions):** AuthService, ProjectService, ProjectAllocationService, TaskService, TeamService call ServiceBusNotificationService.SendEmailNotificationAsync(notificationType, templateKey, recipientUserId|recipientEmail, templateData, subject). Message is JSON; published to Azure Service Bus queue "email-notifications". ProcessEmailNotification (Service Bus trigger) consumes, deserializes EmailNotificationMessage, optionally queries SQL Server for recipient/templateData, fetches HTML template from Blob by templateKey, hydrates placeholders, sends via Azure Communication Services (Email). Templates: user-registered, project-assigned, project-reassigned, project-reassigned-from, task-assigned, task-due-date, team-lead-assigned, team-lead-reassigned, team-lead-reassigned-from, user-added-to-project, audit-log, weekly-report.

**Scheduled (Timer → Functions → SQL + Blob + Email):** All in EmailNotificationFunctions. (1) SendWeeklyReports — "0 0 9 * * MON" (Mondays 9 AM UTC): query Users (PMs, Admins), build per-user weekly report from DB, load template from Blob, send via ACS Email. (2) CheckTaskDueDates — "0 0 8 * * *" (daily 8 AM UTC): query WorkTasks due today, exclude Done/Cancelled, email assignee + team lead + PM. (3) CheckOverdueTasks — "0 0 9 * * *" (daily 9 AM UTC): query overdue tasks, same recipients. All use ApplicationDbContext (SQL Server), Blob for templates, ACS Email for send.

Draw a diagram: API → Service Bus queue → ProcessEmailNotification → Blob (templates) + SQL Server (optional) + Azure Communication Email; and three timer flows: SendWeeklyReports, CheckTaskDueDates, CheckOverdueTasks → SQL → Blob → Email. Label triggers, templates, and recipients.
```

---

## 4. Data Model / Entity Relationships (ER-style)

Use this for a high-level ER or domain-model view.

```
Project Allocation System — main entities and relationships:

**Organizations & users:** Organization (OrganizationId, Name, Location, IsActive, CreatedDate) 1→N Users. User (UserId, Email, FirstName, LastName, PasswordHash, PasswordSalt, PhoneNumber, Department, Designation, Role, OrganizationId, CreatedBy, etc.) belongs to one Organization. User as ProjectManager 1→N Projects (ProjectManagerId FK).

**Projects & allocations:** Project (ProjectId, Code, Name, Status, Priority, OrganizationId, ProjectManagerId, Budget, SpentBudget, CreatedDate, etc.) 1→N WorkTasks, 1→N Sprints, 1→N ProjectAllocations. ProjectAllocation (AllocationId, ProjectId, UserId) is junction table: Project ↔ User many-to-many.

**Tasks & sprints:** WorkTask (TaskId, ProjectId, AssignedToUserId, SprintId?, Title, Description, Status, Priority, DueDate, etc.) N→1 Project, N→1 User (AssignedTo), optional N→1 Sprint; 1→N TaskComments, 1→N TaskTimeLogs; TaskDependency / WorkItemLink for task-to-task links. Sprint (SprintId, ProjectId, Name, StartDate, EndDate, etc.) 1→N WorkTasks; SprintMember junction for sprint–user. TaskComment, TaskTimeLog, TaskDependency reference WorkTask.

**Teams:** Team (TeamId, ProjectId, Name, etc.) 1→N TeamMembers. TeamMember (TeamId, UserId, Role) links Team ↔ User.

**Audit:** AuditLog (LogId, UserId, Action, EntityType, EntityId, Timestamp, Details, etc.) records user actions.

**Enums:** UserRole (Admin=1, ProjectManager=2, TeamLead=3, TeamMember=4); ProjectStatus, ProjectPriority; TaskStatus (e.g. NotStarted, InProgress, Done, Cancelled).

Draw an entity-relationship diagram with these entities, key attributes, and relationships (1→N, N→1, M∶N via junction). Group optionally by Organization, Project, Task, User/Team.
```

---

## Tips for Eraser.io

- **Detail level:** Use **§1 (Detailed)** for full system docs; use **§1b (Concise)** for quick high-level diagrams.
- **Paste the full prompt** into the AI diagram generator; richer prompts (e.g. §1, §2, §3) usually yield better diagrams than one-liners.
- **Iterate:** Use follow-up prompts like “Add Azure region labels”, “Highlight the JWT auth flow”, or “Group Frontend / Backend / Azure Functions in separate swimlanes” to refine.
- **Diagram type:** Prefer **Cloud Architecture Diagram** for §1–§3; use **Data Model** or **ER diagram** for §4.
- **Attach context:** You can attach `Project_Allocation_System/DOCUMENTATION/00-Architecture-Overview.md` or relevant code snippets as additional context when generating.
