import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchTMDashboard, fetchTMMyTasks } from "../../features/tm/tmSlice";
import {
  CheckSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  FolderKanban,
  Timer,
  Calendar,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";
import LoadingPage from "../../components/common/LoadingPage";
import { useToast } from "../../contexts/useToast";

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

export default function TMDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardStats, myTasks, loading, error } = useSelector(
    (state: RootState) => state.tm
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const { showError } = useToast();

  useEffect(() => {
    dispatch(fetchTMDashboard());
    dispatch(fetchTMMyTasks());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  if (loading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  const inProgressTasks = myTasks.filter(t => t.status === 2); // In Progress = 2 (backend enum)
  const todoTasks = myTasks.filter(t => t.status === 1); // Not Started = 1 (backend enum)
  const overdueTasks = myTasks.filter(t => t.isOverdue);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-red-100 text-red-700 border-red-200"; // Critical
      case 2: return "bg-orange-100 text-orange-700 border-orange-200"; // High
      case 3: return "bg-yellow-100 text-yellow-700 border-yellow-200"; // Medium
      case 4: return "bg-blue-100 text-blue-700 border-blue-200"; // Low
      default: return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Critical";
      case 2: return "High";
      case 3: return "Medium";
      case 4: return "Low";
      default: return "Medium";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Team Member Dashboard
          </h1>
          <p className="text-base text-neutral-600">
            Welcome back, <span className="font-semibold text-neutral-900">{user?.firstName || "User"}</span> • Here's what you're working on
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/tm/tasks/my-tasks"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md"
          >
            <span className="text-sm font-medium">View My Tasks</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={CheckSquare}
            label="My Tasks"
            value={dashboardStats.myTasks}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            trend={{ value: "Total", positive: true }}
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={dashboardStats.inProgressTasks}
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
            trend={
              dashboardStats.inProgressTasks > 0
                ? { value: "Active", positive: true }
                : undefined
            }
          />
          <StatCard
            icon={TrendingUp}
            label="Completed"
            value={dashboardStats.completedTasks}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            trend={
              dashboardStats.completedTasks > 0
                ? { value: "Done", positive: true }
                : undefined
            }
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
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
              to="/tm/tasks/my-tasks"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-all shadow-sm">
                <CheckSquare size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors">My Tasks</p>
                <p className="text-xs text-neutral-600 mt-0.5">View all assigned tasks</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/tm/tasks/board"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-purple-400 hover:bg-purple-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 group-hover:from-purple-600 group-hover:to-purple-700 transition-all shadow-sm">
                <BarChart3 size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-purple-700 transition-colors">Task Board</p>
                <p className="text-xs text-neutral-600 mt-0.5">Kanban view</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/tm/projects"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-green-400 hover:bg-green-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 group-hover:from-green-600 group-hover:to-green-700 transition-all shadow-sm">
                <FolderKanban size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-green-700 transition-colors">My Projects</p>
                <p className="text-xs text-neutral-600 mt-0.5">View project details</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-green-600 transition-colors flex-shrink-0" />
            </Link>

            <Link
              to="/tm/sprints"
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-neutral-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 group-hover:from-amber-600 group-hover:to-amber-700 transition-all shadow-sm">
                <Zap size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-amber-700 transition-colors">Active Sprints</p>
                <p className="text-xs text-neutral-600 mt-0.5">View sprint progress</p>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
            </Link>
          </div>
        </section>

        {/* Work Summary */}
        <section className="rounded-xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} className="text-neutral-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Work Summary</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <Timer size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-600 uppercase tracking-wide font-medium">Hours Logged</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {dashboardStats?.hoursLogged?.toFixed(1) || "0.0"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-purple-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                  <FolderKanban size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-600 uppercase tracking-wide font-medium">Active Projects</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {dashboardStats?.activeProjects || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* My Tasks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* To Do Tasks */}
        <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-neutral-100">
                <CheckSquare size={18} className="text-neutral-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">To Do</h2>
            </div>
            <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
              {todoTasks.length}
            </span>
          </div>
          {todoTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-neutral-100 w-fit mx-auto mb-3">
                <CheckSquare size={32} className="text-neutral-300" />
              </div>
              <p className="text-sm font-medium text-neutral-500">No tasks to do</p>
              <p className="text-xs text-neutral-400 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todoTasks.slice(0, 5).map((task) => (
                <button
                  key={task.taskId}
                  onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
                  className="w-full text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-blue-700 transition-colors mb-1">
                        {task.title}
                      </h3>
                      {task.projectName && (
                        <p className="text-xs text-neutral-500 font-medium truncate">
                          {task.projectName}
                        </p>
                      )}
                    </div>
                    {task.priority && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md border flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span className={task.isOverdue ? "text-red-600 font-semibold" : ""}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {task.storyPoints > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Target size={14} />
                        <span>{task.storyPoints} pts</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {todoTasks.length > 5 && (
                <Link
                  to="/tm/tasks/my-tasks"
                  className="block text-center py-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View all {todoTasks.length} tasks →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* In Progress Tasks */}
        <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock size={18} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">In Progress</h2>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              {inProgressTasks.length}
            </span>
          </div>
          {inProgressTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-amber-100 w-fit mx-auto mb-3">
                <Clock size={32} className="text-amber-300" />
              </div>
              <p className="text-sm font-medium text-neutral-500">No tasks in progress</p>
              <p className="text-xs text-neutral-400 mt-1">Start a task to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressTasks.slice(0, 5).map((task) => (
                <button
                  key={task.taskId}
                  onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
                  className="w-full text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-amber-700 transition-colors mb-1">
                        {task.title}
                      </h3>
                      {task.projectName && (
                        <p className="text-xs text-neutral-500 font-medium truncate">
                          {task.projectName}
                        </p>
                      )}
                    </div>
                    {task.priority && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md border flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    )}
                  </div>
                  {task.progressPercentage > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-neutral-600">Progress</span>
                        <span className="text-xs font-semibold text-neutral-900">{task.progressPercentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                          style={{ width: `${task.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span className={task.isOverdue ? "text-red-600 font-semibold" : ""}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {task.storyPoints > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Target size={14} />
                        <span>{task.storyPoints} pts</span>
                      </div>
                    )}
                    {task.actualHours > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Timer size={14} />
                        <span>{task.actualHours.toFixed(1)}h</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {inProgressTasks.length > 5 && (
                <Link
                  to="/tm/tasks/my-tasks"
                  className="block text-center py-3 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  View all {inProgressTasks.length} tasks →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <section className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-100 flex-shrink-0">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Overdue Tasks Require Attention
              </h2>
              <p className="text-sm text-neutral-600 mb-4">
                You have {overdueTasks.length} overdue {overdueTasks.length === 1 ? "task" : "tasks"} that need immediate attention.
              </p>
              <div className="flex flex-wrap gap-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.taskId}
                    onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 text-sm font-medium text-neutral-900 transition-all"
                  >
                    {task.title}
                  </button>
                ))}
                {overdueTasks.length > 3 && (
                  <Link
                    to="/tm/tasks/my-tasks?filter=overdue"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all"
                  >
                    View All {overdueTasks.length} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
