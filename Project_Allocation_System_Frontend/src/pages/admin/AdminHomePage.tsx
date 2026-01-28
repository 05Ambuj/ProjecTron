import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Activity,
  Shield,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { fetchAdminDashboardStats, fetchRecentAuditLogs } from "../../api/admin";
import type { AuditLogDto } from "../../types/adminTypes";

type Stats = {
  totalOrganizations: number;
  totalUsers: number;
  totalProjects: number;
  openTasks: number;
};

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  subtitle,
}: {
  label: string;
  value?: number;
  icon: React.ElementType;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
            <Icon size={24} className={`${gradient.includes('blue') ? 'text-blue-600' : gradient.includes('purple') ? 'text-purple-600' : gradient.includes('green') ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-bold text-neutral-900">
            {value?.toLocaleString() ?? "—"}
          </p>
          <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
            {label}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="h-32 rounded-xl bg-neutral-100 border border-neutral-200 animate-pulse" />
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  to,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon size={20} className={color.replace('bg-', 'text-').replace('-50', '-600')} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-neutral-600 mb-3">{description}</p>
          <div className="flex items-center text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
            View details
            <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SystemStatusCard({
  stats,
  loading,
  error,
}: {
  stats: Stats | null;
  loading: boolean;
  error: string | null;
}) {
  const systemStatus = error ? "Degraded" : loading ? "Loading..." : "Operational";
  const statusColor = error ? "text-amber-600" : "text-green-600";
  const statusBg = error ? "bg-amber-50" : "bg-green-50";

  const avgTasksPerProject =
    stats && stats.totalProjects > 0
      ? (stats.openTasks / stats.totalProjects).toFixed(1)
      : "—";

  const usersPerOrg =
    stats && stats.totalOrganizations > 0
      ? (stats.totalUsers / stats.totalOrganizations).toFixed(1)
      : "—";

  const metrics = [
    {
      label: "System Status",
      value: systemStatus,
      status: error ? "warning" : "success",
      icon: CheckCircle2,
    },
    {
      label: "Avg Tasks per Project",
      value: avgTasksPerProject,
      status: "info",
      icon: CheckSquare,
    },
    {
      label: "Avg Users per Org",
      value: usersPerOrg,
      status: "info",
      icon: Users,
    },
    {
      label: "Data Source",
      value: error ? "Unavailable" : "Live",
      status: error ? "warning" : "success",
      icon: Activity,
    },
  ];

  return (
    <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className={`p-2 rounded-lg ${statusBg}`}>
          <Shield size={20} className={statusColor} />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">System Status</h2>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const iconColor =
            metric.status === "success"
              ? "text-green-600"
              : metric.status === "warning"
                ? "text-amber-600"
                : "text-primary-600";
          const valueColor =
            metric.status === "success"
              ? "text-green-600"
              : metric.status === "warning"
                ? "text-amber-600"
                : "text-neutral-900";

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={iconColor} />
                <span className="text-sm font-medium text-neutral-700">
                  {metric.label}
                </span>
              </div>
              <span className={`text-sm font-semibold ${valueColor}`}>
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700">
            Unable to fetch real-time data. Showing cached or unavailable metrics.
          </p>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
      {helper && <p className="text-xs text-neutral-500 mt-1">{helper}</p>}
    </div>
  );
}

function RecentActivityCard() {
  const [activities, setActivities] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentAuditLogs(5)
      .then(setActivities)
      .catch(() => {
        // Silently fail - show empty state if API not available
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getActivityIcon = (entityType: string) => {
    const type = entityType.toLowerCase();
    if (type.includes("project")) return FolderKanban;
    if (type.includes("user")) return Users;
    if (type.includes("organization")) return Building2;
    if (type.includes("task")) return CheckSquare;
    return Activity;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const formatActivityMessage = (log: AuditLogDto) => {
    const action = log.action;
    const entityType = log.entityType;
    const description = log.description || `${action} on ${entityType}`;
    return description;
  };

  return (
    <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-purple-50">
          <Activity size={20} className="text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.entityType);
            return (
              <div
                key={activity.auditLogId}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-neutral-100 mt-0.5">
                  <Icon size={16} className="text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {formatActivityMessage(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500">
                      {formatTimeAgo(activity.createdDate)}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">{activity.userEmail}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        to="/admin/audit-logs"
        className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        View all activity
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAdminDashboardStats()
      .then((data) => {
        setStats(data);
        setLastUpdated(new Date());
      })
      .catch(() => setError("Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  const avgUsersPerOrg =
    stats && stats.totalOrganizations > 0
      ? (stats.totalUsers / stats.totalOrganizations).toFixed(1)
      : "—";

  const tasksPerProject =
    stats && stats.totalProjects > 0
      ? (stats.openTasks / stats.totalProjects).toFixed(1)
      : "—";

  const projectsPerOrg =
    stats && stats.totalOrganizations > 0
      ? (stats.totalProjects / stats.totalOrganizations).toFixed(1)
      : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            System-wide overview and operational summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs text-neutral-500">
              Last refreshed{" "}
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 border border-primary-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-primary-700">
              All systems operational
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Organizations"
                value={stats?.totalOrganizations}
                icon={Building2}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                subtitle="Active organizations in the system"
              />
              <StatCard
                label="Total Users"
                value={stats?.totalUsers}
                icon={Users}
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                subtitle="All user accounts across orgs"
              />
              <StatCard
                label="Active Projects"
                value={stats?.totalProjects}
                icon={FolderKanban}
                gradient="bg-gradient-to-br from-green-500 to-green-600"
                subtitle="Projects currently being tracked"
              />
              <StatCard
                label="Open Tasks"
                value={stats?.openTasks}
                icon={CheckSquare}
                gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                subtitle="Tasks not yet completed"
              />
            </>
          )}
        </div>
      </section>

      {/* Operational insights */}
      {!loading && stats && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Operational Insights</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <TrendingUp size={14} />
              Live from current stats
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InsightCard
              title="Users per Organization"
              value={avgUsersPerOrg?.toString()}
              helper="Average active users across organizations"
            />
            <InsightCard
              title="Open Tasks per Project"
              value={tasksPerProject?.toString()}
              helper="Workload distribution across projects"
            />
            <InsightCard
              title="Projects per Organization"
              value={projectsPerOrg?.toString()}
              helper="Portfolio spread across organizations"
            />
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Manage Organizations"
            description="View and manage all organizations"
            icon={Building2}
            to="/admin/organizations"
            color="bg-blue-50"
          />
          <QuickActionCard
            title="Users & Roles"
            description="Manage user accounts and permissions"
            icon={Users}
            to="/admin/users"
            color="bg-purple-50"
          />
          <QuickActionCard
            title="All Projects"
            description="Monitor and manage projects"
            icon={FolderKanban}
            to="/admin/projects"
            color="bg-green-50"
          />
          <QuickActionCard
            title="My Account"
            description="View and update your admin profile"
            icon={Shield}
            to="/profile"
            color="bg-amber-50"
          />
        </div>
      </section>

      {/* Activity and Status */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard />
        <SystemStatusCard stats={stats} loading={loading} error={error} />
      </section>
    </div>
  );
}
