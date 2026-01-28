import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMDashboard, fetchPMProjects } from "../../features/pm/pmSlice";
import {
  FolderKanban,
  Zap,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Calendar,
  Target,
  BarChart3,
  DollarSign,
} from "lucide-react";
import LoadingPage from "../../components/common/LoadingPage";
import { useToast } from "../../contexts/useToast";
import { UserRole } from "../../constants/roles";

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
  trend?: { value: string; positive: boolean };
}) {
  const gradientColors: Record<string, string> = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };

  const iconColor = Object.keys(gradientColors).find((key) =>
    gradient.includes(key)
  ) || "blue";

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Gradient background overlay */}
      <div
        className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
      />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
            <Icon size={24} className={gradientColors[iconColor]} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend.positive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <TrendingUp
                size={12}
                className={trend.positive ? "" : "rotate-180"}
              />
              {trend.value}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-bold text-neutral-900">
            {value.toLocaleString()}
          </p>
          <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PMDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardStats, projects, loading, error } = useSelector(
    (state: RootState) => state.pm
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const { showError } = useToast();

  useEffect(() => {
    if (!user || !token || user.role !== UserRole.ProjectManager) return;
    
    dispatch(fetchPMDashboard());
    dispatch(
      fetchPMProjects({
        page: 1,
        pageSize: 5,
        actorRole: user.role as UserRole,
      })
    );
  }, [dispatch, user, token]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  if (loading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  const recentProjects = Array.isArray(projects) ? projects.slice(0, 5) : [];

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return "bg-blue-100 text-blue-700 border-blue-200"; // Planned
      case 2: return "bg-purple-100 text-purple-700 border-purple-200"; // In Progress
      case 3: return "bg-amber-100 text-amber-700 border-amber-200"; // On Hold
      case 4: return "bg-green-100 text-green-700 border-green-200"; // Completed
      case 5: return "bg-red-100 text-red-700 border-red-200"; // Cancelled
      default: return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return "Planned";
      case 2: return "In Progress";
      case 3: return "On Hold";
      case 4: return "Completed";
      case 5: return "Cancelled";
      default: return "Unknown";
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "text-blue-600"; // Low
      case 2: return "text-yellow-600"; // Medium
      case 3: return "text-orange-600"; // High
      case 4: return "text-red-600"; // Critical
      default: return "text-neutral-600";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Low";
      case 2: return "Medium";
      case 3: return "High";
      case 4: return "Critical";
      default: return "Medium";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Project Manager Dashboard
          </h1>
          <p className="text-base text-neutral-600">
            Welcome back, <span className="font-semibold text-neutral-900">{user?.firstName || "User"}</span> • Here's what's happening with your projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pm/projects"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md"
          >
            <span className="text-sm font-medium">View All Projects</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FolderKanban}
            label="Total Projects"
            value={dashboardStats.projectsCount}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            trend={{ value: "Active", positive: true }}
          />
          <StatCard
            icon={Zap}
            label="Active Sprints"
            value={dashboardStats.activeSprints}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            icon={CheckSquare}
            label="Open Tasks"
            value={dashboardStats.openTasks}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue Tasks"
            value={dashboardStats.overdueTasks}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
            trend={
              dashboardStats.overdueTasks > 0
                ? { value: "Action needed", positive: false }
                : { value: "On track", positive: true }
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="lg:col-span-2 rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/pm/projects"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-all shadow-sm">
                <FolderKanban size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors">My Projects</p>
                <p className="text-xs text-neutral-600 mt-0.5">View and manage all projects</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/pm/sprints/active"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-purple-400 hover:bg-purple-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 group-hover:from-purple-600 group-hover:to-purple-700 transition-all shadow-sm">
                <Zap size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-purple-700 transition-colors">Active Sprints</p>
                <p className="text-xs text-neutral-600 mt-0.5">Monitor sprint progress</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/pm/tasks/all"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-green-400 hover:bg-green-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 group-hover:from-green-600 group-hover:to-green-700 transition-all shadow-sm">
                <CheckSquare size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-green-700 transition-colors">All Tasks</p>
                <p className="text-xs text-neutral-600 mt-0.5">View and filter tasks</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-green-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/pm/tasks/overdue"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-red-400 hover:bg-red-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 group-hover:from-red-600 group-hover:to-red-700 transition-all shadow-sm">
                <AlertCircle size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-red-700 transition-colors">Overdue Tasks</p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  {dashboardStats?.overdueTasks || 0} tasks need attention
                </p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/pm/tasks/board"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 group-hover:from-amber-600 group-hover:to-amber-700 transition-all shadow-sm">
                <BarChart3 size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-amber-700 transition-colors">Task Board</p>
                <p className="text-xs text-neutral-600 mt-0.5">Kanban view of tasks</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/pm/sprints/planning"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 group-hover:from-indigo-600 group-hover:to-indigo-700 transition-all shadow-sm">
                <Target size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-indigo-700 transition-colors">Plan Sprint</p>
                <p className="text-xs text-neutral-600 mt-0.5">Create a new sprint</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
            </Link>
          </div>
        </section>

        {/* Recent Projects */}
        <section className="rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FolderKanban size={20} className="text-neutral-600" />
              <h2 className="text-xl font-semibold text-neutral-900">Recent Projects</h2>
            </div>
            <Link
              to="/pm/projects"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-neutral-100 w-fit mx-auto mb-3">
                <FolderKanban size={32} className="text-neutral-300" />
              </div>
              <p className="text-sm font-medium text-neutral-500">No projects yet</p>
              <p className="text-xs text-neutral-400 mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <button
                  key={project.projectId}
                  onClick={() => navigate(`/pm/projects/${project.projectId}`)}
                  className="w-full text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-blue-700 transition-colors mb-1">
                        {project.name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono">
                        {project.code}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md border flex-shrink-0 ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-neutral-600">Progress</span>
                      <span className="text-xs font-semibold text-neutral-900">{project.progressPercentage || 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${project.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                    {project.budget > 0 && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={14} />
                        <span>${(project.budget / 1000).toFixed(0)}k</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 ${getPriorityColor(project.priority)}`}>
                      <Target size={14} />
                      <span className="font-medium">{getPriorityLabel(project.priority)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Key Metrics & Alerts */}
      {dashboardStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <section className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-neutral-900">Key Metrics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban size={18} className="text-blue-600" />
                  <p className="text-xs text-neutral-600 uppercase tracking-wide font-medium">Total Projects</p>
                </div>
                <p className="text-3xl font-bold text-neutral-900">
                  {dashboardStats.projectsCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} className="text-purple-600" />
                  <p className="text-xs text-neutral-600 uppercase tracking-wide font-medium">Active Sprints</p>
                </div>
                <p className="text-3xl font-bold text-neutral-900">
                  {dashboardStats.activeSprints}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare size={18} className="text-green-600" />
                  <p className="text-xs text-neutral-600 uppercase tracking-wide font-medium">Open Tasks</p>
                </div>
                <p className="text-3xl font-bold text-neutral-900">
                  {dashboardStats.openTasks}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={18} className="text-red-600" />
                  <p className="text-xs text-neutral-600 uppercase tracking-wide font-medium">Overdue Tasks</p>
                </div>
                <p
                  className={`text-3xl font-bold ${
                    dashboardStats.overdueTasks > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {dashboardStats.overdueTasks}
                </p>
              </div>
            </div>
          </section>

          {/* Overdue Tasks Alert */}
          {dashboardStats.overdueTasks > 0 ? (
            <section className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-100 flex-shrink-0">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                    Action Required: Overdue Tasks
                  </h2>
                  <p className="text-sm text-neutral-600 mb-4">
                    You have <span className="font-bold text-red-600">{dashboardStats.overdueTasks}</span> overdue {dashboardStats.overdueTasks === 1 ? "task" : "tasks"} across your projects that need immediate attention.
                  </p>
                  <Link
                    to="/pm/tasks/overdue"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                  >
                    <span>View Overdue Tasks</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-100 flex-shrink-0">
                  <CheckSquare size={24} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                    All Tasks On Track
                  </h2>
                  <p className="text-sm text-neutral-600">
                    Great work! All tasks are on schedule. Keep up the momentum!
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}