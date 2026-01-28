import { useEffect, useMemo, useState } from "react";
import { fetchAdminProjects, fetchProjectTasks } from "../../api/admin";
import type { ProjectDto, TaskDTO } from "../../types/adminTypes";
import LoadingPage from "../../components/common/LoadingPage";

type ProjectReportRow = {
  projectId: string;
  name: string;
  code: string;
  managerName?: string;
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
};

export default function ReportsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [projectsRes, tasksRes] = await Promise.all([
          fetchAdminProjects(1, 200),
          fetchProjectTasks(),
        ]);

        if (!cancelled) {
          setProjects(projectsRes.items || []);
          setTasks(tasksRes.data?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reports");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const reportRows = useMemo<ProjectReportRow[]>(() => {
    const grouped: Record<string, ProjectReportRow> = {};
    projects.forEach((project) => {
      grouped[project.projectId] = {
        projectId: project.projectId,
        name: project.name,
        code: project.code,
        managerName: project.projectManagerName,
        totalTasks: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        completionRate: project.progressPercentage ?? 0,
      };
    });

    tasks.forEach((task) => {
      const row = grouped[task.projectId];
      if (!row) return;
      row.totalTasks += 1;
      if (task.status === 2) row.inProgress += 1;
      if (task.status === 6) row.completed += 1;
      if (task.isOverdue) row.overdue += 1;
    });

    Object.values(grouped).forEach((row) => {
      // Keep completion rate from project progress percentage
      row.completionRate = Math.max(0, Math.min(100, row.completionRate));
    });

    return Object.values(grouped);
  }, [projects, tasks]);

  const totals = useMemo(() => {
    const totalProjects = reportRows.length;
    const totalTasks = reportRows.reduce((sum, row) => sum + row.totalTasks, 0);
    const completed = reportRows.reduce((sum, row) => sum + row.completed, 0);
    const overdue = reportRows.reduce((sum, row) => sum + row.overdue, 0);
    return { totalProjects, totalTasks, completed, overdue };
  }, [reportRows]);

  if (loading) {
    return <LoadingPage message="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Project delivery overview and task health.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Projects" value={totals.totalProjects} />
        <StatCard label="Total Tasks" value={totals.totalTasks} />
        <StatCard label="Completed" value={totals.completed} accent="text-green-600" />
        <StatCard label="Overdue" value={totals.overdue} accent="text-red-600" />
      </div>

      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr className="text-left text-neutral-600">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Tasks</th>
              <th className="px-4 py-3">In Progress</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3">Completion</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row) => (
              <tr key={row.projectId} className="border-b border-neutral-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{row.name}</div>
                  <div className="text-xs text-neutral-500 font-mono">{row.code}</div>
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {row.managerName || "—"}
                </td>
                <td className="px-4 py-3">{row.totalTasks}</td>
                <td className="px-4 py-3">{row.inProgress}</td>
                <td className="px-4 py-3 text-green-700">{row.completed}</td>
                <td className="px-4 py-3 text-red-700">{row.overdue}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-neutral-900"
                        style={{ width: `${row.completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-600">
                      {row.completionRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {reportRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  No projects available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-4">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-semibold text-neutral-900 ${accent ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
