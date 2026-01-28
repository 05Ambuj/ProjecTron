import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { fetchSprintsByProject } from "../../features/pm/sprintSlice";
import { Zap, Calendar } from "lucide-react";
import type { SprintDTO } from "../../types/sprintTypes";
import { UserRole } from "../../constants/roles";

const STATUS_LABELS: Record<number, string> = {
  0: "Planned",
  1: "Active",
  2: "Completed",
  3: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  0: "bg-slate-100 text-slate-700 border-slate-200",
  1: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-green-100 text-green-700 border-green-200",
  3: "bg-red-100 text-red-700 border-red-200",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeStatusValue(sprint: SprintDTO) {
  const numericStatus = Number(sprint.status);
  if (Number.isFinite(numericStatus)) {
    return numericStatus;
  }

  const display = sprint.statusDisplay?.toLowerCase().trim();
  if (!display) {
    return undefined;
  }

  if (display.includes("active") || display.includes("in progress")) {
    return 1;
  }
  if (display.includes("planned")) {
    return 0;
  }
  if (display.includes("completed") || display.includes("done")) {
    return 2;
  }
  if (display.includes("cancelled") || display.includes("canceled")) {
    return 3;
  }

  return undefined;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

function getDaysRemaining(sprint: SprintDTO, statusValue?: number) {
  if (statusValue !== 1) return null;
  const targetEndDate = sprint.actualEndDate || sprint.endDate;
  if (!targetEndDate) return null;
  const endDate = new Date(targetEndDate);
  if (Number.isNaN(endDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((endDate.getTime() - today.getTime()) / DAY_MS);
  return Math.max(0, diff);
}

function SprintCard({ sprint }: { sprint: SprintDTO }) {
  const statusValue = normalizeStatusValue(sprint);
  const statusLabel =
    sprint.statusDisplay?.trim() ||
    (statusValue !== undefined ? STATUS_LABELS[statusValue] : undefined) ||
    "Unknown";
  const statusColor =
    (statusValue !== undefined && STATUS_COLORS[statusValue]) ||
    "bg-neutral-100 text-neutral-700 border-neutral-200";
  const totalStoryPoints = Math.max(0, Number(sprint.totalStoryPoints) || 0);
  const completedStoryPoints = Math.max(
    0,
    Number(sprint.completedStoryPoints) || 0,
  );
  const progressPercentage =
    totalStoryPoints > 0
      ? Math.min(
          100,
          Math.round((completedStoryPoints / totalStoryPoints) * 100),
        )
      : 0;
  const totalTasks = Math.max(0, Number(sprint.totalTasks) || 0);
  const completedTasks = Math.max(0, Number(sprint.completedTasks) || 0);
  const teamMemberCount = Math.max(
    Number(sprint.teamMemberCount) || 0,
    sprint.members?.length || 0,
  );
  const daysRemaining = getDaysRemaining(sprint, statusValue);
  const startDate = sprint.actualStartDate || sprint.startDate;
  const endDate = sprint.actualEndDate || sprint.endDate;

  return (
    <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-primary-50">
            <Zap size={20} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">{sprint.name}</h3>
              {statusValue === 1 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  <Zap size={10} />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 truncate">{sprint.projectName}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Goals */}
      <p className="text-sm text-neutral-700 mb-4 line-clamp-2">{sprint.goals}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-700">Story Points Progress</span>
          <span className="text-xs font-semibold text-neutral-900">
            {completedStoryPoints}/{totalStoryPoints}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Tasks</p>
          <p className="text-sm font-semibold text-neutral-900">
            {completedTasks}/{totalTasks}
          </p>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-1">Team</p>
          <p className="text-sm font-semibold text-neutral-900">{teamMemberCount}</p>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-1">Days Left</p>
          <p className="text-sm font-semibold text-neutral-900">
            {statusValue === 1 && daysRemaining !== null ? daysRemaining : "-"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Calendar size={14} />
          <span>
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>

        <Link
          to={`/pm/sprints/${sprint.sprintId}/stats`}
          className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
        >
          View Stats →
        </Link>
      </div>
    </div>
  );
}

export default function PMSprintsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.pm);
  const { sprints, loading } = useSelector((state: RootState) => state.sprint);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    if (!user || !token || user.role !== UserRole.ProjectManager) return;
    dispatch(fetchPMProjects({ page: 1, pageSize: 100, actorRole: user.role as UserRole }));
  }, [dispatch, user, token]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchSprintsByProject(selectedProjectId));
    }
  }, [dispatch, selectedProjectId]);

  const activeSprints = sprints.filter((s) => normalizeStatusValue(s) === 1);
  const plannedSprints = sprints.filter((s) => normalizeStatusValue(s) === 0);
  const completedSprints = sprints.filter((s) => normalizeStatusValue(s) === 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Active Sprints</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Monitor ongoing and upcoming sprints
          </p>
        </div>
        <Link
          to="/pm/sprints/planning"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          <Zap size={18} />
          <span className="text-sm font-medium">Plan Sprint</span>
        </Link>
      </header>

      {/* Project Filter */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Filter by Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select a project...</option>
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <p className="text-sm text-neutral-600">Loading sprints...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !selectedProjectId && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <Zap size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            Select a project
          </p>
          <p className="text-sm text-neutral-500">
            Choose a project from the dropdown to view its sprints
          </p>
        </div>
      )}

      {!loading && selectedProjectId && sprints.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <Zap size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">No sprints found</p>
          <p className="text-sm text-neutral-500 mb-4">
            This project doesn't have any sprints yet
          </p>
          <Link
            to="/pm/sprints/planning"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <Zap size={16} />
            Create First Sprint
          </Link>
        </div>
      )}

      {/* Active Sprints */}
      {!loading && activeSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
            Active ({activeSprints.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSprints.map((sprint) => (
              <SprintCard key={sprint.sprintId} sprint={sprint} />
            ))}
          </div>
        </section>
      )}

      {/* Planned Sprints */}
      {!loading && plannedSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
            Planned ({plannedSprints.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plannedSprints.map((sprint) => (
              <SprintCard key={sprint.sprintId} sprint={sprint} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Sprints */}
      {!loading && completedSprints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
            Completed ({completedSprints.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedSprints.map((sprint) => (
              <SprintCard key={sprint.sprintId} sprint={sprint} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}