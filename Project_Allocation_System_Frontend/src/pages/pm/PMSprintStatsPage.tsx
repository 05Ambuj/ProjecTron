import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchSprintStats, fetchSprintsByProject } from "../../features/pm/sprintSlice";
import { deleteSprint, fetchSprintById } from "../../api/sprint";
import { ArrowLeft, TrendingUp, CheckSquare, Users, Zap, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "../../contexts/useToast";
import { UserRole } from "../../constants/roles";
import { canManageProjects } from "../../utils/permission";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { fetchTLProjects } from "../../api/tl";
import type { ProjectDto } from "../../types/adminTypes";

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Delete Sprint</h3>
              <p className="text-sm text-neutral-500">This action cannot be undone</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-4">
          <p className="text-sm text-neutral-700">
            Are you sure you want to delete this sprint? All tasks in this sprint will be unassigned.
          </p>
        </div>
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-neutral-300 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-neutral-100 rounded-lg">
          <Icon size={18} className="text-neutral-700" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-neutral-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-neutral-600">{subtitle}</p>}
    </div>
  );
}

export default function PMSprintStatsPage() {
  const { sprintId } = useParams<{ sprintId?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { sprintStats, sprints, loading } = useSelector((state: RootState) => state.sprint);
  const { projects: pmProjects } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const { showError, showSuccess } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState<string>(sprintId ?? "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localProjects, setLocalProjects] = useState<ProjectDto[]>([]);

  // Use PM projects from Redux for PM/Admin, local state for TL/TM
  const projects = user && canManageProjects(user.role as UserRole) ? pmProjects : localProjects;

  const stats =
    sprintStats && sprintStats.sprintId === selectedSprintId ? sprintStats : null;
  const isLoading = loading && !!selectedSprintId;

  // Get the correct back link based on user role
  const getBackLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case UserRole.Admin:
        return "/admin/projects";
      case UserRole.ProjectManager:
        return "/pm/sprints/active";
      case UserRole.TeamLead:
        return "/tl/sprints/active";
      case UserRole.TeamMember:
        return "/tm/sprints/active";
      default:
        return "/login";
    }
  };

  // Load projects based on user role
  useEffect(() => {
    if (!user) return;
    
    if (canManageProjects(user.role as UserRole)) {
      // PM/Admin - use Redux action
      dispatch(fetchPMProjects({ page: 1, pageSize: 100, actorRole: user.role as UserRole }));
    } else {
      // TL/TM - fetch assigned projects
      const loadAssignedProjects = async () => {
        try {
          const data = await fetchTLProjects();
          setLocalProjects(data);
        } catch {
          // Ignore errors, projects will be empty
        }
      };
      loadAssignedProjects();
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!sprintId) return;
    const sprintIdValue = sprintId;
    let cancelled = false;
    async function loadSprint() {
      try {
        const sprint = await fetchSprintById(sprintIdValue);
        if (cancelled) return;
        setSelectedProjectId(sprint.projectId);
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load sprint");
        }
      }
    }
    loadSprint();
    return () => {
      cancelled = true;
    };
  }, [sprintId, showError]);

  useEffect(() => {
    if (!selectedProjectId) return;
    dispatch(fetchSprintsByProject(selectedProjectId));
  }, [dispatch, selectedProjectId]);

  useEffect(() => {
    if (!selectedSprintId) return;
    dispatch(fetchSprintStats(selectedSprintId));
  }, [dispatch, selectedSprintId]);

  const handleDelete = () => {
    if (!selectedSprintId || !user) return;
    if (!canManageProjects(user.role as UserRole)) {
      showError("You do not have permission to delete sprints");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSprintId || !user) return;

    try {
      setIsDeleting(true);
      await deleteSprint(selectedSprintId, user.role as UserRole);
      showSuccess("Sprint deleted");
      setShowDeleteModal(false);
      navigate(getBackLink());
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete sprint");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-sm text-neutral-600">Loading sprint statistics...</div>
      </div>
    );
  }

  if (selectedSprintId && !stats) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="bg-white border border-neutral-300 rounded-lg p-6">
          <p className="text-sm text-neutral-600">Sprint statistics not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back & Actions */}
        <div className="flex items-center justify-between">
          <Link
            to={getBackLink()}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            Back to sprints
          </Link>

          {user && canManageProjects(user.role as UserRole) && selectedSprintId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/pm/sprints/${selectedSprintId}/edit`)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50"
              >
                Edit Sprint
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              >
                Delete Sprint
              </button>
            </div>
          )}
        </div>

        {/* Sprint Selection */}
        <div className="bg-white border border-neutral-300 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedSprintId("");
                }}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Sprint
              </label>
              <select
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                disabled={!selectedProjectId}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
              >
                <option value="">Select a sprint...</option>
                {sprints.map((sprint) => (
                  <option key={sprint.sprintId} value={sprint.sprintId}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!loading && selectedProjectId && sprints.length === 0 && (
            <p className="text-xs text-neutral-500 mt-3">
              No sprints available for this project.
            </p>
          )}
        </div>

        {!stats && (
          <div className="bg-white border border-neutral-300 rounded-lg p-8 text-center text-sm text-neutral-600">
            Select a sprint to view its statistics.
          </div>
        )}

        {stats && (
          <>
            {/* Header */}
            <header className="bg-white border border-neutral-300 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-neutral-900 text-white rounded-lg">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">{stats.sprintName}</h1>
                  <p className="text-sm text-neutral-600">Sprint Statistics & Performance</p>
                </div>
              </div>
            </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Zap}
            label="Story Points"
            value={`${stats.completedStoryPoints}/${stats.totalStoryPoints}`}
            subtitle={`${stats.remainingStoryPoints} remaining`}
          />

          <StatCard
            icon={CheckSquare}
            label="Tasks Completed"
            value={`${stats.completedTasks}/${stats.totalTasks}`}
            subtitle={`${stats.inProgressTasks} in progress`}
          />

          <StatCard
            icon={TrendingUp}
            label="Team Velocity"
            value={stats.teamVelocity.toFixed(1)}
            subtitle="Story points per day"
          />

          <StatCard
            icon={Clock}
            label="Avg Completion Time"
            value={`${stats.averageTaskCompletionTime.toFixed(1)}h`}
            subtitle="Per task"
          />
        </div>

        {/* Tasks by Status */}
        <div className="bg-white border border-neutral-300 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
            Tasks by Status
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.tasksByStatus).map(([status, count]) => (
              <div key={status} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <p className="text-2xl font-semibold text-neutral-900 mb-1">{count}</p>
                <p className="text-xs text-neutral-600">{status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white border border-neutral-300 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
            Tasks by Priority
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.tasksByPriority).map(([priority, count]) => (
              <div key={priority} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <p className="text-2xl font-semibold text-neutral-900 mb-1">{count}</p>
                <p className="text-xs text-neutral-600">{priority} Priority</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Member Progress */}
        <div className="bg-white border border-neutral-300 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4 flex items-center gap-2">
            <Users size={14} />
            Team Member Progress
          </h2>

          {stats.memberProgress.length === 0 ? (
            <p className="text-sm text-neutral-600 text-center py-8">
              No team members assigned to this sprint
            </p>
          ) : (
            <div className="space-y-4">
              {stats.memberProgress.map((member) => (
                <div key={member.userId} className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{member.userName}</p>
                      <p className="text-xs text-neutral-600">
                        {member.completedTasks}/{member.assignedTasks} tasks completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {member.completedStoryPoints}/{member.allocatedStoryPoints} SP
                      </p>
                      <p className="text-xs text-neutral-600">
                        {member.completionPercentage.toFixed(0)}% complete
                      </p>
                    </div>
                  </div>

                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 transition-all"
                      style={{ width: `${member.completionPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}