import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import api from "../../api/client";
import { FolderKanban, CheckSquare, AlertTriangle, Clock } from "lucide-react";
import type { ApiResponse } from "../../types/types";
import LoadingPage from "../../components/common/LoadingPage";

interface ProjectManagerDashboardDto {
  projectsCount: number;
  activeSprints: number;
  openTasks: number;
  overdueTasks: number;
}

interface TaskDto {
  taskId: string;
  title: string;
  projectName?: string;
  statusDisplay: string;
  dueDate?: string;
  isOverdue: boolean;
}

/* ===================== COMPONENT ===================== */

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [stats, setStats] = useState<ProjectManagerDashboardDto | null>(null);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===================== DATA LOAD ===================== */

useEffect(() => {
  async function loadDashboard() {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get<ApiResponse<ProjectManagerDashboardDto>>(
          "/project-manager/dashboard"
        ),
        api.get<ApiResponse<TaskDto[]>>("/tasks/my-tasks"),
      ]);

      if (!statsRes.data.success || !statsRes.data.data) {
        throw new Error(
          statsRes.data.message || "Failed to load dashboard stats"
        );
      }

      if (!tasksRes.data.success || !tasksRes.data.data) {
        throw new Error(
          tasksRes.data.message || "Failed to load tasks"
        );
      }

      setStats(statsRes.data.data);
      setTasks(tasksRes.data.data.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);

  if (loading || !stats) {
    return <LoadingPage message="Loading dashboard..." fullScreen={false} />;
  }

  /* ===================== UI ===================== */

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="text-sm text-neutral-500">
          Here is an overview of your work
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={FolderKanban}
          label="My Projects"
          value={stats.projectsCount}
        />
        <StatCard
          icon={Clock}
          label="Active Sprints"
          value={stats.activeSprints}
        />
        <StatCard
          icon={CheckSquare}
          label="Open Tasks"
          value={stats.openTasks}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={stats.overdueTasks}
          danger
        />
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">My Recent Tasks</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">
            No tasks assigned yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-6 py-3 text-left">Task</th>
                <th className="px-6 py-3 text-left">Project</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Due</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId} className="border-t hover:bg-neutral-50">
                  <td className="px-6 py-3 font-medium">{task.title}</td>
                  <td className="px-6 py-3">{task.projectName ?? "—"}</td>
                  <td className="px-6 py-3">{task.statusDisplay}</td>
                  <td className="px-6 py-3">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ===================== REUSABLE CARD ===================== */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  danger?: boolean;
}

function StatCard({ icon: Icon, label, value, danger }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 bg-white ${
        danger ? "border-red-200" : "border-neutral-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-lg ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-semibold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
