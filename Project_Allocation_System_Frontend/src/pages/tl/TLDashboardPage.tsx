import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchTLDashboard, fetchTLMyTasks } from "../../features/tl/tlSlice";
import {
  CheckSquare,
  Zap,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Users,
  Clock,
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

export default function TLDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardStats, tasks, loading, error } = useSelector(
    (state: RootState) => state.tl
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const { showError } = useToast();

  useEffect(() => {
    dispatch(fetchTLDashboard());
    dispatch(fetchTLMyTasks());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  if (loading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Team Lead Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Welcome back, {user?.firstName || "User"} • Manage your team and tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/tl/tasks"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <span className="text-sm font-medium">View All Tasks</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={CheckSquare}
            label="Assigned Tasks"
            value={dashboardStats.assignedTasks}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            trend={{ value: "Total", positive: true }}
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={dashboardStats.inProgressTasks}
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Completed"
            value={dashboardStats.completedTasks}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={dashboardStats.overdueTasks}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="lg:col-span-2 rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/tl/tasks/create"
              className="group flex items-center gap-4 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="p-3 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
                <CheckSquare size={20} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">Create Task</p>
                <p className="text-xs text-neutral-600">Assign new task to team</p>
              </div>
              <ArrowRight size={16} className="text-neutral-400 group-hover:text-primary-600 transition-colors" />
            </Link>

            <Link
              to="/tl/tasks/board"
              className="group flex items-center gap-4 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="p-3 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
                <CheckSquare size={20} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">Task Board</p>
                <p className="text-xs text-neutral-600">Kanban view of tasks</p>
              </div>
              <ArrowRight size={16} className="text-neutral-400 group-hover:text-primary-600 transition-colors" />
            </Link>

            <Link
              to="/tl/tasks/overdue"
              className="group flex items-center gap-4 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-red-300 hover:shadow-sm transition-all"
            >
              <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">Overdue Tasks</p>
                <p className="text-xs text-neutral-600">
                  {dashboardStats?.overdueTasks || 0} tasks need attention
                </p>
              </div>
              <ArrowRight size={16} className="text-neutral-400 group-hover:text-red-600 transition-colors" />
            </Link>

            <Link
              to="/tl/sprints"
              className="group flex items-center gap-4 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <Zap size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">Active Sprints</p>
                <p className="text-xs text-neutral-600">Monitor sprint progress</p>
              </div>
              <ArrowRight size={16} className="text-neutral-400 group-hover:text-purple-600 transition-colors" />
            </Link>
          </div>
        </section>

        {/* Team Stats */}
        <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Team Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-wide">Team Members</p>
                  <p className="text-xl font-bold text-neutral-900">
                    {dashboardStats?.teamMembers || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Zap size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-wide">Active Sprints</p>
                  <p className="text-xl font-bold text-neutral-900">
                    {dashboardStats?.activeSprints || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Tasks */}
      <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Tasks</h2>
          <Link
            to="/tl/tasks"
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare size={32} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <button
                key={task.taskId}
                onClick={() => navigate(`/tl/tasks/${task.taskId}`)}
                className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {task.taskCode}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 6
                        ? "bg-green-100 text-green-700"
                        : task.status === 2
                        ? "bg-blue-100 text-blue-700"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {task.status === 6 ? "Done" : task.status === 2 ? "In Progress" : "To Do"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Summary Section */}
      {dashboardStats && (
        <section className="rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Task Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-wide mb-1">
                    Assigned
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {dashboardStats.assignedTasks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-wide mb-1">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {dashboardStats.inProgressTasks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-wide mb-1">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardStats.completedTasks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-wide mb-1">
                    Overdue
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      dashboardStats.overdueTasks > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {dashboardStats.overdueTasks}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}