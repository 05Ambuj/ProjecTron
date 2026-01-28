import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ===================== PUBLIC ===================== */
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import LandingPage from "./pages/LandingPage";

/* ===================== LAYOUTS ===================== */
import AdminLayout from "./layouts/AdminLayout";
import AppLayout from "./layouts/AppLayout";

/* ===================== ADMIN PAGES ===================== */
import AdminHomePage from "./pages/admin/AdminHomePage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import ProjectDetailsPage from "./pages/admin/ProjectDetailsPage";
import CreateProjectPage from "./pages/admin/CreateProjectPage";
import TasksPage from "./pages/admin/TasksPage";
import OrganizationsPage from "./pages/admin/OrganizationsPage";
import UsersPage from "./pages/admin/UsersPage";
import ReportsPage from "./pages/admin/ReportsPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import IntegrationsPage from "./pages/admin/IntegrationsPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import SettingsPage from "./pages/admin/SettingsPage";

/* ===================== PROJECT MANAGER PAGES ===================== */
import PMDashboardPage from "./pages/pm/PMDashboardPage";
import PMProjectsPage from "./pages/pm/PMProjectsPage";
import PMProjectDetailsPage from "./pages/pm/PMProjectDetailsPage";
import PMSprintsPage from "./pages/pm/PMSprintsPage";
import PMSprintPlanningPage from "./pages/pm/PMSprintPlanningPage";
import PMSprintStatsPage from "./pages/pm/PMSprintStatsPage";
import PMTasksPage from "./pages/pm/PMTasksPage";
import PMCreateTaskPage from "./pages/pm/PMCreateTaskPage";
import PMTaskBoardPage from "./pages/pm/PMTaskBoardPage";
import PMOverdueTasksPage from "./pages/pm/PMOverdueTasksPage";
import PMNotStartedTasksPage from "./pages/pm/PMNotStartedTasksPage";
import PMManageTeamsPage from "./pages/pm/PMManageTeamsPage";

/* ===================== TEAM LEAD PAGES ===================== */
import TLDashboardPage from "./pages/tl/TLDashboardPage";
import TLTasksPage from "./pages/tl/TLTasksPage";
import TLCreateTaskPage from "./pages/tl/TLCreateTaskPage";
import TLMyTasksPage from "./pages/tl/TLMyTasksPage";
import TLTaskBoardPage from "./pages/tl/TLTaskBoardPage";
import TLOverdueTasksPage from "./pages/tl/TLOverdueTasksPage";
import TLNotStartedTasksPage from "./pages/tl/TLNotStartedTasksPage";
import TLTaskDetailsPage from "./pages/tl/TLTaskDetailsPage";
import TLSprintsPage from "./pages/tl/TLSprintsPage";
import TLProjectsPage from "./pages/tl/TLProjectsPage";
import TLProjectDetailsReadOnlyPage from "./pages/tl/TLProjectDetailsReadOnlyPage";

/* ===================== TEAM MEMBER PAGES ===================== */
import TMDashboardPage from "./pages/tm/TMDashboardPage";
import TMMyTasksPage from "./pages/tm/TMMyTasksPage";
import TMTaskBoardPage from "./pages/tm/TMTaskBoardPage";
import TMTaskDetailsPage from "./pages/tm/TMTaskDetailsPage";
import TMAllTasksPage from "./pages/tm/TMAllTasksPage";
import TMProjectsPage from "./pages/tm/TMProjectsPage";
import TMProjectDetailsReadOnlyPage from "./pages/tm/TMProjectDetailsReadOnlyPage";

/* ===================== PROFILE ===================== */
import ProfilePage from "./pages/profile/ProfilePage";

/* ===================== ROUTE GUARD ===================== */
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===================== PUBLIC ===================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ===================== ADMIN ===================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<CreateProjectPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* ===================== PROJECT MANAGER ===================== */}
        <Route
          path="/pm"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Navigate to="/pm/dashboard" replace />} />
          <Route path="dashboard" element={<PMDashboardPage />} />

          {/* Projects */}
          <Route path="projects" element={<PMProjectsPage />} />
          <Route path="projects/:projectId" element={<PMProjectDetailsPage />} />

          {/* Teams */}
          <Route path="teams" element={<PMManageTeamsPage />} />

          {/* Sprints */}
          <Route path="sprints/active" element={<PMSprintsPage />} />
          <Route path="sprints/planning" element={<PMSprintPlanningPage />} />
          <Route path="sprints/stats" element={<PMSprintStatsPage />} />
          <Route path="sprints/:sprintId/edit" element={<PMSprintPlanningPage />} />
          <Route path="sprints/:sprintId/stats" element={<PMSprintStatsPage />} />

          {/* Tasks */}
          <Route path="tasks" element={<Navigate to="/pm/tasks/all" replace />} />
          <Route path="tasks/all" element={<PMTasksPage />} />
          <Route path="tasks/create" element={<PMCreateTaskPage />} />
          <Route path="tasks/board" element={<PMTaskBoardPage />} />
          <Route path="tasks/overdue" element={<PMOverdueTasksPage />} />
          <Route path="tasks/not-started" element={<PMNotStartedTasksPage />} />
        </Route>

        {/* ===================== TEAM LEAD ===================== */}
        <Route
          path="/tl"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tl/dashboard" replace />} />
          <Route path="dashboard" element={<TLDashboardPage />} />
          
          {/* Tasks */}
          <Route path="tasks/all" element={<TLTasksPage />} />
          <Route path="tasks/create" element={<TLCreateTaskPage />} />
          <Route path="tasks/my-tasks" element={<TLMyTasksPage />} />
          <Route path="tasks/board" element={<TLTaskBoardPage />} />
          <Route path="tasks/overdue" element={<TLOverdueTasksPage />} />
          <Route path="tasks/not-started" element={<TLNotStartedTasksPage />} />
          <Route path="tasks/:taskId" element={<TLTaskDetailsPage />} />

          {/* Projects (Read-only) */}
          <Route path="projects" element={<TLProjectsPage />} />
          <Route path="projects/:projectId" element={<TLProjectDetailsReadOnlyPage />} />
          
          {/* Sprints (read-only for TL) */}
          <Route path="sprints/active" element={<TLSprintsPage />} />
          <Route path="sprints/:sprintId/stats" element={<PMSprintStatsPage />} />
        </Route>

        {/* ===================== TEAM MEMBER ===================== */}
        <Route
          path="/tm"
          element={
            <ProtectedRoute allowedRoles={[4]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tm/dashboard" replace />} />
          <Route path="dashboard" element={<TMDashboardPage />} />
          
          {/* Tasks */}
          <Route path="tasks/my-tasks" element={<TMMyTasksPage />} />
          <Route path="tasks/board" element={<TMTaskBoardPage />} />
          <Route path="tasks/all" element={<TMAllTasksPage />} />
          <Route path="tasks/:taskId" element={<TMTaskDetailsPage />} />
          
          {/* Projects */}
          <Route path="projects" element={<TMProjectsPage />} />
          <Route path="projects/:projectId" element={<TMProjectDetailsReadOnlyPage />} />
          
          {/* Sprints */}
          <Route path="sprints/active" element={<TLSprintsPage />} />
          <Route path="sprints/stats" element={<PMSprintStatsPage />} />
          <Route path="sprints/:sprintId/stats" element={<PMSprintStatsPage />} />
        </Route>

        {/* ===================== PROFILE (All Roles) ===================== */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfilePage />} />
        </Route>

        {/* ===================== LEGACY/FALLBACK ===================== */}
        <Route path="/dashboard" element={<Navigate to="/pm/dashboard" replace />} />
        <Route path="/projects" element={<Navigate to="/pm/projects" replace />} />
        <Route path="/tasks" element={<Navigate to="/pm/tasks/all" replace />} />

        {/* ===================== FALLBACK ===================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
